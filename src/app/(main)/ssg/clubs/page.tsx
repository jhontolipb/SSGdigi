
// TODO: Implement SSG Admin Club Management page
// This page will allow SSG Admins to CRUD clubs and assign club_admin users.
// Similar structure to Department Management, but with club-specific fields
// and association with departments (optional).

"use client";

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Shield, PlusCircle, Edit, Trash2, MoreHorizontal } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import type { Club, Department, UserProfile } from '@/types/user';
import { PredefinedDepartments } from '@/contexts/AuthContext'; // Using this for department list

// Mock data - replace with actual data fetching
const mockInitialClubs: Club[] = [
  { id: 'club1', name: 'Robotics Club', departmentId: PredefinedDepartments[1].id },
  { id: 'club2', name: 'Tourism Society', departmentId: PredefinedDepartments[0].id },
  { id: 'club3', name: 'Debate Club' }, // No department assigned
];

const mockClubAdmins: UserProfile[] = [ // Filtered for club_admin role
    { userID: 'user1', email: 'clubadmin1@example.com', fullName: 'Alice Wonderland', role: 'club_admin', clubID: 'club1' },
    { userID: 'user6', email: 'clubadmin2@example.com', fullName: 'Edward Scissorhands', role: 'club_admin', clubID: 'club2' },
];

export default function ClubManagementPage() {
  const [clubs, setClubs] = useState<Club[]>(mockInitialClubs);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingClub, setEditingClub] = useState<Club | null>(null);
  
  // Form state
  const [clubName, setClubName] = useState('');
  const [departmentId, setDepartmentId] = useState<string | undefined>('');
  const [assignedAdmin, setAssignedAdmin] = useState<string | undefined>(''); // UserID of assigned club_admin

  const handleCreateNew = () => {
    setEditingClub(null);
    setClubName('');
    setDepartmentId('');
    setAssignedAdmin('');
    setIsFormOpen(true);
  };

  const handleEdit = (club: Club) => {
    setEditingClub(club);
    setClubName(club.name);
    setDepartmentId(club.departmentId);
    // Find assigned admin for this club
    const admin = mockClubAdmins.find(a => a.clubID === club.id);
    setAssignedAdmin(admin?.userID);
    setIsFormOpen(true);
  };

  const handleDelete = (clubId: string) => {
     if (window.confirm("Are you sure you want to delete this club?")) {
      setClubs(prev => prev.filter(c => c.id !== clubId));
      // Also potentially unassign admin if any
    }
  };

  const handleSubmit = () => {
    if (!clubName.trim()) {
      alert("Club name cannot be empty.");
      return;
    }
    if (editingClub) {
      setClubs(prev => prev.map(c => c.id === editingClub.id ? { ...c, name: clubName, departmentId: departmentId || undefined } : c));
      // Handle admin assignment update here (mock)
      const adminToUpdate = mockClubAdmins.find(a => a.userID === assignedAdmin);
      if (adminToUpdate) adminToUpdate.clubID = editingClub.id;

    } else {
      const newClub: Club = {
        id: `club_${Date.now()}`,
        name: clubName,
        departmentId: departmentId || undefined,
      };
      setClubs(prev => [...prev, newClub]);
      // Handle admin assignment for new club (mock)
      const adminToAssign = mockClubAdmins.find(a => a.userID === assignedAdmin);
      if (adminToAssign) adminToAssign.clubID = newClub.id;
    }
    setIsFormOpen(false);
  };


  return (
    <div className="space-y-6">
      <Card className="shadow-lg">
        <CardHeader>
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div>
              <CardTitle className="text-2xl font-headline flex items-center gap-2">
                <Shield className="text-primary h-7 w-7" /> Club Management
              </CardTitle>
              <CardDescription>Manage student clubs and organizations.</CardDescription>
            </div>
            <Button onClick={handleCreateNew} className="bg-primary hover:bg-primary/90">
              <PlusCircle className="mr-2 h-5 w-5" /> Add New Club
            </Button>
          </div>
        </CardHeader>
        <CardContent>
           <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Club Name</TableHead>
                  <TableHead>Associated Department</TableHead>
                  <TableHead>Assigned Club Admin</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {clubs.map((club) => {
                  const dept = PredefinedDepartments.find(d => d.id === club.departmentId);
                  const admin = mockClubAdmins.find(a => a.clubID === club.id);
                  return (
                    <TableRow key={club.id}>
                      <TableCell className="font-medium">{club.name}</TableCell>
                      <TableCell>{dept ? dept.name : 'N/A'}</TableCell>
                      <TableCell>{admin ? admin.fullName : 'Not Assigned'}</TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEdit(club)}>
                              <Edit className="mr-2 h-4 w-4" /> Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDelete(club.id)} className="text-destructive focus:text-destructive focus:bg-destructive/10">
                              <Trash2 className="mr-2 h-4 w-4" /> Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
          {clubs.length === 0 && <p className="text-center text-muted-foreground py-10">No clubs found. Add one to get started.</p>}
        </CardContent>
      </Card>

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingClub ? 'Edit Club' : 'Add New Club'}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div>
              <Label htmlFor="clubName">Club Name</Label>
              <Input id="clubName" value={clubName} onChange={(e) => setClubName(e.target.value)} placeholder="e.g., Chess Club" />
            </div>
            <div>
              <Label htmlFor="departmentId">Associated Department (Optional)</Label>
              <Select value={departmentId} onValueChange={setDepartmentId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Department" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">None</SelectItem>
                  {PredefinedDepartments.map(dept => (
                    <SelectItem key={dept.id} value={dept.id}>{dept.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="assignedAdmin">Assign Club Admin</Label>
              <Select value={assignedAdmin} onValueChange={setAssignedAdmin}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Club Admin" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">None</SelectItem>
                  {/* Filter for users with club_admin role who are not already assigned OR current admin */}
                  {mockClubAdmins.filter(admin => admin.role === 'club_admin' && (!admin.clubID || admin.clubID === editingClub?.id)).map(admin => (
                    <SelectItem key={admin.userID} value={admin.userID}>{admin.fullName} ({admin.email})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsFormOpen(false)}>Cancel</Button>
            <Button onClick={handleSubmit} className="bg-primary hover:bg-primary/90">{editingClub ? 'Save Changes' : 'Create Club'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
