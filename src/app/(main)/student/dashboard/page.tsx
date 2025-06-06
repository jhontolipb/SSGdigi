
"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { QrCode, CalendarDays, FileText, MessageSquare, Award, Bell, Icon } from "lucide-react"; // Added Icon
import Link from "next/link";
import Image from "next/image"; // Keep for profile avatar logic if used elsewhere, but remove for quick links
import { useAuth } from "@/contexts/AuthContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"; // Added Avatar, AvatarFallback

const studentDashboardData = {
  upcomingEvents: 0,
  clearanceStatus: "Not Requested",
  unreadMessages: 0,
  currentPoints: 0, // Will be fetched from user context
};

const quickAccessLinks: { href: string; label: string; icon: React.ElementType; dataAiHint?: string }[] = [
  { href: '/student/qr-code', label: 'My QR Code', icon: QrCode, dataAiHint: "QR code display" },
  { href: '/student/events', label: 'View Events', icon: CalendarDays, dataAiHint: "event calendar"},
  { href: '/student/clearance', label: 'Track Clearance', icon: FileText, dataAiHint: "document status" },
  { href: '/messages', label: 'My Messages', icon: MessageSquare, dataAiHint: "chat bubbles" },
  { href: '/student/points', label: 'My Points', icon: Award, dataAiHint: "trophy award" },
  { href: '/notifications', label: 'Notifications', icon: Bell, dataAiHint: "notification bell" },
];

const recentNotifications: {id: string; text: string; time: string}[] = [
    // No mock notifications
];


export default function StudentDashboardPage() {
  const { user } = useAuth();

  const currentPoints = user?.points ?? 0;
  // In a real app, other dashboard data would be fetched
  // For now, we use the default values or derive from user context if available

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
            <div className="text-2xl font-bold">{studentDashboardData.upcomingEvents}</div>
            <Link href="/student/events" className="text-xs text-primary hover:underline">View all</Link>
          </CardContent>
        </Card>
        <Card className="shadow-md hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Clearance Status</CardTitle>
            <FileText className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold">{studentDashboardData.clearanceStatus}</div>
            <Link href="/student/clearance" className="text-xs text-primary hover:underline">Track progress</Link>
          </CardContent>
        </Card>
        <Card className="shadow-md hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unread Messages</CardTitle>
            <MessageSquare className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{studentDashboardData.unreadMessages}</div>
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
