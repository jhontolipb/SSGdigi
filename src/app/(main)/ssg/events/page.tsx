
"use client";

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"; // Removed DialogDescription
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { CalendarDays, PlusCircle, Edit, Trash2, MoreHorizontal } from "lucide-react"; // Removed UserCheck, Users
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"; // Added DropdownMenu components
// Select components are not directly used here, Checkbox is used for OICs
import type { Event, UserProfile } from '@/types/user'; 
import { Checkbox } from '@/components/ui/checkbox';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

const initialEvents: Event[] = [];

export default function EventManagementPage() {
  const { allUsers, allEvents, addEvent, updateEvent, deleteEvent } = useAuth(); // Using event functions from context
  const { toast } = useToast();

  const [events, setEvents] = useState<Event[]>(allEvents || initialEvents);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  
  const [formData, setFormData] = useState<Partial<Event>>({
    name: '', description: '', date: '', timeIn: '', timeOut: '', organizerType: 'ssg', organizerId: 'ssg_main', oicIds: [], sanctions: ''
  });

  useEffect(() => {
    setEvents(allEvents || initialEvents);
  }, [allEvents]);
  
  const availableOICs = allUsers.filter(u => u.role === 'oic');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
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
      deleteEvent(eventId); // Use context function
      toast({title: "Event Deleted", description: "The event has been removed."});
    }
  };

  const handleSubmit = () => {
    if (!formData.name || !formData.date || !formData.timeIn || !formData.timeOut) {
        toast({title: "Error", description: "Event name, date, and times are required.", variant: "destructive"});
        return;
    }
    if (editingEvent) {
      const updatedEventData = { ...editingEvent, ...formData } as Event;
      updateEvent(updatedEventData); // Use context function
      toast({title: "Event Updated", description: `${updatedEventData.name} has been updated.`});
    } else {
      const newEventData: Event = {
        id: `event_${Date.now()}`,
        ...formData,
        // Ensure organizerType and organizerId are correctly set for SSG-created events
        organizerType: formData.organizerType || 'ssg', 
        organizerId: formData.organizerId || 'ssg_main',
      } as Event;
      addEvent(newEventData); // Use context function
      toast({title: "Event Created", description: `${newEventData.name} has been created.`});
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
                  <TableHead>Date & Time</TableHead>
                  <TableHead>Organizer</TableHead>
                  <TableHead>OICs</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {events.length === 0 && (
                    <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground h-24">No events found. Create one to get started.</TableCell></TableRow>
                )}
                {events.map((event) => (
                  <TableRow key={event.id}>
                    <TableCell className="font-medium">{event.name}</TableCell>
                    <TableCell>{event.date} ({event.timeIn} - {event.timeOut})</TableCell>
                    <TableCell className="capitalize">{event.organizerType}</TableCell>
                    <TableCell>{event.oicIds?.length || 0} assigned</TableCell>
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
            <div><Label htmlFor="location">Location</Label><Input id="location" name="location" value={formData.location || ''} onChange={handleInputChange} /></div>

            {/* For SSG Admin, they can create SSG, Club, or Department events */}
            {/* This part could be enhanced with dynamic selection of organizerId based on type */}
            <div>
              <Label htmlFor="organizerType">Organizer Type</Label>
              <select id="organizerType" name="organizerType" value={formData.organizerType || 'ssg'} onChange={(e) => setFormData(prev => ({...prev, organizerType: e.target.value as Event['organizerType'], organizerId: e.target.value === 'ssg' ? 'ssg_main' : ''}))} className="w-full p-2 border rounded-md">
                <option value="ssg">SSG</option>
                <option value="club">Club</option>
                <option value="department">Department</option>
              </select>
            </div>
             {formData.organizerType !== 'ssg' && (
                 <div>
                     <Label htmlFor="organizerId">Organizer ID (Club/Dept ID)</Label>
                     <Input id="organizerId" name="organizerId" value={formData.organizerId || ''} onChange={handleInputChange} placeholder={`Enter ${formData.organizerType} ID`} />
                 </div>
             )}
            
            <div>
                <Label>Assign OICs</Label>
                <Card className="mt-1 p-3 max-h-40 overflow-y-auto">
                    <div className="space-y-2">
                    {availableOICs.length === 0 && <p className="text-sm text-muted-foreground">No OICs available.</p>}
                    {availableOICs.map(oic => (
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
