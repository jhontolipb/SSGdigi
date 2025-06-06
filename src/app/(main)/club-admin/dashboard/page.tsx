
"use client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Users, CalendarDays, ListChecks, MessageSquare, Loader2 } from 'lucide-react';
import Link from "next/link";
import { useAuth } from '@/contexts/AuthContext';
import { useEffect, useState } from 'react';

interface ClubAdminStats {
  clubMembers: number;
  activeEvents: number;
  pendingClearances: number;
  recentMessages: number;
}

const quickLinks = [
  { href: '/club-admin/members', label: 'Manage Members', icon: Users },
  { href: '/club-admin/events', label: 'Manage Events', icon: CalendarDays },
  { href: '/club-admin/clearance', label: 'Clearance Requests', icon: ListChecks },
  { href: '/messages', label: 'View Messages', icon: MessageSquare },
];


export default function ClubAdminDashboardPage() {
  const { user, allUsers, allEvents, allClubs, loading: authLoading } = useAuth();
  const [clubAdminStats, setClubAdminStats] = useState<ClubAdminStats>({
    clubMembers: 0,
    activeEvents: 0,
    pendingClearances: 0,
    recentMessages: 0,
  });
  const [clubName, setClubName] = useState("Club");

  useEffect(() => {
    if (!authLoading && user && user.role === 'club_admin' && user.clubID) {
      const clubDetails = allClubs.find(c => c.id === user.clubID);
      if (clubDetails) {
        setClubName(clubDetails.name);
      }

      const membersCount = allUsers.filter(u => u.role === 'student' && u.clubID === user.clubID).length;
      const eventsCount = allEvents.filter(e => e.organizerType === 'club' && e.organizerId === user.clubID).length;

      setClubAdminStats({
        clubMembers: membersCount,
        activeEvents: eventsCount,
        pendingClearances: 0,
        recentMessages: 0,
      });
    }
  }, [user, allUsers, allEvents, allClubs, authLoading]);

  if (authLoading) {
    return (
        <div className="flex min-h-screen items-center justify-center">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <p className="ml-4">Loading Dashboard...</p>
        </div>
    );
  }
  if (!user?.clubID) {
     return (
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Club Not Assigned</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">You are not currently assigned to manage a club. Event-related statistics may not be available.</p>
        </CardContent>
      </Card>
    );
  }


  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-headline font-semibold">{clubName} Admin Dashboard</h1>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="shadow-md hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Club Members</CardTitle>
            <Users className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{clubAdminStats.clubMembers}</div>
          </CardContent>
        </Card>
        <Card className="shadow-md hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Club Events</CardTitle>
            <CalendarDays className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{clubAdminStats.activeEvents}</div>
          </CardContent>
        </Card>
        <Card className="shadow-md hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Clearances (Club)</CardTitle>
            <ListChecks className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{clubAdminStats.pendingClearances}</div>
          </CardContent>
        </Card>
        <Card className="shadow-md hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recent Messages</CardTitle>
            <MessageSquare className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{clubAdminStats.recentMessages}</div>
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
            <CardTitle>Club Activity Feed</CardTitle>
          </CardHeader>
          <CardContent className="h-40 flex items-center justify-center bg-muted/30 rounded-md">
            <p className="text-muted-foreground">No recent club activity.</p>
          </CardContent>
        </Card>
    </div>
  );
}
