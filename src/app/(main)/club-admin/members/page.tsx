
"use client";

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Users, PlusCircle, UserMinus, Search, UserPlus } from "lucide-react";
import { useAuth } from '@/contexts/AuthContext';
import type { UserProfile } from '@/types/user';
import { useToast } from '@/hooks/use-toast';

export default function ClubMembersPage() {
  const { user, allUsers, updateUserClub, allDepartments } = useAuth();
  const { toast } = useToast();

  const [clubMembers, setClubMembers] = useState<UserProfile[]>([]);
  const [potentialMembers, setPotentialMembers] = useState<UserProfile[]>([]);
  
  const [isAddMemberDialogOpen, setIsAddMemberDialogOpen] = useState(false);
  const [selectedStudentToAdd, setSelectedStudentToAdd] = useState<string>(''); // UserID
  const [searchTerm, setSearchTerm] = useState('');

  const clubAdminClubId = user?.clubID;

  useEffect(() => {
    if (clubAdminClubId && allUsers.length > 0) {
      const members = allUsers.filter(u => u.role === 'student' && u.clubID === clubAdminClubId);
      setClubMembers(members);

      const nonMembers = allUsers.filter(u => u.role === 'student' && u.clubID !== clubAdminClubId && !u.clubID); // Only students not in any club
      setPotentialMembers(nonMembers);
    }
  }, [clubAdminClubId, allUsers]);

  const handleAddMember = () => {
    if (!selectedStudentToAdd || !clubAdminClubId) {
      toast({ title: "Error", description: "Please select a student to add.", variant: "destructive" });
      return;
    }
    updateUserClub(selectedStudentToAdd, clubAdminClubId);
    toast({ title: "Success", description: "Student added to the club." });
    setIsAddMemberDialogOpen(false);
    setSelectedStudentToAdd('');
  };

  const handleRemoveMember = (studentId: string) => {
    if (window.confirm("Are you sure you want to remove this member from the club?")) {
      updateUserClub(studentId, null); // Set clubID to null or undefined
      toast({ title: "Success", description: "Student removed from the club." });
    }
  };
  
  const filteredClubMembers = clubMembers.filter(member => 
    member.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.email.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  const getDepartmentName = (departmentId?: string) => {
    return allDepartments.find(d => d.id === departmentId)?.name || 'N/A';
  };

  if (!clubAdminClubId) {
    return (
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Club Not Assigned</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">You are not currently assigned to manage a club.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="shadow-lg">
        <CardHeader>
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div>
              <CardTitle className="text-2xl font-headline flex items-center gap-2">
                <Users className="text-primary h-7 w-7" /> Club Member Management
              </CardTitle>
              <CardDescription>View and manage members of your club.</CardDescription>
            </div>
            <Button onClick={() => setIsAddMemberDialogOpen(true)} className="bg-primary hover:bg-primary/90">
              <UserPlus className="mr-2 h-5 w-5" /> Add Member
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 mb-4">
            <Search className="h-5 w-5 text-muted-foreground" />
            <Input 
              placeholder="Search members by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
          </div>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Full Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredClubMembers.length > 0 ? filteredClubMembers.map((member) => (
                  <TableRow key={member.userID}>
                    <TableCell className="font-medium">{member.fullName}</TableCell>
                    <TableCell>{member.email}</TableCell>
                    <TableCell>{getDepartmentName(member.departmentID)}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" onClick={() => handleRemoveMember(member.userID)} className="text-destructive hover:text-destructive/80">
                        <UserMinus className="mr-2 h-4 w-4" /> Remove
                      </Button>
                    </TableCell>
                  </TableRow>
                )) : (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground h-24">
                      No members found in this club{searchTerm ? ' matching your search' : ''}.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Add Member Dialog */}
      <Dialog open={isAddMemberDialogOpen} onOpenChange={setIsAddMemberDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add New Member to Club</DialogTitle>
            <DialogDescription>Select a student to add to your club. Only students not already in a club are listed.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <Label htmlFor="studentSelect">Select Student</Label>
            <Select value={selectedStudentToAdd} onValueChange={setSelectedStudentToAdd}>
              <SelectTrigger id="studentSelect">
                <SelectValue placeholder="Choose a student..." />
              </SelectTrigger>
              <SelectContent>
                {potentialMembers.length > 0 ? potentialMembers.map(student => (
                  <SelectItem key={student.userID} value={student.userID}>
                    {student.fullName} ({student.email}) - {getDepartmentName(student.departmentID)}
                  </SelectItem>
                )) : (
                  <SelectItem value="no-students" disabled>No available students to add.</SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddMemberDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleAddMember} disabled={!selectedStudentToAdd || selectedStudentToAdd === 'no-students'} className="bg-primary hover:bg-primary/90">Add to Club</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
