
"use client";

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { PlusCircle, MoreHorizontal, Search, Edit, Trash2, UserCog } from "lucide-react";
import type { UserProfile } from '@/types/user';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

const defaultOICPassword = "password123";

export default function SSGOICManagementPage() {
  const { allUsers, updateUser, addUser, deleteUser, allClubs, allDepartments } = useAuth();
  const { toast } = useToast();

  const [oicUsers, setOicUsers] = useState<UserProfile[]>([]);
  const [filteredOicUsers, setFilteredOicUsers] = useState<UserProfile[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);

  const [formData, setFormData] = useState<Partial<UserProfile>>({
    fullName: '', email: '', role: 'oic', password: '', departmentID: undefined, assignedClubId: undefined
  });

  useEffect(() => {
    const oics = allUsers.filter(user => user.role === 'oic');
    setOicUsers(oics);
  }, [allUsers]);

  useEffect(() => {
    let result = oicUsers;
    if (searchTerm) {
      result = result.filter(user => 
        user.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    setFilteredOicUsers(result);
  }, [oicUsers, searchTerm]);

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement> | {name: string, value: string} ) => {
    const name = 'name' in e ? e.name : e.target.name;
    const value = 'value' in e ? e.value : e.target.value;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleSelectChange = (name: string, value: string) => {
     const val = value === "none" ? undefined : value;
     setFormData(prev => ({ ...prev, [name]: val }));
  }

  const handleSubmitForm = () => {
    if (!formData.fullName || !formData.email) {
      toast({ title: "Error", description: "Full name and email are required.", variant: "destructive" });
      return;
    }
    if (editingUser) {
      const userToUpdate: UserProfile = { 
        ...editingUser, 
        ...formData, 
        password: formData.password ? formData.password : editingUser.password,
        role: 'oic', // Ensure role is OIC
      };
      updateUser(userToUpdate);
      toast({ title: "Success", description: "OIC updated successfully." });
    } else {
      if (!formData.password) { // Password required for new user
        formData.password = defaultOICPassword; 
      }
      const newUser: UserProfile = {
        userID: `user${Date.now()}`,
        ...formData,
        role: 'oic', // Ensure role is OIC
      } as UserProfile;
      addUser(newUser);
      toast({ title: "Success", description: "OIC created successfully." });
    }
    setIsFormOpen(false);
    setEditingUser(null);
    setFormData({ fullName: '', email: '', role: 'oic', password: '', departmentID: undefined, assignedClubId: undefined });
  };

  const handleEdit = (user: UserProfile) => {
    setEditingUser(user);
    setFormData({ 
        fullName: user.fullName, 
        email: user.email, 
        role: 'oic', 
        departmentID: user.departmentID || undefined, 
        assignedClubId: user.assignedClubId || undefined, 
        password: '' // Don't prefill password for edit
    });
    setIsFormOpen(true);
  };
  
  const handleCreateNew = () => {
    setEditingUser(null);
    setFormData({ fullName: '', email: '', role: 'oic', password: defaultOICPassword, departmentID: undefined, assignedClubId: undefined });
    setIsFormOpen(true);
  }

  const handleDelete = (userId: string) => {
    if (window.confirm("Are you sure you want to delete this OIC?")) {
      deleteUser(userId);
      toast({ title: "Success", description: "OIC deleted successfully." });
    }
  };

  return (
    <div className="space-y-6">
      <Card className="shadow-lg">
        <CardHeader>
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div>
              <CardTitle className="text-2xl font-headline flex items-center gap-2">
                <UserCog className="text-primary h-7 w-7" /> OIC Management (SSG)
              </CardTitle>
              <CardDescription>Manage all Officer-in-Charge users in the system.</CardDescription>
            </div>
            <Button onClick={handleCreateNew} className="bg-primary hover:bg-primary/90">
              <PlusCircle className="mr-2 h-5 w-5" /> Add New OIC
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 mb-4 p-4 border rounded-lg bg-muted/20">
            <Search className="h-5 w-5 text-muted-foreground" />
            <Input 
              placeholder="Search OICs by name or email..." 
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
                  <TableHead>Assigned Department</TableHead>
                  <TableHead>Assigned Club</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOicUsers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground h-24">
                      No OIC users found{searchTerm ? ' matching your search' : ''}.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredOicUsers.map((user) => (
                    <TableRow key={user.userID}>
                      <TableCell className="font-medium">{user.fullName}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>{user.departmentID ? allDepartments.find(d => d.id === user.departmentID)?.name : 'N/A'}</TableCell>
                      <TableCell>{user.assignedClubId ? allClubs.find(c => c.id === user.assignedClubId)?.name : 'N/A'}</TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuItem onClick={() => handleEdit(user)}>
                              <Edit className="mr-2 h-4 w-4" /> Edit
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              onClick={() => handleDelete(user.userID)} 
                              className="text-destructive focus:text-destructive focus:bg-destructive/10"
                            >
                              <Trash2 className="mr-2 h-4 w-4" /> Delete
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
            <DialogTitle>{editingUser ? 'Edit OIC' : 'Add New OIC'}</DialogTitle>
            <DialogDescription>
              {editingUser ? 'Update OIC details.' : 'Create a new OIC user.'}
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
            <div>
              <Label htmlFor="password">Password</Label>
              <Input 
                id="password" 
                name="password" 
                type="password" 
                placeholder={editingUser ? "Leave blank to keep unchanged" : defaultOICPassword}
                value={formData.password || ''} 
                onChange={handleFormChange} 
              />
            </div>
            <div>
              <Label htmlFor="departmentID">Assign Department (Optional)</Label>
              <Select name="departmentID" value={formData.departmentID || "none"} onValueChange={(value) => handleSelectChange('departmentID', value)}>
                <SelectTrigger><SelectValue placeholder="Select Department" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {allDepartments.map(dept => <SelectItem key={dept.id} value={dept.id}>{dept.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="assignedClubId">Assign Club (Optional)</Label>
               <Select name="assignedClubId" value={formData.assignedClubId || "none"} onValueChange={(value) => handleSelectChange('assignedClubId', value)}>
                <SelectTrigger><SelectValue placeholder="Select Club" /></SelectTrigger>
                <SelectContent>
                   <SelectItem value="none">None</SelectItem>
                  {allClubs.map(club => <SelectItem key={club.id} value={club.id}>{club.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setIsFormOpen(false)}>Cancel</Button>
            <Button type="submit" onClick={handleSubmitForm} className="bg-primary hover:bg-primary/90">
              {editingUser ? 'Save Changes' : 'Create OIC'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
