
// TODO: Implement Student Event View page
// View a list of upcoming events (SSG, Club, Departmental).
// View event details, including sanctions.
"use client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CalendarDays, Info, ShieldCheck, Building2, Users2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

// Mock Data
const mockStudentEvents = [
  { id: 'event1', name: 'SSG General Assembly', date: '2024-09-15', time: '09:00 AM', organizer: 'SSG', type: 'ssg', sanctions: '10 points deduction for unexcused absence.', description: 'Annual general assembly for all students to discuss plans and address concerns.'},
  { id: 'event2', name: 'Robotics Club Workshop: Intro to Arduino', date: '2024-09-20', time: '01:00 PM', organizer: 'Robotics Club', type: 'club', sanctions: 'Club membership review for non-attendance.', description: 'Hands-on workshop covering the basics of Arduino programming and simple projects.' },
  { id: 'event3', name: 'IT Department Seminar: AI Trends', date: '2024-09-25', time: '10:00 AM', organizer: 'BSIT Department', type: 'department', sanctions: 'None', description: 'Guest lecture from industry expert on current and future trends in Artificial Intelligence.'},
  { id: 'event4', name: 'Campus Clean-up Drive', date: '2024-10-05', time: '08:00 AM', organizer: 'SSG & Eco Warriors Club', type: 'ssg', sanctions: '5 points addition for participation.', description: 'Join us in making our campus cleaner and greener! All volunteers welcome.'},
];

const getOrganizerIcon = (type: string) => {
    switch(type) {
        case 'ssg': return <Users2 className="h-4 w-4 mr-1 text-primary" />;
        case 'club': return <ShieldCheck className="h-4 w-4 mr-1 text-accent" />;
        case 'department': return <Building2 className="h-4 w-4 mr-1 text-secondary-foreground" />; // Using secondary-foreground for variety
        default: return <CalendarDays className="h-4 w-4 mr-1" />;
    }
};


export default function StudentEventsPage() {
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
          {mockStudentEvents.length === 0 ? (
             <p className="text-center text-muted-foreground py-10">No upcoming events scheduled at the moment.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {mockStudentEvents.map(event => (
                <Card key={event.id} className="flex flex-col justify-between hover:shadow-xl transition-shadow duration-300">
                  <CardHeader>
                    <CardTitle className="text-lg">{event.name}</CardTitle>
                    <div className="flex items-center text-sm text-muted-foreground mt-1">
                        {getOrganizerIcon(event.type)}
                        <span>{event.organizer}</span>
                    </div>
                  </CardHeader>
                  <CardContent className="flex-grow">
                    <p className="text-sm text-muted-foreground"><strong>Date:</strong> {event.date}</p>
                    <p className="text-sm text-muted-foreground"><strong>Time:</strong> {event.time}</p>
                    <p className="text-sm mt-2 line-clamp-3">{event.description}</p>
                    {event.sanctions && (
                      <Badge variant={event.sanctions.toLowerCase().includes('deduction') || event.sanctions.toLowerCase().includes('review') ? "destructive" : "secondary"} className="mt-2 text-xs">
                        Sanction: {event.sanctions}
                      </Badge>
                    )}
                  </CardContent>
                  <div className="p-4 pt-0">
                     <Button variant="outline" size="sm" className="w-full" onClick={() => alert(`Viewing details for ${event.name}`)}>
                        <Info className="mr-2 h-4 w-4" /> View Details
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

