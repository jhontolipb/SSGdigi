
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
import { PlusCircle, MoreHorizontal, Search, Filter, Edit, Trash2, UserPlus, Users as UsersIcon } from "lucide-react"; // Renamed Users to UsersIcon to avoid conflict
import type { UserProfile, UserRole, Department, Club } from '@/types/user';
import { useAuth, PredefinedDepartments, PredefinedClubs } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

const defaultNewUserPassword = "password123";

export default function UserManagementPage() {
  const { allUsers, updateUser, addUser, deleteUser, allClubs, allDepartments } = useAuth();
  const { toast } = useToast();

  const [filteredUsers, setFilteredUsers] = useState<UserProfile[]>(allUsers);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<UserRole | 'all'>('all');
  const [departmentFilter, setDepartmentFilter] = useState<string | 'all'>('all');
  const [clubFilter, setClubFilter] = useState<string | 'all'>('all');

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);

  const [formData, setFormData] = useState<Partial<UserProfile>>({
    fullName: '', email: '', role: 'oic', password: '', departmentID: '', clubID: ''
  });

  useEffect(() => {
    let result = allUsers;
    if (searchTerm) {
      result = result.filter(user => 
        user.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    if (roleFilter !== 'all') {
      result = result.filter(user => user.role === roleFilter);
    }
    if (departmentFilter !== 'all') {
      result = result.filter(user => user.departmentID === departmentFilter);
    }
    if (clubFilter !== 'all') {
      result = result.filter(user => user.clubID === clubFilter);
    }
    setFilteredUsers(result);
  }, [allUsers, searchTerm, roleFilter, departmentFilter, clubFilter]);

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement> | {name: string, value: string} ) => {
    const name = 'name' in e ? e.name : e.target.name;
    const value = 'value' in e ? e.value : e.target.value;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleSelectChange = (name: string, value: string) => {
     setFormData(prev => ({ ...prev, [name]: value }));
  }

  const handleSubmitForm = () => {
    if (!formData.fullName || !formData.email || !formData.role) {
      toast({ title: "Error", description: "Full name, email, and role are required.", variant: "destructive" });
      return;
    }
    if (editingUser) {
      const userToUpdate: UserProfile = { 
        ...editingUser, 
        ...formData, 
        // If password field is empty during edit, keep existing password, otherwise update it.
        password: formData.password ? formData.password : editingUser.password 
      };
      updateUser(userToUpdate);
      toast({ title: "Success", description: "User updated successfully." });
    } else {
      if (!formData.password) {
        toast({ title: "Error", description: "Password is required for new users.", variant: "destructive" });
        return;
      }
      const newUser: UserProfile = {
        userID: `user${Date.now()}`,
        ...formData,
        points: formData.role === 'student' ? 0 : undefined,
        qrCodeID: formData.role === 'student' ? `qr${Date.now()}`: undefined,
      } as UserProfile;
      addUser(newUser);
      toast({ title: "Success", description: "User created successfully." });
    }
    setIsFormOpen(false);
    setEditingUser(null);
    setFormData({ fullName: '', email: '', role: 'oic', password: '', departmentID: '', clubID: '' });
  };

  const handleEdit = (user: UserProfile) => {
    setEditingUser(user);
    // When editing, don't pre-fill password for security, let admin type if they want to change it.
    setFormData({ fullName: user.fullName, email: user.email, role: user.role, departmentID: user.departmentID, clubID: user.clubID, password: '' });
    setIsFormOpen(true);
  };
  
  const handleCreateNew = () => {
    setEditingUser(null);
    setFormData({ fullName: '', email: '', role: 'oic', password: defaultNewUserPassword, departmentID: '', clubID: '' });
    setIsFormOpen(true);
  }

  const handleDelete = (userId: string) => {
    if (window.confirm("Are you sure you want to delete this user?")) {
      deleteUser(userId);
      toast({ title: "Success", description: "User deleted successfully." });
    }
  };


  return (
    <div className="space-y-6">
      <Card className="shadow-lg">
        <CardHeader>
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div>
              <CardTitle className="text-2xl font-headline flex items-center gap-2">
                <UsersIcon className="text-primary h-7 w-7" /> User Management
              </CardTitle>
              <CardDescription>Manage all users in the CampusConnect system.</CardDescription>
            </div>
            <Button onClick={handleCreateNew} className="bg-primary hover:bg-primary/90">
              <UserPlus className="mr-2 h-5 w-5" /> Add New User
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6 p-4 border rounded-lg bg-muted/20">
            <Input 
              placeholder="Search by name or email..." 
              value={searchTerm} 
              onChange={(e) => setSearchTerm(e.target.value)}
              className="lg:col-span-1"
            />
            <Select value={roleFilter} onValueChange={(value) => setRoleFilter(value as UserRole | 'all')}>
              <SelectTrigger><SelectValue placeholder="Filter by Role" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="ssg_admin">SSG Admin</SelectItem>
                <SelectItem value="club_admin">Club Admin</SelectItem>
                <SelectItem value="department_admin">Department Admin</SelectItem>
                <SelectItem value="oic">OIC</SelectItem>
                <SelectItem value="student">Student</SelectItem>
              </SelectContent>
            </Select>
            <Select value={departmentFilter} onValueChange={(value) => setDepartmentFilter(value)}>
              <SelectTrigger><SelectValue placeholder="Filter by Department" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Departments</SelectItem>
                {allDepartments.map(dept => <SelectItem key={dept.id} value={dept.id}>{dept.name}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={clubFilter} onValueChange={(value) => setClubFilter(value)}>
              <SelectTrigger><SelectValue placeholder="Filter by Club" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Clubs</SelectItem>
                 {allClubs.map(club => <SelectItem key={club.id} value={club.id}>{club.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Full Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Department/Club</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => (
                  <TableRow key={user.userID}>
                    <TableCell className="font-medium">{user.fullName}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell className="capitalize">{user.role.replace('_', ' ')}</TableCell>
                    <TableCell>
                      {user.departmentID ? allDepartments.find(d => d.id === user.departmentID)?.name || 'N/A' : ''}
                      {user.clubID ? allClubs.find(c => c.id === user.clubID)?.name || 'N/A' : ''}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Open menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuItem onClick={() => handleEdit(user)} disabled={user.role === 'student' /* Students managed via registration or other specialized forms */}>
                            <Edit className="mr-2 h-4 w-4" /> Edit
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            onClick={() => handleDelete(user.userID)} 
                            className="text-destructive focus:text-destructive focus:bg-destructive/10"
                            disabled={user.role === 'ssg_admin' && user.email === 'ssg.superadmin@yourcampus.edu' /* Cannot delete main superadmin */}
                          >
                            <Trash2 className="mr-2 h-4 w-4" /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
           {filteredUsers.length === 0 && <p className="text-center text-muted-foreground py-10">No users found matching your criteria.</p>}
        </CardContent>
      </Card>

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{editingUser ? 'Edit User' : 'Add New User'}</DialogTitle>
            <DialogDescription>
              {editingUser ? 'Update the details of the existing user.' : 'Create a new user. Only Club Admin, Department Admin, and OIC roles can be created here.'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="fullName" className="text-right">Full Name</Label>
              <Input id="fullName" name="fullName" value={formData.fullName || ''} onChange={handleFormChange} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="email" className="text-right">Email</Label>
              <Input id="email" name="email" type="email" value={formData.email || ''} onChange={handleFormChange} className="col-span-3" />
            </div>
             <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="password" className="text-right">Password</Label>
                <Input 
                  id="password" 
                  name="password" 
                  type="password" 
                  placeholder={editingUser ? "Leave blank to keep unchanged" : "Enter password"}
                  value={formData.password || ''} 
                  onChange={handleFormChange} 
                  className="col-span-3" 
                />
             </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="role" className="text-right">Role</Label>
              <Select name="role" value={formData.role || 'oic'} onValueChange={(value) => { handleSelectChange('role', value); setFormData(prev => ({...prev, departmentID: '', clubID: ''}))}}>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="club_admin">Club Admin</SelectItem>
                  <SelectItem value="department_admin">Department Admin</SelectItem>
                  <SelectItem value="oic">OIC</SelectItem>
                  {/* <SelectItem value="student">Student</SelectItem>  Students are typically registered */}
                </SelectContent>
              </Select>
            </div>
            {(formData.role === 'department_admin' || formData.role === 'oic') && (
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="departmentID" className="text-right">Department</Label>
                <Select name="departmentID" value={formData.departmentID || ''} onValueChange={(value) => handleSelectChange('departmentID', value)}>
                  <SelectTrigger className="col-span-3"> <SelectValue placeholder="Assign Department (Optional for OIC)" /> </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">None</SelectItem>
                    {allDepartments.map(dept => <SelectItem key={dept.id} value={dept.id}>{dept.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            )}
            {formData.role === 'club_admin' && (
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="clubID" className="text-right">Club</Label>
                 <Select name="clubID" value={formData.clubID || ''} onValueChange={(value) => handleSelectChange('clubID', value)}>
                  <SelectTrigger className="col-span-3"> <SelectValue placeholder="Assign Club" /> </SelectTrigger>
                  <SelectContent>
                     <SelectItem value="">None</SelectItem>
                    {allClubs.map(club => <SelectItem key={club.id} value={club.id}>{club.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            )}
             {/* OIC can also be assigned to a club directly */}
            {formData.role === 'oic' && (
                 <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="assignedClubId" className="text-right">Assigned Club (OIC)</Label>
                    <Select name="assignedClubId" value={formData.assignedClubId || ''} onValueChange={(value) => handleSelectChange('assignedClubId', value)}>
                        <SelectTrigger className="col-span-3"> <SelectValue placeholder="Assign to specific Club (Optional)" /> </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="">None</SelectItem>
                            {allClubs.map(club => <SelectItem key={club.id} value={club.id}>{club.name}</SelectItem>)}
                        </SelectContent>
                    </Select>
                 </div>
            )}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setIsFormOpen(false)}>Cancel</Button>
            <Button type="submit" onClick={handleSubmitForm} className="bg-primary hover:bg-primary/90">
              {editingUser ? 'Save Changes' : 'Create User'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
