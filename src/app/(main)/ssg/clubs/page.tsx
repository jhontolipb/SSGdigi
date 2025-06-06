
"use client";

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"; // Removed DialogDescription
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Shield, PlusCircle, Edit, Trash2, MoreHorizontal } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import type { Club, UserProfile } from '@/types/user';
import { useAuth } from '@/contexts/AuthContext'; 
import { useToast } from '@/hooks/use-toast';

const SELECT_NONE_VALUE = "@_NONE_@";

export default function ClubManagementPage() {
  const { allClubs, allDepartments, allUsers, addUser, updateUser, deleteUser } = useAuth(); // Assuming CRUD for clubs will be added to AuthContext if needed, or handled locally. For now, local.
  const { toast } = useToast();

  const [clubs, setClubs] = useState<Club[]>(allClubs || []);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingClub, setEditingClub] = useState<Club | null>(null);
  
  const [clubName, setClubName] = useState('');
  const [clubDescription, setClubDescription] = useState('');
  const [departmentId, setDepartmentId] = useState<string | undefined>(undefined);
  const [assignedAdminId, setAssignedAdminId] = useState<string | undefined>(undefined);

  useEffect(() => {
    setClubs(allClubs || []);
  }, [allClubs]);

  const availableAdmins = allUsers.filter(u => u.role === 'club_admin');

  const handleCreateNew = () => {
    setEditingClub(null);
    setClubName('');
    setClubDescription('');
    setDepartmentId(undefined);
    setAssignedAdminId(undefined);
    setIsFormOpen(true);
  };

  const handleEdit = (club: Club) => {
    setEditingClub(club);
    setClubName(club.name);
    setClubDescription(club.description || '');
    setDepartmentId(club.departmentId);
    const admin = allUsers.find(a => a.role === 'club_admin' && a.clubID === club.id);
    setAssignedAdminId(admin?.userID);
    setIsFormOpen(true);
  };

  const handleDeleteClub = (clubId: string) => {
     if (window.confirm("Are you sure you want to delete this club?")) {
      // In real app, call context/API to delete club
      setClubs(prev => prev.filter(c => c.id !== clubId)); 
      // Also unassign admin if any (mock)
      const adminToUnassign = allUsers.find(u => u.clubID === clubId);
      if (adminToUnassign) {
        updateUser({ ...adminToUnassign, clubID: undefined });
      }
      toast({title: "Club Deleted", description: "The club has been removed."});
    }
  };

  const handleSubmit = () => {
    if (!clubName.trim()) {
      toast({ title: "Error", description: "Club name cannot be empty.", variant: "destructive" });
      return;
    }
    if (editingClub) {
      const updatedClub = { ...editingClub, name: clubName, description: clubDescription || undefined, departmentId: departmentId || undefined };
      setClubs(prev => prev.map(c => c.id === editingClub.id ? updatedClub : c));
      // Handle admin assignment update
      const oldAdmin = allUsers.find(u => u.clubID === editingClub.id && u.userID !== assignedAdminId);
      if (oldAdmin) updateUser({ ...oldAdmin, clubID: undefined });
      if (assignedAdminId) {
        const newAdmin = allUsers.find(u => u.userID === assignedAdminId);
        if (newAdmin) updateUser({ ...newAdmin, clubID: editingClub.id });
      }
      toast({title: "Club Updated", description: `${updatedClub.name} has been updated.`});
    } else {
      const newClubId = `club_${Date.now()}`;
      const newClub: Club = {
        id: newClubId,
        name: clubName,
        description: clubDescription || undefined,
        departmentId: departmentId || undefined,
      };
      setClubs(prev => [...prev, newClub]);
      if (assignedAdminId) {
        const adminToAssign = allUsers.find(a => a.userID === assignedAdminId);
        if (adminToAssign) updateUser({ ...adminToAssign, clubID: newClubId });
      }
      toast({title: "Club Created", description: `${newClub.name} has been created.`});
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
                {clubs.length === 0 && (
                    <TableRow>
                        <TableCell colSpan={4} className="text-center text-muted-foreground h-24">No clubs found. Add one to get started.</TableCell>
                    </TableRow>
                )}
                {clubs.map((club) => {
                  const dept = allDepartments.find(d => d.id === club.departmentId);
                  const admin = allUsers.find(a => a.role === 'club_admin' && a.clubID === club.id);
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
                            <DropdownMenuItem onClick={() => handleDeleteClub(club.id)} className="text-destructive focus:text-destructive focus:bg-destructive/10">
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
              <Label htmlFor="clubDescription">Club Description (Optional)</Label>
              <Input id="clubDescription" value={clubDescription} onChange={(e) => setClubDescription(e.target.value)} placeholder="e.g., A club for chess enthusiasts." />
            </div>
            <div>
              <Label htmlFor="departmentId">Associated Department (Optional)</Label>
              <Select 
                value={departmentId || SELECT_NONE_VALUE} 
                onValueChange={(val) => setDepartmentId(val === SELECT_NONE_VALUE ? undefined : val)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Department" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={SELECT_NONE_VALUE}>None</SelectItem>
                  {allDepartments.map(dept => (
                    <SelectItem key={dept.id} value={dept.id}>{dept.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="assignedAdminId">Assign Club Admin</Label>
              <Select 
                value={assignedAdminId || SELECT_NONE_VALUE} 
                onValueChange={(val) => setAssignedAdminId(val === SELECT_NONE_VALUE ? undefined : val)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Club Admin" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={SELECT_NONE_VALUE}>None</SelectItem>
                  {availableAdmins.filter(admin => !admin.clubID || admin.clubID === editingClub?.id || admin.userID === assignedAdminId).map(admin => (
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
