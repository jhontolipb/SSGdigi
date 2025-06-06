
"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { ClipboardCheck, Users, CalendarDays, Percent, Download, UserPlus, AlertTriangle, CheckCircle2, Check } from "lucide-react"; // Added Check
import type { Event, AttendanceRecord as AttendanceRecordType } from '@/types/user';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';


const initialEvents: Event[] = []; 
const initialAttendance: Record<string, AttendanceRecordType[]> = {};

interface AttendanceSummary {
    present: number;
    absent: number;
    late: number;
    total: number;
    attendanceRate: number;
}

export default function AttendanceMonitoringPage() {
  const { allEvents, allUsers } = useAuth(); 
  const [events, setEvents] = useState<Event[]>(allEvents || initialEvents);
  const [selectedEventId, setSelectedEventId] = useState<string>('');
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecordType[]>([]);
  const [summary, setSummary] = useState<AttendanceSummary | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const [isAddOICDialogOpen, setIsAddOICDialogOpen] = useState(false);
  const [newOICFullName, setNewOICFullName] = useState('');
  const [newOICEmail, setNewOICEmail] = useState('');
  const [isAddingOIC, setIsAddingOIC] = useState(false);

  const { addNewOIC } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
     setEvents(allEvents || initialEvents);
     if ((allEvents || initialEvents).length > 0 && !selectedEventId) {
        setSelectedEventId((allEvents || initialEvents)[0].id);
     }
  }, [allEvents, selectedEventId]);

  useEffect(() => {
    if (selectedEventId) {
      const eventForAttendance = allEvents.find(e => e.id === selectedEventId);
      let records: AttendanceRecordType[] = []; // This would typically be fetched

      // Mock populating attendance records if event exists and students are present
      // For demo, let's assume some students attended if an event is selected
      if (eventForAttendance) {
        const students = allUsers.filter(u => u.role === 'student');
        // This is a very basic mock, doesn't reflect real attendance logic
        records = students.slice(0, 5).map((student, index) => ({
            id: `att_${eventForAttendance.id}_${student.userID}`,
            eventID: eventForAttendance.id,
            studentUserID: student.userID,
            timeIn: '09:00 AM',
            timeOut: index % 2 === 0 ? '05:00 PM' : null,
            status: index % 3 === 0 ? 'absent' : (index % 3 === 1 ? 'late' : 'present'),
            scannedByOICUserID: eventForAttendance.oicIds.length > 0 ? eventForAttendance.oicIds[0] : 'oic_unknown'
        }));
      }
      
      const filteredRecords = records.filter(r => 
        (r.studentUserID && (allUsers.find(u=>u.userID === r.studentUserID)?.fullName.toLowerCase() || r.studentUserID.toLowerCase()).includes(searchTerm.toLowerCase()))
      );
      setAttendanceRecords(filteredRecords);

      const presentCount = records.filter(r => r.status === 'present' || r.status === 'late').length;
      const absentCount = records.filter(r => r.status === 'absent').length;
      const lateCount = records.filter(r => r.status === 'late').length;
      // const totalRecorded = records.length; 
      // For a more accurate attendance rate, total should be expected attendees, not just recorded.
      // For this mock, we'll use totalRecorded.
      const totalExpected = allUsers.filter(u=> u.role === 'student').length; // Example: all students expected
      const attendanceRateValue = totalExpected > 0 ? (presentCount / totalExpected) * 100 : 0;
      
      setSummary({ present: presentCount, absent: absentCount, late: lateCount, total: totalExpected, attendanceRate: attendanceRateValue });

    } else {
      setAttendanceRecords([]);
      setSummary(null);
    }
  }, [selectedEventId, searchTerm, allEvents, allUsers]);

  const selectedEvent = events.find(e => e.id === selectedEventId);

  const handleAddOICSubmit = async () => {
    if (!newOICFullName.trim() || !newOICEmail.trim()) {
      toast({
        title: "Validation Error",
        description: "Full name and email are required for the new OIC.",
        variant: "destructive",
      });
      return;
    }
    if (!/\S+@\S+\.\S+/.test(newOICEmail)) {
        toast({
            title: "Validation Error",
            description: "Please enter a valid email address.",
            variant: "destructive",
        });
        return;
    }

    setIsAddingOIC(true);
    const result = await addNewOIC(newOICFullName, newOICEmail);
    setIsAddingOIC(false);

    if (result.success) {
      toast({
        title: "OIC Added",
        description: result.message,
        variant: "default",
        action: <CheckCircle2 />
      });
      setNewOICFullName('');
      setNewOICEmail('');
      setIsAddOICDialogOpen(false);
    } else {
      toast({
        title: "Error Adding OIC",
        description: result.message,
        variant: "destructive",
        action: <AlertTriangle />
      });
    }
  };


  return (
    <div className="space-y-6">
      <Card className="shadow-lg">
        <CardHeader>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <CardTitle className="text-2xl font-headline flex items-center gap-2">
                <ClipboardCheck className="text-primary h-7 w-7" /> Attendance Monitoring
              </CardTitle>
              <CardDescription>View and filter attendance records for all events.</CardDescription>
            </div>
            <Dialog open={isAddOICDialogOpen} onOpenChange={setIsAddOICDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="mt-2 md:mt-0">
                  <UserPlus className="mr-2 h-4 w-4" /> Add New OIC
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Add New Officer-in-Charge (OIC)</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div>
                    <Label htmlFor="oicFullName">Full Name</Label>
                    <Input 
                      id="oicFullName" 
                      value={newOICFullName} 
                      onChange={(e) => setNewOICFullName(e.target.value)} 
                      placeholder="e.g., Juan Dela Cruz" 
                    />
                  </div>
                  <div>
                    <Label htmlFor="oicEmail">Email Address</Label>
                    <Input 
                      id="oicEmail" 
                      type="email" 
                      value={newOICEmail} 
                      onChange={(e) => setNewOICEmail(e.target.value)} 
                      placeholder="e.g., juan.oic@example.com"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsAddOICDialogOpen(false)}>Cancel</Button>
                  <Button onClick={handleAddOICSubmit} disabled={isAddingOIC} className="bg-primary hover:bg-primary/90">
                    {isAddingOIC ? "Adding..." : "Add OIC"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 mb-6 items-center">
            <Select value={selectedEventId} onValueChange={setSelectedEventId}>
              <SelectTrigger className="md:w-[300px]">
                <SelectValue placeholder="Select an Event" />
              </SelectTrigger>
              <SelectContent>
                {events.length === 0 && <SelectItem value="no-events" disabled>No events available</SelectItem>}
                {events.map(event => (
                  <SelectItem key={event.id} value={event.id}>{event.name} ({event.date})</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input 
              placeholder="Search by student name or ID..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1"
            />
             <Button variant="outline" disabled><Download className="mr-2 h-4 w-4" /> Export Data</Button>
          </div>

          {selectedEvent && summary && (
            <Card className="mb-6 bg-muted/30">
              <CardHeader>
                <CardTitle className="text-xl">Attendance Summary for: {selectedEvent.name}</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                <div><Users className="mx-auto h-6 w-6 text-primary mb-1"/><p className="text-2xl font-bold">{summary.total}</p><p className="text-sm text-muted-foreground">Total Expected</p></div>
                <div><Check className="mx-auto h-6 w-6 text-green-500 mb-1"/><p className="text-2xl font-bold">{summary.present}</p><p className="text-sm text-muted-foreground">Present</p></div>
                <div><Users className="mx-auto h-6 w-6 text-red-500 mb-1"/><p className="text-2xl font-bold">{summary.absent}</p><p className="text-sm text-muted-foreground">Absent</p></div>
                <div><Percent className="mx-auto h-6 w-6 text-blue-500 mb-1"/><p className="text-2xl font-bold">{summary.attendanceRate.toFixed(1)}%</p><p className="text-sm text-muted-foreground">Attendance Rate</p></div>
              </CardContent>
            </Card>
          )}
          
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow><TableHead>Student Name/ID</TableHead><TableHead>Time In</TableHead><TableHead>Time Out</TableHead><TableHead>Status</TableHead><TableHead>Scanned By (OIC ID)</TableHead></TableRow>
              </TableHeader>
              <TableBody>
                {attendanceRecords.length > 0 ? (
                  attendanceRecords.map((record) => {
                    const studentUser = allUsers.find(u => u.userID === record.studentUserID);
                    return (
                    <TableRow key={record.id}><TableCell className="font-medium">{studentUser?.fullName || record.studentUserID}</TableCell><TableCell>{record.timeIn || 'N/A'}</TableCell><TableCell>{record.timeOut || 'N/A'}</TableCell><TableCell><span className={`px-2 py-1 text-xs rounded-full font-semibold
                        ${record.status === 'present' ? 'bg-green-100 text-green-700' :
                          record.status === 'absent' ? 'bg-red-100 text-red-700' :
                          record.status === 'late' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-gray-100 text-gray-700'}`}>{record.status.charAt(0).toUpperCase() + record.status.slice(1)}</span></TableCell><TableCell>{record.scannedByOICUserID || 'N/A'}</TableCell></TableRow>
                    );
                  })
                ) : (
                  <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground h-24">No attendance records for this event{searchTerm ? ' matching your search' : ''}.</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          {!selectedEventId && events.length > 0 && <p className="text-center text-muted-foreground py-10">Please select an event to view attendance.</p>}
          {events.length === 0 && <p className="text-center text-muted-foreground py-10">No events available to display attendance for.</p>}
        </CardContent>
      </Card>
    </div>
  );
}

    