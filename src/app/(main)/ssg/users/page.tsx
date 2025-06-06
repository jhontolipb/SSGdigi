
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
import { PlusCircle, MoreHorizontal, Search, Filter, Edit, Trash2, UserPlus, Users as UsersIcon, Loader2 } from "lucide-react";
import type { UserProfile, UserRole } from '@/types/user';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

const defaultNewUserPassword = "password123"; // Default password for new users created by admin

export default function UserManagementPage() {
  const { user: currentUser, allUsers, updateUser, addUser, deleteUserProfile, deleteUserAuth, fetchUsers, allClubs, allDepartments } = useAuth();
  const { toast } = useToast();

  const [filteredUsers, setFilteredUsers] = useState<UserProfile[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<UserRole | 'all'>('all');
  const [departmentFilter, setDepartmentFilter] = useState<string | 'all'>('all');
  const [clubFilter, setClubFilter] = useState<string | 'all'>('all');

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState<Partial<UserProfile> & { password?: string }>({
    fullName: '', email: '', role: 'oic', password: '', departmentID: '', clubID: ''
  });

  useEffect(() => {
    fetchUsers(); // Initial fetch
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); 

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
     const val = value === "none" || value === "" ? undefined : value;
     setFormData(prev => ({ ...prev, [name]: val }));
  }

  const handleSubmitForm = async () => {
    if (!formData.fullName || !formData.email || !formData.role) {
      toast({ title: "Error", description: "Full name, email, and role are required.", variant: "destructive" });
      return;
    }
    setIsSubmitting(true);
    if (editingUser) {
      // For editing, password is not managed here. Profile data only.
      const { password, ...profileUpdates } = formData;
      await updateUser(profileUpdates, editingUser.userID);
    } else {
      if (!formData.password) {
        toast({ title: "Error", description: "Password is required for new users.", variant: "destructive" });
        setIsSubmitting(false);
        return;
      }
      const { password, ...profileData } = formData;
      await addUser(profileData as Omit<UserProfile, 'userID' | 'password'>, password);
    }
    setIsSubmitting(false);
    setIsFormOpen(false);
    setEditingUser(null);
    setFormData({ fullName: '', email: '', role: 'oic', password: '', departmentID: '', clubID: '' });
    // fetchUsers(); // Already called by updateUser/addUser in context
  };

  const handleEdit = (userToEdit: UserProfile) => {
    setEditingUser(userToEdit);
    setFormData({ 
      fullName: userToEdit.fullName, 
      email: userToEdit.email, 
      role: userToEdit.role, 
      departmentID: userToEdit.departmentID || '', 
      clubID: userToEdit.clubID || '', 
      assignedClubId: userToEdit.assignedClubId || '',
      password: '' // Password field is for updates, not display
    });
    setIsFormOpen(true);
  };
  
  const handleCreateNew = () => {
    setEditingUser(null);
    setFormData({ fullName: '', email: '', role: 'oic', password: defaultNewUserPassword, departmentID: '', clubID: '', assignedClubId: '' });
    setIsFormOpen(true);
  }

  const handleDelete = async (userId: string, userEmail?: string) => {
    if (window.confirm("Are you sure you want to delete this user's profile from Firestore? Deleting from Firebase Auth must be done manually in the Firebase console for non-student users.")) {
      setIsSubmitting(true);
      await deleteUserProfile(userId); // Deletes Firestore document
      
      // For student roles, we might want to attempt Auth deletion if we implement a secure way later.
      // For now, prompt for manual deletion for admins/OICs for security.
      // const authDeleteResult = await deleteUserAuth(userId); // This is a placeholder in context
      // if (!authDeleteResult.success) {
      //  toast({ title: "Manual Action Needed", description: `Could not delete user ${userEmail || userId} from Firebase Auth. ${authDeleteResult.message}`, duration: 7000});
      // } else {
      //   toast({ title: "Success", description: "User deleted from Firebase Auth and Firestore." });
      // }
      toast({ title: "Profile Deleted", description: `User profile for ${userEmail || userId} deleted from Firestore. Please manage Firebase Authentication record manually if needed.` });
      setIsSubmitting(false);
      // fetchUsers(); // Already called by deleteUserProfile
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
            <Button onClick={handleCreateNew} className="bg-primary hover:bg-primary/90" disabled={isSubmitting}>
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
            <Select value={departmentFilter} onValueChange={(value) => setDepartmentFilter(value === 'all' ? 'all' : value )}>
              <SelectTrigger><SelectValue placeholder="Filter by Department" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Departments</SelectItem>
                {allDepartments.map(dept => <SelectItem key={dept.id} value={dept.id}>{dept.name}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={clubFilter} onValueChange={(value) => setClubFilter(value === 'all' ? 'all' : value)}>
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
                      {user.departmentID && (allDepartments.find(d => d.id === user.departmentID)?.name || user.departmentID)}
                      {user.departmentID && user.clubID && " / "}
                      {user.clubID && (allClubs.find(c => c.id === user.clubID)?.name || user.clubID)}
                      {user.assignedClubId && !user.clubID && `(OIC for: ${allClubs.find(c => c.id === user.assignedClubId)?.name || user.assignedClubId})`}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0" disabled={isSubmitting}>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuItem onClick={() => handleEdit(user)} disabled={user.role === 'student' || isSubmitting}>
                            <Edit className="mr-2 h-4 w-4" /> Edit Profile
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            onClick={() => handleDelete(user.userID, user.email)} 
                            className="text-destructive focus:text-destructive focus:bg-destructive/10"
                            disabled={isSubmitting || (currentUser?.userID === user.userID) || (user.email === 'ssg.superadmin@yourcampus.edu' && user.role === 'ssg_admin')}
                          >
                            <Trash2 className="mr-2 h-4 w-4" /> Delete Profile
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
            <DialogTitle>{editingUser ? 'Edit User Profile' : 'Add New User'}</DialogTitle>
            <DialogDescription>
              {editingUser ? 'Update profile details. Password changes are done via the user\'s own profile page or Firebase Console.' : 'Create a new Admin or OIC user. Student registration is separate.'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="fullName" className="text-right">Full Name</Label>
              <Input id="fullName" name="fullName" value={formData.fullName || ''} onChange={handleFormChange} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="email" className="text-right">Email</Label>
              <Input id="email" name="email" type="email" value={formData.email || ''} onChange={handleFormChange} className="col-span-3" disabled={!!editingUser} />
            </div>
             {!editingUser && (
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="password_create" className="text-right">Password</Label>
                    <Input 
                    id="password_create" 
                    name="password" 
                    type="password" 
                    placeholder={defaultNewUserPassword}
                    value={formData.password || ''} 
                    onChange={handleFormChange} 
                    className="col-span-3" 
                    />
                </div>
             )}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="role" className="text-right">Role</Label>
              <Select name="role" value={formData.role || 'oic'} onValueChange={(value) => { handleSelectChange('role', value); setFormData(prev => ({...prev, departmentID: '', clubID: '', assignedClubId: ''}))}}>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ssg_admin">SSG Admin</SelectItem>
                  <SelectItem value="club_admin">Club Admin</SelectItem>
                  <SelectItem value="department_admin">Department Admin</SelectItem>
                  <SelectItem value="oic">OIC</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {(formData.role === 'department_admin' || (formData.role === 'oic' && !formData.assignedClubId) ) && (
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="departmentID" className="text-right">Department</Label>
                <Select name="departmentID" value={formData.departmentID || "none"} onValueChange={(value) => handleSelectChange('departmentID', value)}>
                  <SelectTrigger className="col-span-3"> <SelectValue placeholder="Assign Department" /> </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {allDepartments.map(dept => <SelectItem key={dept.id} value={dept.id}>{dept.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            )}
            {(formData.role === 'club_admin' || (formData.role === 'oic' && !formData.departmentID)) && (
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="clubID" className="text-right">
                    {formData.role === 'club_admin' ? 'Manages Club' : 'Assign to Club (OIC)'}
                </Label>
                 <Select 
                    name={formData.role === 'club_admin' ? "clubID" : "assignedClubId"} 
                    value={(formData.role === 'club_admin' ? formData.clubID : formData.assignedClubId) || "none"} 
                    onValueChange={(value) => handleSelectChange(formData.role === 'club_admin' ? "clubID" : "assignedClubId", value)}
                  >
                  <SelectTrigger className="col-span-3"> <SelectValue placeholder={formData.role === 'club_admin' ? "Assign Club to Manage" : "Assign OIC to specific Club"} /> </SelectTrigger>
                  <SelectContent>
                     <SelectItem value="none">None</SelectItem>
                    {allClubs.map(club => <SelectItem key={club.id} value={club.id}>{club.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setIsFormOpen(false)} disabled={isSubmitting}>Cancel</Button>
            <Button type="submit" onClick={handleSubmitForm} className="bg-primary hover:bg-primary/90" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editingUser ? 'Save Changes' : 'Create User'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
