
"use client";

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { CalendarDays, PlusCircle, Edit, Trash2, MoreHorizontal, Loader2 } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import type { Event, UserProfile, Club, Department } from '@/types/user';
import { Checkbox } from '@/components/ui/checkbox';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";


export default function EventManagementPage() {
  const { allUsers, allEvents, addEventToFirestore, updateEventInFirestore, deleteEventFromFirestore, allClubs, allDepartments, loading: authLoading } = useAuth();
  const { toast } = useToast();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState<Partial<Omit<Event, 'id'>>>({
    name: '', description: '', date: '', timeIn: '', timeOut: '', location: '', organizerType: 'ssg', organizerId: 'ssg_main', oicIds: [], sanctions: ''
  });

  const availableOICs = allUsers.filter(u => u.role === 'oic');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
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
    setFormData({ name: '', description: '', date: '', timeIn: '', timeOut: '', location: '', organizerType: 'ssg', organizerId: 'ssg_main', oicIds: [], sanctions: '' });
    setIsFormOpen(true);
  };

  const handleEdit = (event: Event) => {
    setEditingEvent(event);
    const { id, ...eventData } = event;
    setFormData({ ...eventData });
    setIsFormOpen(true);
  };

  const handleDelete = async (eventId: string) => {
    if (window.confirm("Are you sure you want to delete this event?")) {
      setIsSubmitting(true);
      await deleteEventFromFirestore(eventId);
      setIsSubmitting(false);
      // Toast is handled by context
    }
  };

  const handleSubmit = async () => {
    if (!formData.name || !formData.date || !formData.timeIn || !formData.timeOut || !formData.organizerType || !formData.organizerId) {
        toast({title: "Error", description: "Event name, date, times, organizer type and ID are required.", variant: "destructive"});
        return;
    }
    if ((formData.organizerType === 'club' || formData.organizerType === 'department') && (!formData.organizerId || formData.organizerId === 'ssg_main')) {
      toast({title: "Error", description: `Please select a valid ${formData.organizerType} for the event.`, variant: "destructive"});
      return;
    }

    setIsSubmitting(true);
    const eventPayload = { ...formData } as Omit<Event, 'id'>;

    if (editingEvent) {
      await updateEventInFirestore(editingEvent.id, eventPayload);
    } else {
      await addEventToFirestore(eventPayload);
    }
    setIsSubmitting(false);
    setIsFormOpen(false);
  };

  const getOrganizerName = (type: Event['organizerType'], id: string) => {
    if (type === 'ssg') return 'SSG';
    if (type === 'club') return allClubs.find(c => c.id === id)?.name || id;
    if (type === 'department') return allDepartments.find(d => d.id === id)?.name || id;
    return id;
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
              <CardDescription>Create, view, and manage all campus events (Data from Firestore).</CardDescription>
            </div>
            <Button onClick={handleCreateNew} className="bg-primary hover:bg-primary/90" disabled={isSubmitting || authLoading}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              <PlusCircle className="mr-2 h-5 w-5" /> Create New Event
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {authLoading && (
            <div className="flex justify-center items-center py-10">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="ml-2">Loading events...</p>
            </div>
          )}
          {!authLoading && (
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
                  {allEvents.length === 0 && (
                      <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground h-24">No events found. Create one to get started.</TableCell></TableRow>
                  )}
                  {allEvents.map((event) => (
                    <TableRow key={event.id}>
                      <TableCell className="font-medium">{event.name}</TableCell>
                      <TableCell>{event.date} ({event.timeIn} - {event.timeOut})</TableCell>
                      <TableCell className="capitalize">
                        {getOrganizerName(event.organizerType, event.organizerId)}
                      </TableCell>
                      <TableCell>{event.oicIds?.length || 0} assigned</TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild><Button variant="ghost" className="h-8 w-8 p-0" disabled={isSubmitting}><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEdit(event)} disabled={isSubmitting}><Edit className="mr-2 h-4 w-4" /> Edit</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDelete(event.id)} className="text-destructive focus:text-destructive focus:bg-destructive/10" disabled={isSubmitting}><Trash2 className="mr-2 h-4 w-4" /> Delete</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isFormOpen} onOpenChange={(open) => {if(!isSubmitting) setIsFormOpen(open)}}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingEvent ? 'Edit Event' : 'Create New Event'}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4 max-h-[70vh] overflow-y-auto pr-2">
            <div><Label htmlFor="name">Event Name</Label><Input id="name" name="name" value={formData.name || ''} onChange={handleInputChange} disabled={isSubmitting}/></div>
            <div><Label htmlFor="description">Description</Label><Textarea id="description" name="description" value={formData.description || ''} onChange={handleInputChange} disabled={isSubmitting}/></div>
            <div><Label htmlFor="date">Date</Label><Input id="date" name="date" type="date" value={formData.date || ''} onChange={handleInputChange} disabled={isSubmitting}/></div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label htmlFor="timeIn">Time In</Label><Input id="timeIn" name="timeIn" type="time" value={formData.timeIn || ''} onChange={handleInputChange} disabled={isSubmitting}/></div>
              <div><Label htmlFor="timeOut">Time Out</Label><Input id="timeOut" name="timeOut" type="time" value={formData.timeOut || ''} onChange={handleInputChange} disabled={isSubmitting}/></div>
            </div>
            <div><Label htmlFor="location">Location</Label><Input id="location" name="location" value={formData.location || ''} onChange={handleInputChange} disabled={isSubmitting}/></div>

            <div>
              <Label htmlFor="organizerType">Organizer Type</Label>
              <Select name="organizerType" value={formData.organizerType || 'ssg'} onValueChange={(value) => setFormData(prev => ({...prev, organizerType: value as Event['organizerType'], organizerId: value === 'ssg' ? 'ssg_main' : ''}))} disabled={isSubmitting}>
                <SelectTrigger> <SelectValue placeholder="Select Organizer Type"/> </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ssg">SSG</SelectItem>
                  <SelectItem value="club">Club</SelectItem>
                  <SelectItem value="department">Department</SelectItem>
                </SelectContent>
              </Select>
            </div>
             {formData.organizerType === 'club' && (
                 <div>
                     <Label htmlFor="organizerIdClub">Club</Label>
                     <Select name="organizerId" value={formData.organizerId || ""} onValueChange={(value) => setFormData(prev => ({...prev, organizerId: value}))} disabled={isSubmitting}>
                        <SelectTrigger><SelectValue placeholder="Select Club"/></SelectTrigger>
                        <SelectContent>
                            {allClubs.map(club => <SelectItem key={club.id} value={club.id}>{club.name}</SelectItem>)}
                        </SelectContent>
                     </Select>
                 </div>
             )}
             {formData.organizerType === 'department' && (
                 <div>
                     <Label htmlFor="organizerIdDept">Department</Label>
                     <Select name="organizerId" value={formData.organizerId || ""} onValueChange={(value) => setFormData(prev => ({...prev, organizerId: value}))} disabled={isSubmitting}>
                        <SelectTrigger><SelectValue placeholder="Select Department"/></SelectTrigger>
                        <SelectContent>
                            {allDepartments.map(dept => <SelectItem key={dept.id} value={dept.id}>{dept.name}</SelectItem>)}
                        </SelectContent>
                    </Select>
                 </div>
             )}

            <div>
                <Label>Assign OICs</Label>
                <Card className="mt-1 p-3 max-h-40 overflow-y-auto border">
                    <div className="space-y-2">
                    {availableOICs.length === 0 && <p className="text-sm text-muted-foreground">No OICs available.</p>}
                    {availableOICs.map(oic => (
                        <div key={oic.userID} className="flex items-center space-x-2">
                            <Checkbox
                                id={`oic-${oic.userID}`}
                                checked={formData.oicIds?.includes(oic.userID) || false}
                                onCheckedChange={() => handleOICChange(oic.userID)}
                                disabled={isSubmitting}
                            />
                            <Label htmlFor={`oic-${oic.userID}`} className="font-normal">{oic.fullName} ({oic.email})</Label>
                        </div>
                    ))}
                    </div>
                </Card>
            </div>

            <div><Label htmlFor="sanctions">Sanctions for Non-participation</Label><Textarea id="sanctions" name="sanctions" value={formData.sanctions || ''} onChange={handleInputChange} disabled={isSubmitting}/></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsFormOpen(false)} disabled={isSubmitting}>Cancel</Button>
            <Button onClick={handleSubmit} className="bg-primary hover:bg-primary/90" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editingEvent ? 'Save Changes' : 'Create Event'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
