
"use client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Users, CalendarDays, ListChecks, MessageSquare } from 'lucide-react';
import Link from "next/link";

const deptAdminStats = {
  departmentStudents: 350,
  activeEvents: 3,
  pendingClearances: 12,
  recentMessages: 5,
};

const quickLinks = [
  { href: '/department-admin/students', label: 'Manage Students', icon: Users },
  { href: '/department-admin/events', label: 'Manage Events', icon: CalendarDays },
  { href: '/department-admin/clearance', label: 'Clearance Requests', icon: ListChecks },
  { href: '/messages', label: 'View Messages', icon: MessageSquare },
];


export default function DepartmentAdminDashboardPage() {
  // In a real app, fetch the department name associated with this admin
  const departmentName = "Your Department"; 

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-headline font-semibold">{departmentName} - Admin Dashboard</h1>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="shadow-md hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Department Students</CardTitle>
            <Users className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{deptAdminStats.departmentStudents}</div>
          </CardContent>
        </Card>
        <Card className="shadow-md hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Department Events</CardTitle>
            <CalendarDays className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{deptAdminStats.activeEvents}</div>
          </CardContent>
        </Card>
        <Card className="shadow-md hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Clearances (Dept)</CardTitle>
            <ListChecks className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{deptAdminStats.pendingClearances}</div>
          </CardContent>
        </Card>
        <Card className="shadow-md hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recent Messages</CardTitle>
            <MessageSquare className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{deptAdminStats.recentMessages}</div>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-md">
        <CardHeader>
          <CardTitle>Quick Links</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {quickLinks.map(link => (
            <Link key={link.href} href={link.href} passHref>
              <div className="flex items-center space-x-3 p-4 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer shadow-sm">
                <link.icon className="h-6 w-6 text-primary" />
                <span className="font-medium">{link.label}</span>
              </div>
            </Link>
          ))}
        </CardContent>
      </Card>
       <Card className="shadow-md">
          <CardHeader>
            <CardTitle>Department Activity Feed</CardTitle>
            <CardDescription>(Placeholder for recent department activities)</CardDescription>
          </CardHeader>
          <CardContent className="h-40 flex items-center justify-center bg-muted/30 rounded-md">
            <p className="text-muted-foreground">Department activity updates will appear here.</p>
          </CardContent>
        </Card>
    </div>
  );
}
