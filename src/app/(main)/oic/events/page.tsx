
"use client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CalendarDays, QrCode } from "lucide-react";
import Link from "next/link";

// Mock data
const mockAssignedEvents = [
  { id: 'event1', name: 'SSG General Assembly', date: '2024-09-15', time: '09:00 - 12:00', location: 'University Hall' },
  { id: 'event3', name: 'IT Department Seminar', date: '2024-09-25', time: '10:00 - 11:30', location: 'Room C-201' },
];

export default function OICEventsPage() {
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
          {mockAssignedEvents.length === 0 ? (
            <p className="text-muted-foreground">You are not currently assigned to any events.</p>
          ) : (
            <ul className="space-y-4">
              {mockAssignedEvents.map(event => (
                <li key={event.id} className="p-4 border rounded-lg shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                  <div>
                    <h3 className="text-lg font-semibold">{event.name}</h3>
                    <p className="text-sm text-muted-foreground">Date: {event.date}</p>
                    <p className="text-sm text-muted-foreground">Time: {event.time}</p>
                    <p className="text-sm text-muted-foreground">Location: {event.location}</p>
                  </div>
                  <Link href="/oic/scan" passHref>
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

