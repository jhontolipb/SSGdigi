
"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { ClipboardCheck, Users, Check, Percent, Loader2 } from "lucide-react";
import type { Event, AttendanceRecord as AttendanceRecordType, UserProfile } from '@/types/user';
import { useAuth } from '@/contexts/AuthContext';

interface AttendanceSummary {
    present: number;
    absent: number;
    late: number;
    totalParticipants: number;
    totalExpectedDeptStudents: number;
    attendanceRate: number;
}

export default function DepartmentAttendancePage() {
  const { user, allEvents, allUsers, currentEventAttendance, fetchAttendanceRecordsForEvent, loading: authLoading } = useAuth();
  
  const [departmentSpecificEvents, setDepartmentSpecificEvents] = useState<Event[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string>('');
  const [summary, setSummary] = useState<AttendanceSummary | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDataLoading, setIsDataLoading] = useState(false);

  const deptAdminDeptId = user?.departmentID;

  useEffect(() => {
    if (deptAdminDeptId) {
      const filteredEvents = allEvents.filter(e => e.organizerType === 'department' && e.organizerId === deptAdminDeptId);
      setDepartmentSpecificEvents(filteredEvents);
      if (filteredEvents.length > 0 && !selectedEventId) {
        setSelectedEventId(filteredEvents[0].id);
      } else if (filteredEvents.length === 0) {
        setSelectedEventId('');
      }
    }
  }, [allEvents, deptAdminDeptId, selectedEventId]);

  useEffect(() => {
    if (selectedEventId) {
      setIsDataLoading(true);
      fetchAttendanceRecordsForEvent(selectedEventId).finally(() => setIsDataLoading(false));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedEventId]);

  useEffect(() => {
    if (selectedEventId && currentEventAttendance && deptAdminDeptId) {
      const presentCount = currentEventAttendance.filter(r => r.status === 'present' || r.status === 'late').length;
      const absentCount = currentEventAttendance.filter(r => r.status === 'absent').length;
      const lateCount = currentEventAttendance.filter(r => r.status === 'late').length;
      
      const departmentStudents = allUsers.filter(u => u.role === 'student' && u.departmentID === deptAdminDeptId);
      const totalExpectedDeptStudents = departmentStudents.length;
      const totalParticipants = new Set(currentEventAttendance.map(r => r.studentUserID)).size;

      const attendanceRateValue = totalExpectedDeptStudents > 0 ? (presentCount / totalExpectedDeptStudents) * 100 : 0;
      
      setSummary({ 
        present: presentCount, 
        absent: absentCount, 
        late: lateCount, 
        totalParticipants,
        totalExpectedDeptStudents, 
        attendanceRate: attendanceRateValue 
      });
    } else {
      setSummary(null);
    }
  }, [currentEventAttendance, allUsers, selectedEventId, deptAdminDeptId]);

  const selectedEvent = departmentSpecificEvents.find(e => e.id === selectedEventId);

  const filteredAttendanceRecords = currentEventAttendance.filter(r => {
      const studentUser = allUsers.find(u => u.userID === r.studentUserID);
      return studentUser?.fullName.toLowerCase().includes(searchTerm.toLowerCase()) || 
             (studentUser?.email && studentUser.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
             r.studentUserID.toLowerCase().includes(searchTerm.toLowerCase());
    }
  );

  if (authLoading && !deptAdminDeptId) {
    return <div className="flex justify-center items-center py-10"><Loader2 className="h-8 w-8 animate-spin text-primary" /><p className="ml-2">Loading department data...</p></div>;
  }
  
  if (!deptAdminDeptId) {
    return (
      <Card className="shadow-lg">
        <CardHeader><CardTitle>Department Not Assigned</CardTitle></CardHeader>
        <CardContent><p className="text-muted-foreground">You are not assigned to a department. Attendance monitoring is unavailable.</p></CardContent>
      </Card>
    );
  }


  return (
    <div className="space-y-6">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl font-headline flex items-center gap-2">
            <ClipboardCheck className="text-primary h-7 w-7" /> Department Attendance Monitoring
          </CardTitle>
          <CardDescription>Track attendance for your department's events. Data from Firestore.</CardDescription>
        </CardHeader>
        <CardContent>
           <div className="flex flex-col md:flex-row gap-4 mb-6 items-center">
            <Select value={selectedEventId} onValueChange={setSelectedEventId} disabled={departmentSpecificEvents.length === 0 || authLoading}>
              <SelectTrigger className="md:w-[300px]">
                <SelectValue placeholder={departmentSpecificEvents.length === 0 ? "No department events found" : "Select a Department Event"} />
              </SelectTrigger>
              <SelectContent>
                {departmentSpecificEvents.length === 0 && <SelectItem value="no-events" disabled>No events for your department</SelectItem>}
                {departmentSpecificEvents.map(event => (
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
                <div><Users className="mx-auto h-6 w-6 text-primary mb-1"/><p className="text-2xl font-bold">{summary.totalExpectedDeptStudents}</p><p className="text-sm text-muted-foreground">Total Dept. Students</p></div>
                <div><Check className="mx-auto h-6 w-6 text-green-500 mb-1"/><p className="text-2xl font-bold">{summary.present}</p><p className="text-sm text-muted-foreground">Present/Late</p></div>
                <div><Users className="mx-auto h-6 w-6 text-red-500 mb-1"/><p className="text-2xl font-bold">{summary.absent}</p><p className="text-sm text-muted-foreground">Absent</p></div>
                <div><Percent className="mx-auto h-6 w-6 text-blue-500 mb-1"/><p className="text-2xl font-bold">{summary.attendanceRate.toFixed(1)}%</p><p className="text-sm text-muted-foreground">Attendance Rate (Dept.)</p></div>
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
                        {departmentSpecificEvents.length === 0 && !authLoading ? "No events found for your department." : 
                         !selectedEventId && !authLoading ? "Please select one of your department's events." : 
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

