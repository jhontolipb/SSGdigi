
"use client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CalendarDays, Info, ShieldCheck, Building2, Users2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useState, useEffect } from 'react'; // Added for state
import { useAuth } from '@/contexts/AuthContext'; // To get events
import type { Event } from '@/types/user';


const getOrganizerIcon = (type: string) => {
    switch(type) {
        case 'ssg': return <Users2 className="h-4 w-4 mr-1 text-primary" />;
        case 'club': return <ShieldCheck className="h-4 w-4 mr-1 text-accent" />;
        case 'department': return <Building2 className="h-4 w-4 mr-1 text-secondary-foreground" />;
        default: return <CalendarDays className="h-4 w-4 mr-1" />;
    }
};


export default function StudentEventsPage() {
  const { allEvents } = useAuth();
  const [studentEvents, setStudentEvents] = useState<Event[]>([]);

  useEffect(() => {
    // In a real app, events might be filtered based on student's department, club, etc.
    // For now, show all events.
    setStudentEvents(allEvents || []);
  }, [allEvents]);

  return (
    <div className="space-y-6">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl font-headline flex items-center gap-2">
            <CalendarDays className="text-primary h-7 w-7" /> Upcoming Events
          </CardTitle>
          <CardDescription>Stay informed about events relevant to you.</CardDescription>
        </CardHeader>
        <CardContent>
          {studentEvents.length === 0 ? (
             <p className="text-center text-muted-foreground py-10">No upcoming events scheduled at the moment.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {studentEvents.map(event => (
                <Card key={event.id} className="flex flex-col justify-between hover:shadow-xl transition-shadow duration-300">
                  <CardHeader>
                    <CardTitle className="text-lg">{event.name}</CardTitle>
                    <div className="flex items-center text-sm text-muted-foreground mt-1">
                        {getOrganizerIcon(event.organizerType)}
                        <span>{event.organizerType.toUpperCase()} {event.organizerType !== 'ssg' ? `(${event.organizerId})` : ''}</span>
                    </div>
                  </CardHeader>
                  <CardContent className="flex-grow">
                    <p className="text-sm text-muted-foreground"><strong>Date:</strong> {event.date}</p>
                    <p className="text-sm text-muted-foreground"><strong>Time:</strong> {event.timeIn} - {event.timeOut}</p>
                    <p className="text-sm mt-2 line-clamp-3">{event.description}</p>
                    {event.sanctions && (
                      <Badge variant={event.sanctions.toLowerCase().includes('deduction') || event.sanctions.toLowerCase().includes('review') ? "destructive" : "secondary"} className="mt-2 text-xs">
                        Sanction: {event.sanctions}
                      </Badge>
                    )}
                  </CardContent>
                  <div className="p-4 pt-0">
                     <Button variant="outline" size="sm" className="w-full" onClick={() => alert(`Viewing details for ${event.name}`)} disabled>
                        <Info className="mr-2 h-4 w-4" /> View Details (Not Impl.)
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
