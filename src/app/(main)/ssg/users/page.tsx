
"use client";

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { PlusCircle, MoreHorizontal, Search, Filter, Edit, Trash2, UserPlus } from "lucide-react";
import type { UserProfile, UserRole, Department, Club } from '@/types/user';
import { PredefinedDepartments } from '@/contexts/AuthContext';

// Mock data
const mockUsers: UserProfile[] = [
  { userID: 'user1', email: 'clubadmin1@example.com', fullName: 'Alice Wonderland', role: 'club_admin', clubID: 'club1' },
  { userID: 'user2', email: 'deptadmin1@example.com', fullName: 'Bob The Builder', role: 'department_admin', departmentID: PredefinedDepartments[0].id },
  { userID: 'user3', email: 'oic1@example.com', fullName: 'Charlie Chaplin', role: 'oic', departmentID: PredefinedDepartments[1].id },
  { userID: 'user4', email: 'student1@example.com', fullName: 'Diana Prince', role: 'student', departmentID: PredefinedDepartments[0].id, qrCodeID: 'qr123', points: 100 },
  { userID: 'user5', email: 'ssg.superadmin@yourcampus.edu', fullName: 'Super Admin', role: 'ssg_admin' },
];

const mockClubs: Club[] = [
    { id: 'club1', name: 'Robotics Club', departmentId: PredefinedDepartments[1].id },
    { id: 'club2', name: 'Tourism Society', departmentId: PredefinedDepartments[0].id },
];

export default function UserManagementPage() {
  const [users, setUsers] = useState<UserProfile[]>(mockUsers);
  const [filteredUsers, setFilteredUsers] = useState<UserProfile[]>(mockUsers);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<UserRole | 'all'>('all');
  const [departmentFilter, setDepartmentFilter] = useState<string | 'all'>('all');
  const [clubFilter, setClubFilter] = useState<string | 'all'>('all');

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);

  // Form state (simplified, use react-hook-form for real app)
  const [formData, setFormData] = useState<Partial<UserProfile>>({
    fullName: '', email: '', role: 'oic', departmentID: '', clubID: ''
  });

  useEffect(() => {
    let result = users;
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
  }, [users, searchTerm, roleFilter, departmentFilter, clubFilter]);

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement> | {name: string, value: string} ) => {
    const name = 'name' in e ? e.name : e.target.name;
    const value = 'value' in e ? e.value : e.target.value;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleSelectChange = (name: string, value: string) => {
     setFormData(prev => ({ ...prev, [name]: value }));
  }

  const handleSubmitForm = () => {
    if (editingUser) {
      // Update user
      setUsers(prevUsers => prevUsers.map(u => u.userID === editingUser.userID ? { ...u, ...formData } as UserProfile : u));
    } else {
      // Create new user
      const newUser: UserProfile = {
        userID: `user${Date.now()}`,
        ...formData,
      } as UserProfile; // Add proper validation and password handling
      setUsers(prevUsers => [...prevUsers, newUser]);
    }
    setIsFormOpen(false);
    setEditingUser(null);
    setFormData({ fullName: '', email: '', role: 'oic', departmentID: '', clubID: '' });
  };

  const handleEdit = (user: UserProfile) => {
    setEditingUser(user);
    setFormData({ fullName: user.fullName, email: user.email, role: user.role, departmentID: user.departmentID, clubID: user.clubID });
    setIsFormOpen(true);
  };
  
  const handleCreateNew = () => {
    setEditingUser(null);
    setFormData({ fullName: '', email: '', role: 'oic', departmentID: '', clubID: '' });
    setIsFormOpen(true);
  }

  const handleDelete = (userId: string) => {
    if (window.confirm("Are you sure you want to delete this user?")) {
      setUsers(prevUsers => prevUsers.filter(u => u.userID !== userId));
    }
  };


  return (
    <div className="space-y-6">
      <Card className="shadow-lg">
        <CardHeader>
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div>
              <CardTitle className="text-2xl font-headline flex items-center gap-2">
                <Users className="text-primary h-7 w-7" /> User Management
              </CardTitle>
              <CardDescription>Manage all users in the CampusConnect system.</CardDescription>
            </div>
            <Button onClick={handleCreateNew} className="bg-primary hover:bg-primary/90">
              <UserPlus className="mr-2 h-5 w-5" /> Add New User
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filters */}
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
                {PredefinedDepartments.map(dept => <SelectItem key={dept.id} value={dept.id}>{dept.name}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={clubFilter} onValueChange={(value) => setClubFilter(value)}>
              <SelectTrigger><SelectValue placeholder="Filter by Club" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Clubs</SelectItem>
                 {mockClubs.map(club => <SelectItem key={club.id} value={club.id}>{club.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          {/* User Table */}
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
                      {user.departmentID ? PredefinedDepartments.find(d => d.id === user.departmentID)?.name || 'N/A' : ''}
                      {user.clubID ? mockClubs.find(c => c.id === user.clubID)?.name || 'N/A' : ''}
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
                          <DropdownMenuItem onClick={() => handleEdit(user)} disabled={user.role === 'student' || user.role === 'ssg_admin' /* SSG admin cannot edit students directly here, or self */}>
                            <Edit className="mr-2 h-4 w-4" /> Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => alert(`View details for ${user.fullName}`)}>View Details</DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            onClick={() => handleDelete(user.userID)} 
                            className="text-destructive focus:text-destructive focus:bg-destructive/10"
                            disabled={user.role === 'ssg_admin' /* Cannot delete self/superadmin */}
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

      {/* User Form Dialog */}
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
                <Label htmlFor="password_placeholder" className="text-right">Password</Label>
                <Input id="password_placeholder" name="password_placeholder" type="password" placeholder={editingUser ? "Unchanged" : "Set password"} className="col-span-3" disabled={!!editingUser /* Simplified password handling for demo */} />
             </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="role" className="text-right">Role</Label>
              <Select name="role" value={formData.role || 'oic'} onValueChange={(value) => handleSelectChange('role', value)}>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="club_admin">Club Admin</SelectItem>
                  <SelectItem value="department_admin">Department Admin</SelectItem>
                  <SelectItem value="oic">OIC</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {formData.role === 'department_admin' || formData.role === 'oic' && (
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="departmentID" className="text-right">Department</Label>
                <Select name="departmentID" value={formData.departmentID || ''} onValueChange={(value) => handleSelectChange('departmentID', value)}>
                  <SelectTrigger className="col-span-3"> <SelectValue placeholder="Assign Department" /> </SelectTrigger>
                  <SelectContent>
                    {PredefinedDepartments.map(dept => <SelectItem key={dept.id} value={dept.id}>{dept.name}</SelectItem>)}
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
                    {mockClubs.map(club => <SelectItem key={club.id} value={club.id}>{club.name}</SelectItem>)}
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
