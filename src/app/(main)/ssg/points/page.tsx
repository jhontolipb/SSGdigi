
"use client";

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Award, Search, Edit2, Plus, Minus } from "lucide-react"; // Removed User
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"; // Removed DialogDescription
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from '@/contexts/AuthContext'; // To get all student users
import { useToast } from '@/hooks/use-toast'; // For notifications

interface StudentPointRecord {
  studentId: string; // UserID of the student
  studentName: string;
  department: string;
  points: number;
}

export default function StudentPointsPage() {
  const { allUsers, updateUser, allDepartments } = useAuth();
  const { toast } = useToast();

  const [studentsWithPoints, setStudentsWithPoints] = useState<StudentPointRecord[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<StudentPointRecord[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<StudentPointRecord | null>(null);
  const [pointsChange, setPointsChange] = useState<number>(0);
  const [changeType, setChangeType] = useState<'add' | 'deduct'>('add');
  const [reason, setReason] = useState('');

  useEffect(() => {
    const studentUsers = allUsers
      .filter(user => user.role === 'student')
      .map(student => {
        const department = allDepartments.find(d => d.id === student.departmentID);
        return {
          studentId: student.userID,
          studentName: student.fullName,
          department: department ? department.name : 'N/A',
          points: student.points || 0,
        };
      });
    setStudentsWithPoints(studentUsers);
  }, [allUsers, allDepartments]);

  useEffect(() => {
    const result = studentsWithPoints.filter(student =>
      student.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.studentId.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredStudents(result);
  }, [studentsWithPoints, searchTerm]);

  const openModal = (student: StudentPointRecord) => {
    setSelectedStudent(student);
    setPointsChange(0);
    setReason('');
    setChangeType('add');
    setIsModalOpen(true);
  };

  const handlePointsUpdate = () => {
    if (!selectedStudent) return;
    if (pointsChange === 0 && reason.trim() === '') {
        toast({title: "No Change", description: "Please enter points to change or a reason.", variant:"default"});
        return;
    }

    const studentToUpdate = allUsers.find(u => u.userID === selectedStudent.studentId);
    if (!studentToUpdate) {
        toast({title: "Error", description: "Student not found.", variant:"destructive"});
        return;
    }

    const currentPoints = studentToUpdate.points || 0;
    const newPointsValue = changeType === 'add' 
      ? currentPoints + pointsChange
      : currentPoints - pointsChange;
    
    const finalPoints = Math.max(0, newPointsValue); 

    updateUser({ ...studentToUpdate, points: finalPoints });
    
    toast({title: "Points Updated", description: `Points for ${selectedStudent.studentName} set to ${finalPoints}. Reason: ${reason || 'N/A'}`});
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
            <Search className="h-5 w-5 self-center text-muted-foreground"/>
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
                {filteredStudents.length === 0 && (
                    <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground h-24">No students found{searchTerm ? ' matching your search' : ''}.</TableCell></TableRow>
                )}
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
        </CardContent>
      </Card>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Adjust Points for {selectedStudent?.studentName}</DialogTitle>
            {/* <DialogDescription>Current Points: {selectedStudent?.points}</DialogDescription> */}
          </DialogHeader>
          <div className="py-4 space-y-4">
            <p>Current Points: <strong>{selectedStudent?.points}</strong></p>
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
                value={pointsChange.toString()}
                onChange={(e) => {
                  const num = parseInt(e.target.value, 10);
                  setPointsChange(isNaN(num) ? 0 : Math.max(0, num));
                }}
                min="0"
              />
            </div>
             <div>
              <Label htmlFor="reason">Reason for Change</Label>
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
