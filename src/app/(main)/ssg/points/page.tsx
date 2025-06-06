
// TODO: Implement SSG Admin Student Points Management page
// This page will allow SSG Admins to assign/deduct points for individual students.

"use client";

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Award, Search, User, Edit2, Plus, Minus } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface StudentPointRecord {
  studentId: string;
  studentName: string;
  department: string;
  points: number;
}

// Mock Data
const mockStudentPoints: StudentPointRecord[] = [
  { studentId: 'S001', studentName: 'John Doe', department: 'BSIT', points: 150 },
  { studentId: 'S002', studentName: 'Jane Smith', department: 'BSTM', points: 90 },
  { studentId: 'S003', studentName: 'Mike Brown', department: 'BSCrim', points: 120 },
  { studentId: 'S004', studentName: 'Alice Green', department: 'BSIT', points: 200 },
];

export default function StudentPointsPage() {
  const [students, setStudents] = useState<StudentPointRecord[]>(mockStudentPoints);
  const [filteredStudents, setFilteredStudents] = useState<StudentPointRecord[]>(mockStudentPoints);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<StudentPointRecord | null>(null);
  const [pointsChange, setPointsChange] = useState<number>(0);
  const [changeType, setChangeType] = useState<'add' | 'deduct'>('add');
  const [reason, setReason] = useState('');


  useEffect(() => {
    const result = students.filter(student =>
      student.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.studentId.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredStudents(result);
  }, [students, searchTerm]);

  const openModal = (student: StudentPointRecord) => {
    setSelectedStudent(student);
    setPointsChange(0);
    setReason('');
    setIsModalOpen(true);
  };

  const handlePointsUpdate = () => {
    if (!selectedStudent || pointsChange === 0) return;

    const newPoints = changeType === 'add' 
      ? selectedStudent.points + pointsChange
      : selectedStudent.points - pointsChange;
    
    // Ensure points don't go negative if not allowed
    const finalPoints = Math.max(0, newPoints); 

    setStudents(prev => prev.map(s => 
      s.studentId === selectedStudent.studentId ? { ...s, points: finalPoints } : s
    ));
    // Log the change reason (in a real app, this would be saved)
    console.log(`Points updated for ${selectedStudent.studentName}: ${changeType} ${pointsChange} points. Reason: ${reason}`);
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl font-headline flex items-center gap-2">
            <Award className="text-primary h-7 w-7" /> Student Points Management
          </CardTitle>
          <CardDescription>Assign or deduct points for student activities and participation.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-6 p-4 border rounded-lg bg-muted/20">
            <Input 
              placeholder="Search by student name or ID..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1"
            />
          </div>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student ID</TableHead>
                  <TableHead>Student Name</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Current Points</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredStudents.map((student) => (
                  <TableRow key={student.studentId}>
                    <TableCell>{student.studentId}</TableCell>
                    <TableCell className="font-medium">{student.studentName}</TableCell>
                    <TableCell>{student.department}</TableCell>
                    <TableCell className="font-semibold">{student.points}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="outline" size="sm" onClick={() => openModal(student)}>
                        <Edit2 className="mr-2 h-4 w-4" /> Adjust Points
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          {filteredStudents.length === 0 && <p className="text-center text-muted-foreground py-10">No students found matching your criteria.</p>}
        </CardContent>
      </Card>

      {/* Adjust Points Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Adjust Points for {selectedStudent?.studentName}</DialogTitle>
            <DialogDescription>Current Points: {selectedStudent?.points}</DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div>
              <Label htmlFor="changeType">Action Type</Label>
              <Select value={changeType} onValueChange={(value) => setChangeType(value as 'add' | 'deduct')}>
                <SelectTrigger id="changeType">
                  <SelectValue placeholder="Select action" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="add"><Plus className="inline mr-1 h-4 w-4" />Add Points</SelectItem>
                  <SelectItem value="deduct"><Minus className="inline mr-1 h-4 w-4" />Deduct Points</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="pointsChange">Points to {changeType}</Label>
              <Input 
                id="pointsChange" 
                type="number" 
                value={pointsChange} 
                onChange={(e) => setPointsChange(Math.max(0, parseInt(e.target.value, 10)))} // Ensure positive
                min="0"
              />
            </div>
             <div>
              <Label htmlFor="reason">Reason for Change (Optional)</Label>
              <Input 
                id="reason" 
                type="text" 
                value={reason} 
                onChange={(e) => setReason(e.target.value)}
                placeholder="e.g., Event participation, Sanction"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button onClick={handlePointsUpdate} className="bg-primary hover:bg-primary/90">Confirm Update</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

