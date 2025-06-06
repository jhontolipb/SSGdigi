
"use client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CalendarDays, QrCode } from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from 'react'; // Added for state management
import { useAuth } from '@/contexts/AuthContext'; // To get current OIC and their assigned events
import type { Event } from '@/types/user';

export default function OICEventsPage() {
  const { user, allEvents } = useAuth(); // Assuming allEvents is available in AuthContext or fetched
  const [assignedEvents, setAssignedEvents] = useState<Event[]>([]);

  useEffect(() => {
    if (user && user.role === 'oic' && allEvents) {
      // Filter events where this OIC is assigned
      const oicEvents = allEvents.filter(event => event.oicIds.includes(user.userID));
      setAssignedEvents(oicEvents);
    }
  }, [user, allEvents]);

  return (
    <div className="space-y-6">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl font-headline flex items-center gap-2">
            <CalendarDays className="text-primary h-7 w-7" /> Assigned Events
          </CardTitle>
          <CardDescription>View events you are assigned to as Officer-in-Charge.</CardDescription>
        </CardHeader>
        <CardContent>
          {assignedEvents.length === 0 ? (
            <p className="text-muted-foreground text-center py-10">You are not currently assigned to any events.</p>
          ) : (
            <ul className="space-y-4">
              {assignedEvents.map(event => (
                <li key={event.id} className="p-4 border rounded-lg shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                  <div>
                    <h3 className="text-lg font-semibold">{event.name}</h3>
                    <p className="text-sm text-muted-foreground">Date: {event.date}</p>
                    <p className="text-sm text-muted-foreground">Time: {event.timeIn} - {event.timeOut}</p>
                    <p className="text-sm text-muted-foreground">Location: {event.location || 'N/A'}</p>
                  </div>
                  <Link href={`/oic/scan?eventId=${event.id}`} passHref> {/* Pass eventId to scanner if needed */}
                    <Button variant="outline" className="mt-2 sm:mt-0">
                      <QrCode className="mr-2 h-4 w-4" /> Open Scanner
                    </Button>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
