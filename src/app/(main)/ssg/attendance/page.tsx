
// TODO: Implement SSG Admin Attendance Monitoring page
// This page will allow SSG Admins to access and filter attendance records for all events.
// It should show summaries (present, absent, late counts).

"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { ClipboardCheck, Users, CalendarDays, Percent, Download, Check, UserPlus, AlertTriangle, CheckCircle2 } from "lucide-react";
import type { Event } from '@/types/user';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

// Mock Data
const mockEvents: Event[] = [
  { id: 'event1', name: 'SSG General Assembly', date: '2024-09-15', organizerType: 'ssg', organizerId:'ssg', timeIn:'09:00', timeOut:'12:00', description:'', oicIds:[] },
  { id: 'event2', name: 'Robotics Club Workshop', date: '2024-09-20', organizerType: 'club', organizerId:'club1', timeIn:'13:00', timeOut:'16:00', description:'', oicIds:[] },
];

interface AttendanceRecord {
  id: string;
  studentName: string;
  studentId: string;
  department: string;
  timeIn: string | null;
  timeOut: string | null;
  status: 'present' | 'absent' | 'late' | 'pending';
  scannedByOIC: string;
}

const mockAttendance: Record<string, AttendanceRecord[]> = {
  event1: [
    { id: 'att1', studentName: 'John Doe', studentId: 'S001', department: 'BSIT', timeIn: '08:55', timeOut: '12:05', status: 'present', scannedByOIC: 'OIC Charlie' },
    { id: 'att2', studentName: 'Jane Smith', studentId: 'S002', department: 'BSTM', timeIn: '09:10', timeOut: '11:50', status: 'late', scannedByOIC: 'OIC Charlie' },
    { id: 'att3', studentName: 'Mike Brown', studentId: 'S003', department: 'BSCrim', timeIn: null, timeOut: null, status: 'absent', scannedByOIC: '' },
  ],
  event2: [
    { id: 'att4', studentName: 'Alice Green', studentId: 'S004', department: 'BSIT', timeIn: '13:00', timeOut: '16:00', status: 'present', scannedByOIC: 'OIC David' },
  ],
};

interface AttendanceSummary {
    present: number;
    absent: number;
    late: number;
    total: number;
    attendanceRate: number;
}

export default function AttendanceMonitoringPage() {
  const [selectedEventId, setSelectedEventId] = useState<string>(mockEvents[0]?.id || '');
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [summary, setSummary] = useState<AttendanceSummary | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const [isAddOICDialogOpen, setIsAddOICDialogOpen] = useState(false);
  const [newOICFullName, setNewOICFullName] = useState('');
  const [newOICEmail, setNewOICEmail] = useState('');
  const [isAddingOIC, setIsAddingOIC] = useState(false);

  const { addNewOIC } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (selectedEventId) {
      const records = mockAttendance[selectedEventId] || [];
      const filteredRecords = records.filter(r => 
        r.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.studentId.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setAttendanceRecords(filteredRecords);

      // Calculate summary
      const present = records.filter(r => r.status === 'present' || r.status === 'late').length;
      const absent = records.filter(r => r.status === 'absent').length;
      const late = records.filter(r => r.status === 'late').length;
      const total = records.length;
      const attendanceRate = total > 0 ? (present / total) * 100 : 0;
      setSummary({ present, absent, late, total, attendanceRate });

    } else {
      setAttendanceRecords([]);
      setSummary(null);
    }
  }, [selectedEventId, searchTerm]);

  const selectedEvent = mockEvents.find(e => e.id === selectedEventId);

  const handleAddOICSubmit = async () => {
    if (!newOICFullName.trim() || !newOICEmail.trim()) {
      toast({
        title: "Validation Error",
        description: "Full name and email are required for the new OIC.",
        variant: "destructive",
        action: <AlertTriangle />
      });
      return;
    }
    // Basic email validation
    if (!/\S+@\S+\.\S+/.test(newOICEmail)) {
        toast({
            title: "Validation Error",
            description: "Please enter a valid email address.",
            variant: "destructive",
            action: <AlertTriangle />
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
      // Optionally, you might want to refresh lists of OICs if they are displayed elsewhere or used in dropdowns
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
                  <DialogDescription>
                    Enter the details for the new OIC. They will be added to the system.
                  </DialogDescription>
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
                {mockEvents.map(event => (
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
             <Button variant="outline"><Download className="mr-2 h-4 w-4" /> Export Data</Button>
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
                <TableRow>
                  <TableHead>Student Name</TableHead>
                  <TableHead>Student ID</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Time In</TableHead>
                  <TableHead>Time Out</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Scanned By</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {attendanceRecords.map((record) => (
                  <TableRow key={record.id}>
                    <TableCell className="font-medium">{record.studentName}</TableCell>
                    <TableCell>{record.studentId}</TableCell>
                    <TableCell>{record.department}</TableCell>
                    <TableCell>{record.timeIn || 'N/A'}</TableCell>
                    <TableCell>{record.timeOut || 'N/A'}</TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 text-xs rounded-full font-semibold
                        ${record.status === 'present' ? 'bg-green-100 text-green-700' :
                          record.status === 'absent' ? 'bg-red-100 text-red-700' :
                          record.status === 'late' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-gray-100 text-gray-700'}`}>
                        {record.status.charAt(0).toUpperCase() + record.status.slice(1)}
                      </span>
                    </TableCell>
                    <TableCell>{record.scannedByOIC || 'N/A'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          {attendanceRecords.length === 0 && selectedEventId && <p className="text-center text-muted-foreground py-10">No attendance records found for this event or search term.</p>}
          {!selectedEventId && <p className="text-center text-muted-foreground py-10">Please select an event to view attendance.</p>}
        </CardContent>
      </Card>
    </div>
  );
}
