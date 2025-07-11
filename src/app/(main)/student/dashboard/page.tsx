
"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { QrCode, CalendarDays, FileText, MessageSquare, Award, Bell, Icon, Loader2 } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useState, useEffect } from 'react';

interface StudentDashboardData {
  upcomingEvents: number;
  clearanceStatus: string;
  unreadMessages: number;
}

const quickAccessLinks: { href: string; label: string; icon: React.ElementType; dataAiHint?: string }[] = [
  { href: '/student/qr-code', label: 'My QR Code', icon: QrCode, dataAiHint: "QR code display" },
  { href: '/student/events', label: 'View Events', icon: CalendarDays, dataAiHint: "event calendar"},
  { href: '/student/clearance', label: 'Track Clearance', icon: FileText, dataAiHint: "document status" },
  { href: '/messages', label: 'My Messages', icon: MessageSquare, dataAiHint: "chat bubbles" },
  { href: '/student/points', label: 'My Points', icon: Award, dataAiHint: "trophy award" },
  { href: '/notifications', label: 'Notifications', icon: Bell, dataAiHint: "notification bell" },
];

const recentNotifications: {id: string; text: string; time: string}[] = [];


export default function StudentDashboardPage() {
  const { user, allEvents, loading: authLoading } = useAuth();
  const [dashboardData, setDashboardData] = useState<StudentDashboardData>({
    upcomingEvents: 0,
    clearanceStatus: "Not Requested",
    unreadMessages: 0,
  });

  const currentPoints = user?.points ?? 0;

  useEffect(() => {
    if (!authLoading) {
        const relevantEventsCount = allEvents.filter(event => {
        const eventDate = new Date(event.date);
        const today = new Date();
        today.setHours(0,0,0,0);
        return eventDate >= today;
        }).length;

        setDashboardData(prev => ({
        ...prev,
        upcomingEvents: relevantEventsCount,
        }));
    }
  }, [allEvents, authLoading]);

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
      <h1 className="text-3xl font-headline font-semibold">Welcome, {user?.fullName || 'Student'}!</h1>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="shadow-md hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Upcoming Events</CardTitle>
            <CalendarDays className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardData.upcomingEvents}</div>
            <Link href="/student/events" className="text-xs text-primary hover:underline">View all</Link>
          </CardContent>
        </Card>
        <Card className="shadow-md hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Clearance Status</CardTitle>
            <FileText className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold">{dashboardData.clearanceStatus}</div>
            <Link href="/student/clearance" className="text-xs text-primary hover:underline">Track progress</Link>
          </CardContent>
        </Card>
        <Card className="shadow-md hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unread Messages</CardTitle>
            <MessageSquare className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardData.unreadMessages}</div>
            <Link href="/messages" className="text-xs text-primary hover:underline">Go to inbox</Link>
          </CardContent>
        </Card>
        <Card className="shadow-md hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">My Points</CardTitle>
            <Award className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{currentPoints}</div>
             <Link href="/student/points" className="text-xs text-primary hover:underline">View details</Link>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-md">
        <CardHeader>
          <CardTitle>Quick Access</CardTitle>
          <CardDescription>Navigate to important sections quickly.</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {quickAccessLinks.map(link => (
            <Link key={link.href} href={link.href} passHref>
              <div className="flex flex-col items-center justify-center text-center p-4 border rounded-lg hover:bg-muted/50 hover:shadow-md transition-all cursor-pointer aspect-square">
                <Avatar className="w-12 h-12 mb-2">
                    <AvatarFallback className="bg-primary/10 text-primary">
                        <link.icon className="h-6 w-6" />
                    </AvatarFallback>
                </Avatar>
                <span className="font-medium text-sm">{link.label}</span>
              </div>
            </Link>
          ))}
        </CardContent>
      </Card>

      <Card className="shadow-md">
        <CardHeader>
            <CardTitle>Recent Notifications</CardTitle>
        </CardHeader>
        <CardContent>
            {recentNotifications.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">No recent notifications.</p>
            ) : (
                <div className="space-y-3">
                    {recentNotifications.map(notif => (
                    <div key={notif.id} className="p-3 border rounded-md bg-accent/10">
                        <p className="font-semibold text-sm">{notif.text}</p>
                        <p className="text-xs text-muted-foreground">{notif.time}</p>
                    </div>
                    ))}
                </div>
            )}
            <div className="mt-4 text-right">
                <Link href="/notifications" passHref><Button variant="link">View All Notifications</Button></Link>
            </div>
        </CardContent>
      </Card>
    </div>
  );
}
