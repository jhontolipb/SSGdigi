
"use client";

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Building, PlusCircle, Edit, Trash2, MoreHorizontal } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { PredefinedDepartments } from '@/contexts/AuthContext'; // Import predefined departments
import type { Department } from '@/types/user';

export default function DepartmentManagementPage() {
  const [departments, setDepartments] = useState<Department[]>(PredefinedDepartments);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingDepartment, setEditingDepartment] = useState<Department | null>(null);
  const [departmentName, setDepartmentName] = useState('');

  const handleCreateNew = () => {
    setEditingDepartment(null);
    setDepartmentName('');
    setIsFormOpen(true);
  };

  const handleEdit = (department: Department) => {
    setEditingDepartment(department);
    setDepartmentName(department.name);
    setIsFormOpen(true);
  };

  const handleDelete = (departmentId: string) => {
    if (window.confirm("Are you sure you want to delete this department? This might affect existing user assignments.")) {
      setDepartments(prev => prev.filter(d => d.id !== departmentId));
    }
  };

  const handleSubmit = () => {
    if (!departmentName.trim()) {
      alert("Department name cannot be empty.");
      return;
    }
    if (editingDepartment) {
      setDepartments(prev => prev.map(d => d.id === editingDepartment.id ? { ...d, name: departmentName } : d));
    } else {
      const newDepartment: Department = {
        id: `dept_${Date.now()}`,
        name: departmentName,
      };
      setDepartments(prev => [...prev, newDepartment]);
    }
    setIsFormOpen(false);
    setDepartmentName('');
    setEditingDepartment(null);
  };

  return (
    <div className="space-y-6">
      <Card className="shadow-lg">
        <CardHeader>
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div>
              <CardTitle className="text-2xl font-headline flex items-center gap-2">
                <Building className="text-primary h-7 w-7" /> Department Management
              </CardTitle>
              <CardDescription>Manage academic departments.</CardDescription>
            </div>
            <Button onClick={handleCreateNew} className="bg-primary hover:bg-primary/90">
              <PlusCircle className="mr-2 h-5 w-5" /> Add New Department
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Department ID</TableHead>
                  <TableHead>Department Name</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {departments.map((dept) => (
                  <TableRow key={dept.id}>
                    <TableCell className="font-mono text-xs">{dept.id}</TableCell>
                    <TableCell className="font-medium">{dept.name}</TableCell>
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
                          <DropdownMenuItem onClick={() => handleEdit(dept)}>
                            <Edit className="mr-2 h-4 w-4" /> Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => handleDelete(dept.id)} 
                            className="text-destructive focus:text-destructive focus:bg-destructive/10"
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
          {departments.length === 0 && <p className="text-center text-muted-foreground py-10">No departments found. Add one to get started.</p>}
        </CardContent>
      </Card>

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{editingDepartment ? 'Edit Department' : 'Add New Department'}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="departmentName" className="text-right">Name</Label>
              <Input 
                id="departmentName" 
                value={departmentName} 
                onChange={(e) => setDepartmentName(e.target.value)} 
                className="col-span-3" 
                placeholder="e.g., BS Information Technology"
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setIsFormOpen(false)}>Cancel</Button>
            <Button type="submit" onClick={handleSubmit} className="bg-primary hover:bg-primary/90">
              {editingDepartment ? 'Save Changes' : 'Create Department'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
