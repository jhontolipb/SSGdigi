
"use client";

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"; 
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Shield, PlusCircle, Edit, Trash2, MoreHorizontal, Loader2 } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import type { Club, UserProfile } from '@/types/user';
import { useAuth } from '@/contexts/AuthContext'; 
import { useToast } from '@/hooks/use-toast';

const SELECT_NONE_VALUE = "_NONE_"; // Ensure this is a distinct value not likely to be a real ID

export default function ClubManagementPage() {
  const { allClubs, allDepartments, allUsers, addClub, updateClub, deleteClub, updateUser, loading: authLoading } = useAuth(); 
  const { toast } = useToast();

  const [clubs, setClubs] = useState<Club[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingClub, setEditingClub] = useState<Club | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [clubName, setClubName] = useState('');
  const [clubDescription, setClubDescription] = useState('');
  const [departmentId, setDepartmentId] = useState<string | undefined>(undefined);
  const [assignedAdminId, setAssignedAdminId] = useState<string | undefined>(undefined);

  useEffect(() => {
    setClubs(allClubs || []);
  }, [allClubs]);

  const availableAdmins = allUsers.filter(u => u.role === 'club_admin');

  const resetFormFields = () => {
    setClubName('');
    setClubDescription('');
    setDepartmentId(undefined);
    setAssignedAdminId(undefined);
    setEditingClub(null);
  };

  const handleCreateNew = () => {
    resetFormFields();
    setIsFormOpen(true);
  };

  const handleEdit = (club: Club) => {
    setEditingClub(club);
    setClubName(club.name);
    setClubDescription(club.description || '');
    setDepartmentId(club.departmentId || undefined); // Ensure undefined if not set
    const admin = allUsers.find(a => a.role === 'club_admin' && a.clubID === club.id);
    setAssignedAdminId(admin?.userID || undefined); // Ensure undefined if not set
    setIsFormOpen(true);
  };

  const handleDeleteClub = async (clubId: string) => {
     if (window.confirm("Are you sure you want to delete this club? This will also unassign any admin managing it.")) {
      setIsSubmitting(true);
      await deleteClub(clubId); 
      // Toast is handled by deleteClub in context
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async () => {
    if (!clubName.trim()) {
      toast({ title: "Error", description: "Club name cannot be empty.", variant: "destructive" });
      return;
    }
    setIsSubmitting(true);

    const clubDataPayload: Omit<Club, 'id'> = {
      name: clubName.trim(),
      description: clubDescription.trim() || undefined,
      departmentId: (departmentId === SELECT_NONE_VALUE || !departmentId) ? undefined : departmentId,
    };

    try {
        if (editingClub) {
        await updateClub(editingClub.id, clubDataPayload);
        const oldAdminForThisClub = allUsers.find(u => u.clubID === editingClub.id && u.role === 'club_admin');
        
        if (assignedAdminId && assignedAdminId !== SELECT_NONE_VALUE) {
            // If a new admin is selected, or the same admin is re-confirmed
            if (oldAdminForThisClub?.userID !== assignedAdminId) {
            if (oldAdminForThisClub) {
                await updateUser({ clubID: undefined }, oldAdminForThisClub.userID); // Unassign old admin
            }
            await updateUser({ clubID: editingClub.id }, assignedAdminId); // Assign to new/confirmed admin
            }
        } else { 
            // No admin selected (or "None" was chosen), unassign any current admin for this club
            if (oldAdminForThisClub) {
            await updateUser({ clubID: undefined }, oldAdminForThisClub.userID);
            }
        }
        } else {
        // Creating a new club
        const newClubFirebaseId = await addClub(clubDataPayload);
        if (newClubFirebaseId && assignedAdminId && assignedAdminId !== SELECT_NONE_VALUE) {
            // Check if this admin is already assigned to another club
            const adminToAssign = allUsers.find(a => a.userID === assignedAdminId);
            if(adminToAssign && adminToAssign.clubID && adminToAssign.clubID !== newClubFirebaseId) {
                toast({title: "Admin Assignment Warning", description: `${adminToAssign.fullName} is already managing another club. Unassign them first or choose a different admin.`, variant: "destructive", duration: 7000});
            } else if (adminToAssign) {
                 await updateUser({ clubID: newClubFirebaseId }, adminToAssign.userID);
            }
        }
        }
        resetFormFields();
        setIsFormOpen(false);
    } catch (error) {
        // Error toast is likely handled by context functions, but a general one here can be a fallback.
        console.error("Error in handleSubmit for club:", error);
        toast({ title: "Submission Error", description: "An unexpected error occurred.", variant: "destructive"});
    } finally {
        setIsSubmitting(false);
    }
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
              <CardDescription>Manage student clubs and organizations (Data from Firestore).</CardDescription>
            </div>
            <Button onClick={handleCreateNew} className="bg-primary hover:bg-primary/90" disabled={isSubmitting || authLoading}>
              <PlusCircle className="mr-2 h-5 w-5" /> Add New Club
            </Button>
          </div>
        </CardHeader>
        <CardContent>
           {authLoading && (
            <div className="flex justify-center items-center py-10">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="ml-2">Loading clubs...</p>
            </div>
          )}
          {!authLoading && (
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
                              <Button variant="ghost" className="h-8 w-8 p-0" disabled={isSubmitting}>
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleEdit(club)} disabled={isSubmitting}>
                                <Edit className="mr-2 h-4 w-4" /> Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleDeleteClub(club.id)} className="text-destructive focus:text-destructive focus:bg-destructive/10" disabled={isSubmitting}>
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
            )}
        </CardContent>
      </Card>

      <Dialog open={isFormOpen} onOpenChange={(open) => { if (!isSubmitting) setIsFormOpen(open); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingClub ? 'Edit Club' : 'Add New Club'}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div>
              <Label htmlFor="clubName">Club Name</Label>
              <Input id="clubName" value={clubName} onChange={(e) => setClubName(e.target.value)} placeholder="e.g., Chess Club" disabled={isSubmitting} />
            </div>
            <div>
              <Label htmlFor="clubDescription">Club Description (Optional)</Label>
              <Input id="clubDescription" value={clubDescription} onChange={(e) => setClubDescription(e.target.value)} placeholder="e.g., A club for chess enthusiasts." disabled={isSubmitting} />
            </div>
            <div>
              <Label htmlFor="departmentId">Associated Department (Optional)</Label>
              <Select 
                value={departmentId || SELECT_NONE_VALUE} 
                onValueChange={(val) => setDepartmentId(val === SELECT_NONE_VALUE ? undefined : val)}
                disabled={isSubmitting}
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
                disabled={isSubmitting}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Club Admin" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={SELECT_NONE_VALUE}>None (Unassign)</SelectItem>
                  {availableAdmins.filter(admin => 
                     !admin.clubID || // Admin is not assigned to any club
                     (editingClub && admin.clubID === editingClub.id) || // Admin is already assigned to the club being edited
                     (admin.userID === assignedAdminId) // Admin is the one currently selected in the dropdown
                  ).map(admin => (
                    <SelectItem key={admin.userID} value={admin.userID}>
                        {admin.fullName} ({admin.email}) {admin.clubID && admin.clubID !== editingClub?.id ? `(Manages ${allClubs.find(c=>c.id===admin.clubID)?.name || 'another club'})` : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { if (!isSubmitting) setIsFormOpen(false);}} disabled={isSubmitting}>Cancel</Button>
            <Button onClick={handleSubmit} className="bg-primary hover:bg-primary/90" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editingClub ? 'Save Changes' : 'Create Club'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
