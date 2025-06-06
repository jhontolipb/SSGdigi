
"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Users, CalendarDays, ListChecks, MessageSquare, BarChart3, Activity, Icon, Loader2 } from 'lucide-react';
import Link from "next/link";
import Image from "next/image";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAuth } from '@/contexts/AuthContext';
import { useEffect, useState } from 'react';

interface SSGStats {
  totalStudents: number;
  activeEvents: number;
  pendingClearances: number;
  recentMessages: number;
}

const quickLinks = [
  { href: '/ssg/users', label: 'Manage Users', icon: Users },
  { href: '/ssg/events', label: 'Manage Events', icon: CalendarDays },
  { href: '/ssg/clearance', label: 'Clearance Requests', icon: ListChecks },
  { href: '/messages', label: 'View Messages', icon: MessageSquare },
];

const recentActivity: { id: number; description: string; time: string; icon?: React.ElementType }[] = [];


export function SSGDashboard() {
  const { allUsers, allEvents, loading: authLoading } = useAuth();
  const [ssgStats, setSsgStats] = useState<SSGStats>({
    totalStudents: 0,
    activeEvents: 0,
    pendingClearances: 0,
    recentMessages: 0,
  });

  useEffect(() => {
    if (!authLoading) {
        const studentsCount = allUsers.filter(u => u.role === 'student').length;
        const eventsCount = allEvents.length;
        // Placeholder for pending clearances and messages
        setSsgStats({
        totalStudents: studentsCount,
        activeEvents: eventsCount,
        pendingClearances: 0,
        recentMessages: 0,
        });
    }
  }, [allUsers, allEvents, authLoading]);

  if (authLoading) {
    return (
        <div className="flex min-h-screen items-center justify-center">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <p className="ml-4">Loading Dashboard...</p>
        </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-headline font-semibold">SSG Admin Dashboard</h1>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="shadow-md hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Students</CardTitle>
            <Users className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{ssgStats.totalStudents}</div>
          </CardContent>
        </Card>
        <Card className="shadow-md hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Events</CardTitle>
            <CalendarDays className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{ssgStats.activeEvents}</div>
          </CardContent>
        </Card>
        <Card className="shadow-md hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Clearances</CardTitle>
            <ListChecks className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{ssgStats.pendingClearances}</div>
          </CardContent>
        </Card>
        <Card className="shadow-md hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recent Messages</CardTitle>
            <MessageSquare className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{ssgStats.recentMessages}</div>
          </CardContent>
        </Card>
      </div>

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
            {recentActivity.length === 0 && (
                <p className="text-muted-foreground text-center py-4">No recent activity.</p>
            )}
            {recentActivity.map(activity => (
              <div key={activity.id} className="flex items-start space-x-3">
                <Avatar className="h-8 w-8 flex-shrink-0">
                  <AvatarFallback>
                    {activity.icon ? <activity.icon className="h-4 w-4" /> : <Activity className="h-4 w-4" />}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm">{activity.description}</p>
                  <p className="text-xs text-muted-foreground">{activity.time}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><BarChart3 className="text-primary"/> System Analytics</CardTitle>
          <CardDescription>Overview of system usage and trends</CardDescription>
        </CardHeader>
        <CardContent className="h-64 flex items-center justify-center bg-muted/30 rounded-md">
          <p className="text-muted-foreground">Analytics charts will be displayed here.</p>
        </CardContent>
      </Card>
    </div>
  );
}
