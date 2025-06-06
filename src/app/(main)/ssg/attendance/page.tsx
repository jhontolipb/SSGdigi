
"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { ClipboardCheck, Users, CalendarDays, Percent, Download, UserPlus, AlertTriangle, CheckCircle2, Check, Loader2 } from "lucide-react";
import type { Event, AttendanceRecord as AttendanceRecordType, UserProfile } from '@/types/user';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface AttendanceSummary {
    present: number;
    absent: number;
    late: number;
    totalParticipants: number; // Number of students who have any record (present, late, absent)
    totalExpected: number; // Total students in the system, or specific target group if defined
    attendanceRate: number; // Based on present/totalExpected or present/totalParticipants
}

export default function AttendanceMonitoringPage() {
  const { allEvents, allUsers, addNewOIC, currentEventAttendance, fetchAttendanceRecordsForEvent, loading: authLoading } = useAuth(); 
  const { toast } = useToast();

  const [selectedEventId, setSelectedEventId] = useState<string>('');
  const [summary, setSummary] = useState<AttendanceSummary | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDataLoading, setIsDataLoading] = useState(false);

  const [isAddOICDialogOpen, setIsAddOICDialogOpen] = useState(false);
  const [newOICFullName, setNewOICFullName] = useState('');
  const [newOICEmail, setNewOICEmail] = useState('');
  const [isAddingOIC, setIsAddingOIC] = useState(false);

  // Auto-select first event if available
  useEffect(() => {
     if (allEvents.length > 0 && !selectedEventId) {
        setSelectedEventId(allEvents[0].id);
     }
  }, [allEvents, selectedEventId]);

  // Fetch attendance records when selectedEventId changes
  useEffect(() => {
    if (selectedEventId) {
      setIsDataLoading(true);
      fetchAttendanceRecordsForEvent(selectedEventId).finally(() => setIsDataLoading(false));
    } else {
      setCurrentEventAttendance([]); // Clear records if no event is selected
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedEventId]); // Removed fetchAttendanceRecordsForEvent, setCurrentEventAttendance from deps

  // Calculate summary when attendance records or users change
  useEffect(() => {
    if (selectedEventId && currentEventAttendance) {
      const presentCount = currentEventAttendance.filter(r => r.status === 'present' || r.status === 'late').length;
      const absentCount = currentEventAttendance.filter(r => r.status === 'absent').length; // Assuming 'absent' status exists
      const lateCount = currentEventAttendance.filter(r => r.status === 'late').length;
      
      // For simplicity, totalExpected is all students. Could be refined based on event target.
      const totalExpected = allUsers.filter(u => u.role === 'student').length; 
      const totalParticipants = new Set(currentEventAttendance.map(r => r.studentUserID)).size;

      const attendanceRateValue = totalExpected > 0 ? (presentCount / totalExpected) * 100 : 0;
      
      setSummary({ 
        present: presentCount, 
        absent: absentCount, 
        late: lateCount, 
        totalParticipants: totalParticipants,
        totalExpected: totalExpected, 
        attendanceRate: attendanceRateValue 
      });
    } else {
      setSummary(null);
    }
  }, [currentEventAttendance, allUsers, selectedEventId]);

  const selectedEvent = allEvents.find(e => e.id === selectedEventId);

  const filteredAttendanceRecords = currentEventAttendance.filter(r => {
      const studentUser = allUsers.find(u => u.userID === r.studentUserID);
      return studentUser?.fullName.toLowerCase().includes(searchTerm.toLowerCase()) || 
             (studentUser?.email && studentUser.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
             r.studentUserID.toLowerCase().includes(searchTerm.toLowerCase());
    }
  );

  const handleAddOICSubmit = async () => {
    // ... (keep existing OIC submission logic)
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
        action: <CheckCircle2 className="text-green-500"/>
      });
      setNewOICFullName('');
      setNewOICEmail('');
      setIsAddOICDialogOpen(false);
    } else {
      toast({
        title: "Error Adding OIC",
        description: result.message,
        variant: "destructive",
        action: <AlertTriangle className="text-red-500"/>
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
                <ClipboardCheck className="text-primary h-7 w-7" /> Attendance Monitoring (SSG)
              </CardTitle>
              <CardDescription>View and filter attendance records for all events. Data from Firestore.</CardDescription>
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
                  <Button variant="outline" onClick={() => setIsAddOICDialogOpen(false)} disabled={isAddingOIC}>Cancel</Button>
                  <Button onClick={handleAddOICSubmit} disabled={isAddingOIC} className="bg-primary hover:bg-primary/90">
                    {isAddingOIC && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Add OIC
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 mb-6 items-center">
            <Select value={selectedEventId} onValueChange={setSelectedEventId} disabled={allEvents.length === 0 || authLoading}>
              <SelectTrigger className="md:w-[300px]">
                <SelectValue placeholder={authLoading ? "Loading events..." : "Select an Event"} />
              </SelectTrigger>
              <SelectContent>
                {allEvents.length === 0 && !authLoading && <SelectItem value="no-events" disabled>No events available</SelectItem>}
                {allEvents.map(event => (
                  <SelectItem key={event.id} value={event.id}>{event.name} ({event.date})</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input 
              placeholder="Search by student name, ID, or email..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1"
              disabled={!selectedEventId || authLoading || isDataLoading}
            />
             <Button variant="outline" disabled><Download className="mr-2 h-4 w-4" /> Export Data (Not Impl.)</Button>
          </div>

          {isDataLoading && (
             <div className="flex justify-center items-center py-10">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="ml-2">Loading attendance data...</p>
            </div>
          )}

          {!isDataLoading && selectedEvent && summary && (
            <Card className="mb-6 bg-muted/30">
              <CardHeader>
                <CardTitle className="text-xl">Attendance Summary for: {selectedEvent.name}</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                <div><Users className="mx-auto h-6 w-6 text-primary mb-1"/><p className="text-2xl font-bold">{summary.totalExpected}</p><p className="text-sm text-muted-foreground">Total Expected</p></div>
                <div><Check className="mx-auto h-6 w-6 text-green-500 mb-1"/><p className="text-2xl font-bold">{summary.present}</p><p className="text-sm text-muted-foreground">Present/Late</p></div>
                <div><Users className="mx-auto h-6 w-6 text-red-500 mb-1"/><p className="text-2xl font-bold">{summary.absent}</p><p className="text-sm text-muted-foreground">Absent</p></div>
                <div><Percent className="mx-auto h-6 w-6 text-blue-500 mb-1"/><p className="text-2xl font-bold">{summary.attendanceRate.toFixed(1)}%</p><p className="text-sm text-muted-foreground">Attendance Rate</p></div>
              </CardContent>
            </Card>
          )}
          
          {!isDataLoading && (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Time In</TableHead>
                    <TableHead>Time Out</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Scanned By (OIC)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAttendanceRecords.length > 0 ? (
                    filteredAttendanceRecords.map((record) => {
                      const studentUser = allUsers.find(u => u.userID === record.studentUserID);
                      const oicUser = allUsers.find(u => u.userID === record.scannedByOICUserID);
                      return (
                      <TableRow key={record.id}>
                        <TableCell className="font-medium">{studentUser?.fullName || record.studentUserID}</TableCell>
                        <TableCell>{studentUser?.email || 'N/A'}</TableCell>
                        <TableCell>{record.timeIn || 'N/A'}</TableCell>
                        <TableCell>{record.timeOut || 'N/A'}</TableCell>
                        <TableCell><span className={`px-2 py-1 text-xs rounded-full font-semibold
                          ${record.status === 'present' ? 'bg-green-100 text-green-700' :
                            record.status === 'absent' ? 'bg-red-100 text-red-700' :
                            record.status === 'late' ? 'bg-yellow-100 text-yellow-700' :
                            'bg-gray-100 text-gray-700'}`}>{record.status.charAt(0).toUpperCase() + record.status.slice(1)}</span></TableCell>
                        <TableCell>{oicUser?.fullName?.split(' ')[0] || record.scannedByOICUserID}</TableCell>
                      </TableRow>
                      );
                    })
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground h-24">
                        {allEvents.length === 0 && !authLoading ? "No events available to display attendance for." : 
                         !selectedEventId && !authLoading ? "Please select an event to view attendance." : 
                         authLoading || isDataLoading ? "Loading..." :
                         `No attendance records for this event${searchTerm ? ' matching your search' : ''}.`}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

