
"use client";

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { PlusCircle, MoreHorizontal, Search, Edit, Trash2, UserCog, UserPlus, UserMinus, Loader2 } from "lucide-react";
import type { UserProfile } from '@/types/user';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const defaultOICPassword = "password123";

export default function ClubOICManagementPage() {
  const { user: clubAdminUser, allUsers, updateUser, addUser, deleteUserProfile, loading: authLoading } = useAuth();
  const { toast } = useToast();

  const clubId = clubAdminUser?.clubID;

  const [clubOics, setClubOics] = useState<UserProfile[]>([]);
  const [availableOicsToAssign, setAvailableOicsToAssign] = useState<UserProfile[]>([]);
  const [filteredClubOics, setFilteredClubOics] = useState<UserProfile[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);
  const [selectedOicToAssign, setSelectedOicToAssign] = useState<string | undefined>(undefined);
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState<Partial<UserProfile> & { password?: string }>({
    fullName: '', email: '', role: 'oic', password: ''
  });

  useEffect(() => {
    if (clubId) {
      const assigned = allUsers.filter(u => u.role === 'oic' && u.assignedClubId === clubId);
      setClubOics(assigned);
      
      const available = allUsers.filter(u => u.role === 'oic' && !u.assignedClubId && u.userID !== clubAdminUser?.userID);
      setAvailableOicsToAssign(available);
    } else {
      setClubOics([]);
      setAvailableOicsToAssign([]);
    }
  }, [allUsers, clubId, clubAdminUser?.userID]);

  useEffect(() => {
    let result = clubOics;
    if (searchTerm) {
      result = result.filter(user => 
        user.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    setFilteredClubOics(result);
  }, [clubOics, searchTerm]);

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmitForm = async () => { 
    if (!formData.fullName || !formData.email) {
      toast({ title: "Error", description: "Full name and email are required.", variant: "destructive" });
      return;
    }
    if (!clubId) {
      toast({ title: "Error", description: "Club information not found.", variant: "destructive" });
      return;
    }
    setIsSubmitting(true);

    if (editingUser) {
      const profileUpdates: Partial<UserProfile> & { password?: string } = { 
        fullName: formData.fullName!,
        email: formData.email!, // Email editing is typically disabled for existing users
        password: formData.password || undefined, // Pass password only if entered
        // assignedClubId remains as is, role is 'oic'
      };
      await updateUser(profileUpdates, editingUser.userID);
    } else { 
      const newUserProfile: Omit<UserProfile, 'userID' | 'password'> = {
        fullName: formData.fullName!,
        email: formData.email!,
        role: 'oic',
        assignedClubId: clubId, 
      };
      const newPassword = formData.password || defaultOICPassword;
      await addUser(newUserProfile, newPassword);
    }
    setIsSubmitting(false);
    setIsFormOpen(false);
    setEditingUser(null);
    setFormData({ fullName: '', email: '', role: 'oic', password: '' });
  };

  const handleEdit = (user: UserProfile) => {
    setEditingUser(user);
    setFormData({ 
        fullName: user.fullName, 
        email: user.email, 
        role: 'oic', 
        password: '' // Clear password for edit form
    });
    setIsFormOpen(true);
  };
  
  const handleCreateNew = () => {
    setEditingUser(null);
    setFormData({ fullName: '', email: '', role: 'oic', password: defaultOICPassword });
    setIsFormOpen(true);
  }

  const handleUnassignOic = async (oicUserId: string) => {
     if (window.confirm("Are you sure you want to unassign this OIC from your club?")) {
        setIsSubmitting(true);
        await updateUser({ assignedClubId: undefined }, oicUserId);
        toast({ title: "OIC Unassigned", description: `OIC has been unassigned from the club.` });
        setIsSubmitting(false);
    }
  };
  
  const handleDeleteOic = async (oicUserId: string) => {
    if (window.confirm("Are you sure you want to delete this OIC's profile? This action cannot be undone.")) {
        setIsSubmitting(true);
        await deleteUserProfile(oicUserId);
        // toast({ title: "OIC Deleted", description: "OIC profile has been removed from the system."}); // Context handles toast
        setIsSubmitting(false);
    }
  };
  
  const handleAssignExistingOic = async () => {
    if (!selectedOicToAssign || !clubId) {
        toast({ title: "Error", description: "Please select an OIC to assign.", variant: "destructive"});
        return;
    }
    setIsSubmitting(true);
    const oicToUpdate = allUsers.find(u => u.userID === selectedOicToAssign);
    if (oicToUpdate) {
        await updateUser({ assignedClubId: clubId }, oicToUpdate.userID);
        toast({ title: "OIC Assigned", description: `${oicToUpdate.fullName} has been assigned to your club.`});
        setIsAssignDialogOpen(false);
        setSelectedOicToAssign(undefined);
    } else {
        toast({ title: "Error", description: "Selected OIC not found.", variant: "destructive"});
    }
    setIsSubmitting(false);
  };

  if (!clubId && !authLoading) {
    return (
        <Card><CardHeader><CardTitle>Error</CardTitle></CardHeader><CardContent><p>You are not assigned to a club. OIC management is unavailable.</p></CardContent></Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="shadow-lg">
        <CardHeader>
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div>
              <CardTitle className="text-2xl font-headline flex items-center gap-2">
                <UserCog className="text-primary h-7 w-7" /> Officer-in-Charge Management (Club)
              </CardTitle>
              <CardDescription>Manage OICs specifically for your club.</CardDescription>
            </div>
            <div className="flex gap-2">
                <Button onClick={handleCreateNew} variant="outline" disabled={isSubmitting || authLoading}>
                    { (isSubmitting || authLoading) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    <UserPlus className="mr-2 h-4 w-4" /> Create New OIC for Club
                </Button>
                 <Button onClick={() => setIsAssignDialogOpen(true)} className="bg-primary hover:bg-primary/90" disabled={isSubmitting || authLoading}>
                    { (isSubmitting || authLoading) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    <UserPlus className="mr-2 h-4 w-4" /> Assign Existing OIC
                </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {authLoading && !clubOics.length ? (
            <div className="flex justify-center items-center py-10">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="ml-2">Loading club OICs...</p>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-2 mb-4 p-4 border rounded-lg bg-muted/20">
                <Search className="h-5 w-5 text-muted-foreground" />
                <Input 
                  placeholder="Search club OICs by name or email..." 
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
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredClubOics.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={3} className="text-center text-muted-foreground h-24">
                          No OICs assigned to this club{searchTerm ? ' matching your search' : ''}.
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredClubOics.map((oic) => (
                        <TableRow key={oic.userID}>
                          <TableCell className="font-medium">{oic.fullName}</TableCell>
                          <TableCell>{oic.email}</TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="h-8 w-8 p-0" disabled={isSubmitting}>
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuLabel>OIC Actions</DropdownMenuLabel>
                                <DropdownMenuItem onClick={() => handleEdit(oic)} disabled={isSubmitting}>
                                  <Edit className="mr-2 h-4 w-4" /> Edit Details
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleUnassignOic(oic.userID)} disabled={isSubmitting}>
                                  <UserMinus className="mr-2 h-4 w-4" /> Unassign from Club
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem 
                                  onClick={() => handleDeleteOic(oic.userID)} 
                                  className="text-destructive focus:text-destructive focus:bg-destructive/10"
                                  disabled={isSubmitting}
                                >
                                  <Trash2 className="mr-2 h-4 w-4" /> Delete OIC Profile
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Dialog open={isFormOpen} onOpenChange={(open) => { if(!isSubmitting) setIsFormOpen(open);}}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingUser ? 'Edit OIC for Club' : 'Create New OIC for Club'}</DialogTitle>
            <DialogDescription>
              {editingUser ? 'Update details for this OIC.' : 'Create a new OIC who will be automatically assigned to your club.'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div>
              <Label htmlFor="fullName">Full Name</Label>
              <Input id="fullName" name="fullName" value={formData.fullName || ''} onChange={handleFormChange} disabled={isSubmitting}/>
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" value={formData.email || ''} onChange={handleFormChange} disabled={!!editingUser || isSubmitting}/>
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <Input 
                  id="password" 
                  name="password" 
                  type="password" 
                  placeholder={editingUser ? "Leave blank to keep unchanged" : defaultOICPassword}
                  value={formData.password || ''} 
                  onChange={handleFormChange} 
                  disabled={isSubmitting}
              />
              {!editingUser && <p className="text-xs text-muted-foreground mt-1">Default is '{defaultOICPassword}' if left blank.</p>}
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setIsFormOpen(false)} disabled={isSubmitting}>Cancel</Button>
            <Button type="submit" onClick={handleSubmitForm} className="bg-primary hover:bg-primary/90" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editingUser ? 'Save Changes' : 'Create & Assign OIC'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isAssignDialogOpen} onOpenChange={(open) => {if(!isSubmitting) setIsAssignDialogOpen(open);}}>
        <DialogContent className="sm:max-w-md">
            <DialogHeader>
                <DialogTitle>Assign Existing OIC to Your Club</DialogTitle>
                <DialogDescription>Select an available OIC to assign to your club. Only OICs not currently assigned to any club are listed.</DialogDescription>
            </DialogHeader>
            <div className="py-4">
                <Label htmlFor="oicSelect">Available OICs</Label>
                <Select value={selectedOicToAssign} onValueChange={setSelectedOicToAssign} disabled={isSubmitting}>
                    <SelectTrigger id="oicSelect">
                        <SelectValue placeholder="Choose an OIC..." />
                    </SelectTrigger>
                    <SelectContent>
                        {availableOicsToAssign.length > 0 ? availableOicsToAssign.map(oic => (
                            <SelectItem key={oic.userID} value={oic.userID}>
                                {oic.fullName} ({oic.email})
                            </SelectItem>
                        )) : (
                            <SelectItem value="no-oics" disabled>No unassigned OICs available.</SelectItem>
                        )}
                    </SelectContent>
                </Select>
            </div>
            <DialogFooter>
                <Button variant="outline" onClick={() => setIsAssignDialogOpen(false)} disabled={isSubmitting}>Cancel</Button>
                <Button onClick={handleAssignExistingOic} disabled={!selectedOicToAssign || selectedOicToAssign === 'no-oics' || isSubmitting} className="bg-primary hover:bg-primary/90">
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Assign to Club
                </Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
