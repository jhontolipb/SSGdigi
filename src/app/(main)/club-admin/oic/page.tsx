
"use client";

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { PlusCircle, MoreHorizontal, Search, Edit, Trash2, UserCog, UserPlus, UserMinus } from "lucide-react";
import type { UserProfile } from '@/types/user';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const defaultOICPassword = "password123";

export default function ClubOICManagementPage() {
  const { user: clubAdminUser, allUsers, updateUser, addUser, deleteUser } = useAuth();
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

  const [formData, setFormData] = useState<Partial<UserProfile>>({
    fullName: '', email: '', role: 'oic', password: ''
  });

  useEffect(() => {
    if (clubId) {
      const assigned = allUsers.filter(u => u.role === 'oic' && u.assignedClubId === clubId);
      setClubOics(assigned);
      
      // OICs available for assignment: role is 'oic' AND no assignedClubId
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

  const handleSubmitForm = () => { 
    if (!formData.fullName || !formData.email) {
      toast({ title: "Error", description: "Full name and email are required.", variant: "destructive" });
      return;
    }
    if (!clubId) {
      toast({ title: "Error", description: "Club information not found.", variant: "destructive" });
      return;
    }

    if (editingUser) {
      const userToUpdate: UserProfile = { 
        ...editingUser, 
        fullName: formData.fullName!,
        email: formData.email!,
        password: formData.password ? formData.password : editingUser.password,
        assignedClubId: clubId, 
        role: 'oic',
      };
      updateUser(userToUpdate);
      toast({ title: "Success", description: "OIC updated successfully." });
    } else { 
      const newUser: UserProfile = {
        userID: `user${Date.now()}`,
        fullName: formData.fullName!,
        email: formData.email!,
        password: formData.password || defaultOICPassword,
        role: 'oic',
        assignedClubId: clubId, 
      };
      addUser(newUser);
      toast({ title: "Success", description: "New OIC created and assigned to your club." });
    }
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
        password: '' 
    });
    setIsFormOpen(true);
  };
  
  const handleCreateNew = () => {
    setEditingUser(null);
    setFormData({ fullName: '', email: '', role: 'oic', password: defaultOICPassword });
    setIsFormOpen(true);
  }

  const handleUnassignOic = (oicUserId: string) => {
     if (window.confirm("Are you sure you want to unassign this OIC from your club?")) {
        const oicToUpdate = allUsers.find(u => u.userID === oicUserId);
        if (oicToUpdate) {
            updateUser({ ...oicToUpdate, assignedClubId: undefined });
            toast({ title: "OIC Unassigned", description: `${oicToUpdate.fullName} has been unassigned from the club.` });
        }
    }
  };
  
  const handleDeleteOic = (oicUserId: string) => {
    if (window.confirm("Are you sure you want to delete this OIC? This action cannot be undone.")) {
        deleteUser(oicUserId);
        toast({ title: "OIC Deleted", description: "OIC has been removed from the system.", variant: "destructive" });
    }
  };
  
  const handleAssignExistingOic = () => {
    if (!selectedOicToAssign || !clubId) {
        toast({ title: "Error", description: "Please select an OIC to assign.", variant: "destructive"});
        return;
    }
    const oicToUpdate = allUsers.find(u => u.userID === selectedOicToAssign);
    if (oicToUpdate) {
        updateUser({ ...oicToUpdate, assignedClubId: clubId });
        toast({ title: "OIC Assigned", description: `${oicToUpdate.fullName} has been assigned to your club.`});
        setIsAssignDialogOpen(false);
        setSelectedOicToAssign(undefined);
    } else {
        toast({ title: "Error", description: "Selected OIC not found.", variant: "destructive"});
    }
  };


  if (!clubId) {
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
                <Button onClick={handleCreateNew} variant="outline">
                    <UserPlus className="mr-2 h-4 w-4" /> Create New OIC for Club
                </Button>
                 <Button onClick={() => setIsAssignDialogOpen(true)} className="bg-primary hover:bg-primary/90">
                    <UserPlus className="mr-2 h-4 w-4" /> Assign Existing OIC
                </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
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
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>OIC Actions</DropdownMenuLabel>
                            <DropdownMenuItem onClick={() => handleEdit(oic)}>
                              <Edit className="mr-2 h-4 w-4" /> Edit Details
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleUnassignOic(oic.userID)}>
                              <UserMinus className="mr-2 h-4 w-4" /> Unassign from Club
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              onClick={() => handleDeleteOic(oic.userID)} 
                              className="text-destructive focus:text-destructive focus:bg-destructive/10"
                            >
                              <Trash2 className="mr-2 h-4 w-4" /> Delete OIC User
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
        </CardContent>
      </Card>

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
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
              <Input id="fullName" name="fullName" value={formData.fullName || ''} onChange={handleFormChange} />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" value={formData.email || ''} onChange={handleFormChange} />
            </div>
            {!editingUser && ( 
                <div>
                <Label htmlFor="password">Password</Label>
                <Input 
                    id="password" 
                    name="password" 
                    type="password" 
                    placeholder={defaultOICPassword}
                    value={formData.password || ''} 
                    onChange={handleFormChange} 
                />
                <p className="text-xs text-muted-foreground mt-1">Default is '{defaultOICPassword}' if left blank.</p>
                </div>
            )}
             {editingUser && ( 
                <div>
                <Label htmlFor="password">New Password (Optional)</Label>
                <Input 
                    id="password" 
                    name="password" 
                    type="password" 
                    placeholder="Leave blank to keep unchanged"
                    value={formData.password || ''} 
                    onChange={handleFormChange} 
                />
                </div>
            )}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setIsFormOpen(false)}>Cancel</Button>
            <Button type="submit" onClick={handleSubmitForm} className="bg-primary hover:bg-primary/90">
              {editingUser ? 'Save Changes' : 'Create & Assign OIC'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isAssignDialogOpen} onOpenChange={setIsAssignDialogOpen}>
        <DialogContent className="sm:max-w-md">
            <DialogHeader>
                <DialogTitle>Assign Existing OIC to Your Club</DialogTitle>
                <DialogDescription>Select an available OIC to assign to your club. Only OICs not currently assigned to any club are listed.</DialogDescription>
            </DialogHeader>
            <div className="py-4">
                <Label htmlFor="oicSelect">Available OICs</Label>
                <Select value={selectedOicToAssign} onValueChange={setSelectedOicToAssign}>
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
                <Button variant="outline" onClick={() => setIsAssignDialogOpen(false)}>Cancel</Button>
                <Button onClick={handleAssignExistingOic} disabled={!selectedOicToAssign || selectedOicToAssign === 'no-oics'} className="bg-primary hover:bg-primary/90">
                    Assign to Club
                </Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

