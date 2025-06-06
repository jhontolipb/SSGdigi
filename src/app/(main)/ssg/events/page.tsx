
// TODO: Implement SSG Admin Event Management page
// This page will allow SSG Admins to CRUD events, assign OICs, define sanctions.
// It should display a list of all events (SSG, Club, Departmental).

"use client";

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { CalendarDays, PlusCircle, Edit, Trash2, MoreHorizontal, UserCheck, Users } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Event, UserProfile } from '@/types/user'; // Assuming Event type exists
import { Checkbox } from '@/components/ui/checkbox';


// Mock data
const mockEvents: Event[] = [
  { id: 'event1', name: 'SSG General Assembly', description: 'Annual general assembly for all students.', date: '2024-09-15', timeIn: '09:00', timeOut: '12:00', organizerType: 'ssg', organizerId: 'ssg_main', oicIds: ['oic1', 'oic2'], sanctions: '10 points deduction for unexcused absence.' },
  { id: 'event2', name: 'Robotics Club Workshop', description: 'Intro to Arduino programming.', date: '2024-09-20', timeIn: '13:00', timeOut: '16:00', organizerType: 'club', organizerId: 'club1', oicIds: ['oic3'], sanctions: 'Club membership review.' },
  { id: 'event3', name: 'IT Department Seminar', description: 'Guest lecture on AI trends.', date: '2024-09-25', timeIn: '10:00', timeOut: '11:30', organizerType: 'department', organizerId: 'dept_bs_it', oicIds: ['oic1'], sanctions: 'None' },
];

const mockOICs: UserProfile[] = [ // Filtered for OIC role
    { userID: 'oic1', fullName: 'Charlie Chaplin', role: 'oic', email: 'oic1@example.com' },
    { userID: 'oic2', fullName: 'David Copperfield', role: 'oic', email: 'oic2@example.com' },
    { userID: 'oic3', fullName: 'Eve Adams', role: 'oic', email: 'oic3@example.com' },
];

export default function EventManagementPage() {
  const [events, setEvents] = useState<Event[]>(mockEvents);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  
  // Form state
  const [formData, setFormData] = useState<Partial<Event>>({
    name: '', description: '', date: '', timeIn: '', timeOut: '', organizerType: 'ssg', organizerId: 'ssg_main', oicIds: [], sanctions: ''
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleOICChange = (oicId: string) => {
    setFormData(prev => {
        const currentOicIds = prev.oicIds || [];
        const newOicIds = currentOicIds.includes(oicId) 
                            ? currentOicIds.filter(id => id !== oicId)
                            : [...currentOicIds, oicId];
        return { ...prev, oicIds: newOicIds };
    });
  };

  const handleCreateNew = () => {
    setEditingEvent(null);
    setFormData({ name: '', description: '', date: '', timeIn: '', timeOut: '', organizerType: 'ssg', organizerId: 'ssg_main', oicIds: [], sanctions: '' });
    setIsFormOpen(true);
  };

  const handleEdit = (event: Event) => {
    setEditingEvent(event);
    setFormData({ ...event });
    setIsFormOpen(true);
  };

  const handleDelete = (eventId: string) => {
    if (window.confirm("Are you sure you want to delete this event?")) {
      setEvents(prev => prev.filter(e => e.id !== eventId));
    }
  };

  const handleSubmit = () => {
    // Add validation here
    if (editingEvent) {
      setEvents(prev => prev.map(e => e.id === editingEvent.id ? { ...e, ...formData } as Event : e));
    } else {
      const newEvent: Event = {
        id: `event_${Date.now()}`,
        ...formData,
      } as Event;
      setEvents(prev => [...prev, newEvent]);
    }
    setIsFormOpen(false);
  };

  return (
    <div className="space-y-6">
      <Card className="shadow-lg">
        <CardHeader>
           <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div>
              <CardTitle className="text-2xl font-headline flex items-center gap-2">
                <CalendarDays className="text-primary h-7 w-7" /> Event Management
              </CardTitle>
              <CardDescription>Create, view, and manage all campus events.</CardDescription>
            </div>
            <Button onClick={handleCreateNew} className="bg-primary hover:bg-primary/90">
              <PlusCircle className="mr-2 h-5 w-5" /> Create New Event
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Event Name</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Organizer</TableHead>
                  <TableHead>OICs</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {events.map((event) => (
                  <TableRow key={event.id}>
                    <TableCell className="font-medium">{event.name}</TableCell>
                    <TableCell>{event.date} ({event.timeIn} - {event.timeOut})</TableCell>
                    <TableCell className="capitalize">{event.organizerType}</TableCell>
                    <TableCell>{event.oicIds.length} assigned</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild><Button variant="ghost" className="h-8 w-8 p-0"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEdit(event)}><Edit className="mr-2 h-4 w-4" /> Edit</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDelete(event.id)} className="text-destructive focus:text-destructive focus:bg-destructive/10"><Trash2 className="mr-2 h-4 w-4" /> Delete</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
           {events.length === 0 && <p className="text-center text-muted-foreground py-10">No events found. Create one to get started.</p>}
        </CardContent>
      </Card>

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingEvent ? 'Edit Event' : 'Create New Event'}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4 max-h-[70vh] overflow-y-auto pr-2">
            <div><Label htmlFor="name">Event Name</Label><Input id="name" name="name" value={formData.name || ''} onChange={handleInputChange} /></div>
            <div><Label htmlFor="description">Description</Label><Textarea id="description" name="description" value={formData.description || ''} onChange={handleInputChange} /></div>
            <div><Label htmlFor="date">Date</Label><Input id="date" name="date" type="date" value={formData.date || ''} onChange={handleInputChange} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label htmlFor="timeIn">Time In</Label><Input id="timeIn" name="timeIn" type="time" value={formData.timeIn || ''} onChange={handleInputChange} /></div>
              <div><Label htmlFor="timeOut">Time Out</Label><Input id="timeOut" name="timeOut" type="time" value={formData.timeOut || ''} onChange={handleInputChange} /></div>
            </div>
            {/* Organizer fields are pre-filled for SSG admin creating SSG events */}
            {/* For a more complex system, these would be selectable */}
            <input type="hidden" name="organizerType" value="ssg" />
            <input type="hidden" name="organizerId" value="ssg_main" />
            
            <div>
                <Label>Assign OICs</Label>
                <Card className="mt-1 p-3 max-h-40 overflow-y-auto">
                    <div className="space-y-2">
                    {mockOICs.map(oic => (
                        <div key={oic.userID} className="flex items-center space-x-2">
                            <Checkbox 
                                id={`oic-${oic.userID}`} 
                                checked={formData.oicIds?.includes(oic.userID) || false}
                                onCheckedChange={() => handleOICChange(oic.userID)}
                            />
                            <Label htmlFor={`oic-${oic.userID}`} className="font-normal">{oic.fullName} ({oic.email})</Label>
                        </div>
                    ))}
                    </div>
                </Card>
            </div>

            <div><Label htmlFor="sanctions">Sanctions for Non-participation</Label><Textarea id="sanctions" name="sanctions" value={formData.sanctions || ''} onChange={handleInputChange} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsFormOpen(false)}>Cancel</Button>
            <Button onClick={handleSubmit} className="bg-primary hover:bg-primary/90">{editingEvent ? 'Save Changes' : 'Create Event'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
