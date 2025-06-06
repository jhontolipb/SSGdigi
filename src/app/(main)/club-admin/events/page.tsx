
"use client";

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { CalendarDays, PlusCircle, Edit, Trash2, MoreHorizontal, Search, Loader2 } from "lucide-react";
import { useAuth } from '@/contexts/AuthContext';
import type { Event, UserProfile } from '@/types/user';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

export default function ClubEventsPage() {
  const { user, allUsers, allEvents, addEventToFirestore, updateEventInFirestore, deleteEventFromFirestore, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const clubAdminClubId = user?.clubID;

  const [clubEvents, setClubEvents] = useState<Event[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState<Partial<Omit<Event, 'id'>>>({
    name: '', description: '', date: '', timeIn: '', timeOut: '', location: '', oicIds: [], sanctions: ''
  });

  const availableOICs = allUsers.filter(u => u.role === 'oic' && (u.assignedClubId === clubAdminClubId || !u.assignedClubId));

  useEffect(() => {
    if (clubAdminClubId) {
      setClubEvents(allEvents.filter(e => e.organizerType === 'club' && e.organizerId === clubAdminClubId));
    }
  }, [allEvents, clubAdminClubId]);


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
    setFormData({ name: '', description: '', date: '', timeIn: '', timeOut: '', location: '', oicIds: [], sanctions: '' });
    setIsFormOpen(true);
  };

  const handleEdit = (event: Event) => {
    setEditingEvent(event);
    const {id, ...eventData} = event;
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
    if (!formData.name || !formData.date || !formData.timeIn || !formData.timeOut || !clubAdminClubId) {
        toast({ title: "Error", description: "Name, date, and times are required.", variant: "destructive"});
        return;
    }
    setIsSubmitting(true);
    const eventPayload: Omit<Event, 'id'> = {
      name: formData.name!,
      description: formData.description || '',
      date: formData.date!,
      timeIn: formData.timeIn!,
      timeOut: formData.timeOut!,
      location: formData.location || '',
      organizerType: 'club',
      organizerId: clubAdminClubId,
      oicIds: formData.oicIds || [],
      sanctions: formData.sanctions || '',
    };

    if (editingEvent) {
      await updateEventInFirestore(editingEvent.id, eventPayload);
    } else {
      await addEventToFirestore(eventPayload);
    }
    setIsSubmitting(false);
    setIsFormOpen(false);
  };

  const filteredClubEvents = clubEvents.filter(event =>
    event.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (event.description && event.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (!clubAdminClubId && !authLoading) {
    return <Card><CardHeader><CardTitle>Error</CardTitle></CardHeader><CardContent><p>Not authorized or club not found.</p></CardContent></Card>;
  }

  return (
    <div className="space-y-6">
      <Card className="shadow-lg">
        <CardHeader>
           <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div>
              <CardTitle className="text-2xl font-headline flex items-center gap-2">
                <CalendarDays className="text-primary h-7 w-7" /> Club Event Management
              </CardTitle>
              <CardDescription>Create and manage events for your club (Data from Firestore).</CardDescription>
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
              <p className="ml-2">Loading club events...</p>
            </div>
          )}
          {!authLoading && (
            <>
              <div className="flex items-center gap-2 mb-4">
                <Search className="h-5 w-5 text-muted-foreground" />
                <Input
                  placeholder="Search events by name or description..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="max-w-sm"
                />
              </div>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Event Name</TableHead>
                      <TableHead>Date & Time</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>OICs</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredClubEvents.length > 0 ? filteredClubEvents.map((event) => (
                      <TableRow key={event.id}>
                        <TableCell className="font-medium">{event.name}</TableCell>
                        <TableCell>{event.date} ({event.timeIn} - {event.timeOut})</TableCell>
                        <TableCell>{event.location || 'N/A'}</TableCell>
                        <TableCell>{event.oicIds.map(id => availableOICs.find(oic=>oic.userID === id)?.fullName?.split(' ')[0] || id).join(', ') || 'None'}</TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild><Button variant="ghost" className="h-8 w-8 p-0" disabled={isSubmitting}><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleEdit(event)} disabled={isSubmitting}><Edit className="mr-2 h-4 w-4" /> Edit</DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleDelete(event.id)} disabled={isSubmitting} className="text-destructive focus:text-destructive focus:bg-destructive/10"><Trash2 className="mr-2 h-4 w-4" /> Delete</DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    )) : (
                       <TableRow>
                        <TableCell colSpan={5} className="text-center text-muted-foreground h-24">
                          No events found for this club{searchTerm ? ' matching your search' : ''}.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Dialog open={isFormOpen} onOpenChange={(open) => {if(!isSubmitting) setIsFormOpen(open)}}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingEvent ? 'Edit Club Event' : 'Create New Club Event'}</DialogTitle>
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
                <Label>Assign OICs (Club Specific)</Label>
                <Card className="mt-1 p-3 max-h-40 overflow-y-auto border">
                    <div className="space-y-2">
                    {availableOICs.length > 0 ? availableOICs.map(oic => (
                        <div key={oic.userID} className="flex items-center space-x-2">
                            <Checkbox
                                id={`oic-${oic.userID}`}
                                checked={formData.oicIds?.includes(oic.userID) || false}
                                onCheckedChange={() => handleOICChange(oic.userID)}
                                disabled={isSubmitting}
                            />
                            <Label htmlFor={`oic-${oic.userID}`} className="font-normal">{oic.fullName}</Label>
                        </div>
                    )) : <p className="text-sm text-muted-foreground">No OICs available for assignment.</p>}
                    </div>
                </Card>
            </div>

            <div><Label htmlFor="sanctions">Sanctions for Non-participation (Optional)</Label><Textarea id="sanctions" name="sanctions" value={formData.sanctions || ''} onChange={handleInputChange} disabled={isSubmitting}/></div>
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
