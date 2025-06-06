
"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Users, CalendarDays, ListChecks, MessageSquare, BarChart3, Activity } from 'lucide-react';
import Link from "next/link";
import Image from "next/image";

// Mock data - replace with actual data fetching
const ssgStats = {
  totalStudents: 1250,
  activeEvents: 5,
  pendingClearances: 23,
  recentMessages: 8,
};

const quickLinks = [
  { href: '/ssg/users', label: 'Manage Users', icon: Users },
  { href: '/ssg/events', label: 'Manage Events', icon: CalendarDays },
  { href: '/ssg/clearance', label: 'Clearance Requests', icon: ListChecks },
  { href: '/messages', label: 'View Messages', icon: MessageSquare },
];

const recentActivity = [
    { id: 1, description: "New student registration: John Doe", time: "10m ago", dataAiHint: "profile activity" },
    { id: 2, description: "Event 'Tech Summit 2024' created", time: "1h ago", dataAiHint: "event calendar" },
    { id: 3, description: "Clearance request approved for Jane Smith", time: "3h ago", dataAiHint: "document checkmark" },
    { id: 4, description: "5 new messages in SSG inbox", time: "yesterday", dataAiHint: "message notification" },
];


export function SSGDashboard() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-headline font-semibold">SSG Admin Dashboard</h1>
      
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="shadow-md hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Students</CardTitle>
            <Users className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{ssgStats.totalStudents}</div>
            <p className="text-xs text-muted-foreground">+20 since last week</p>
          </CardContent>
        </Card>
        <Card className="shadow-md hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Events</CardTitle>
            <CalendarDays className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{ssgStats.activeEvents}</div>
            <p className="text-xs text-muted-foreground">2 upcoming this week</p>
          </CardContent>
        </Card>
        <Card className="shadow-md hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Clearances</CardTitle>
            <ListChecks className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{ssgStats.pendingClearances}</div>
            <p className="text-xs text-muted-foreground">Needs attention</p>
          </CardContent>
        </Card>
        <Card className="shadow-md hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recent Messages</CardTitle>
            <MessageSquare className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{ssgStats.recentMessages}</div>
            <p className="text-xs text-muted-foreground">Unread</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Links & Recent Activity */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle>Quick Links</CardTitle>
            <CardDescription>Access key management sections</CardDescription>
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
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest updates and actions in the system</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {recentActivity.map(activity => (
              <div key={activity.id} className="flex items-start space-x-3">
                <div className="flex-shrink-0 pt-1">
                  <Image 
                    src={`https://placehold.co/32x32.png?text=${activity.description.substring(0,1)}`} 
                    alt="Activity icon" 
                    width={32} 
                    height={32}
                    data-ai-hint={activity.dataAiHint}
                    className="rounded-full"
                  />
                </div>
                <div>
                  <p className="text-sm">{activity.description}</p>
                  <p className="text-xs text-muted-foreground">{activity.time}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Placeholder for Charts/Graphs */}
      <Card className="shadow-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><BarChart3 className="text-primary"/> System Analytics</CardTitle>
          <CardDescription>Overview of system usage and trends (Placeholder)</CardDescription>
        </CardHeader>
        <CardContent className="h-64 flex items-center justify-center bg-muted/30 rounded-md">
          <p className="text-muted-foreground">Chart data will be displayed here.</p>
        </CardContent>
      </Card>
    </div>
  );
}
