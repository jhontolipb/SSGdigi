
"use client";

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CalendarDays, PlusCircle, Edit, Trash2, MoreHorizontal, UserCheck, Search } from "lucide-react";
import { useAuth } from '@/contexts/AuthContext';
import type { Event, UserProfile } from '@/types/user';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';

// Mock OICs - in a real app, these would be managed OICs for the club
const mockClubOICs: UserProfile[] = [
    { userID: 'oic001', fullName: 'Edward Scissorhands (OIC)', role: 'oic', departmentID: 'dept_bs_it' },
    { userID: 'oic003', fullName: 'Gregory House (OIC)', role: 'oic', assignedClubId: 'club_robotics' }, // This OIC is specific to robotics club
];

export default function ClubEventsPage() {
  const { user, allUsers } = useAuth(); // Assuming allUsers has OICs
  const { toast } = useToast();
  const clubAdminClubId = user?.clubID;

  const [clubEvents, setClubEvents] = useState<Event[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [formData, setFormData] = useState<Partial<Event>>({
    name: '', description: '', date: '', timeIn: '', timeOut: '', location: '', oicIds: [], sanctions: ''
  });

  // Filter OICs available for this club (either OICs directly assigned to the club or general OICs)
  const availableOICs = allUsers.filter(u => u.role === 'oic' && (u.assignedClubId === clubAdminClubId || !u.assignedClubId));


  // Simulate fetching/filtering events for this club
  useEffect(() => {
    if (clubAdminClubId) {
      // In a real app, fetch events where organizerType is 'club' and organizerId is clubAdminClubId
      // For now, we'll use a local state that's "scoped" to this club admin
      const initialEvents: Event[] = [ // Placeholder, real app would persist these
         { id: `evt_club_${clubAdminClubId}_1`, name: 'Club Meeting', description: 'Monthly general meeting', date: '2024-10-01', timeIn: '17:00', timeOut: '18:00', location: 'Club Room A', organizerType: 'club', organizerId: clubAdminClubId!, oicIds: [], sanctions: 'Attendance mandatory' },
         { id: `evt_club_${clubAdminClubId}_2`, name: 'Club Workshop', description: 'Hands-on session', date: '2024-10-15', timeIn: '14:00', timeOut: '16:00', location: 'Lab 1', organizerType: 'club', organizerId: clubAdminClubId!, oicIds: ['oic003'], sanctions: 'Bring own materials' },
      ];
      setClubEvents(initialEvents.filter(e => e.organizerId === clubAdminClubId));
    }
  }, [clubAdminClubId]);


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
    setFormData({ ...event });
    setIsFormOpen(true);
  };

  const handleDelete = (eventId: string) => {
    if (window.confirm("Are you sure you want to delete this event?")) {
      setClubEvents(prev => prev.filter(e => e.id !== eventId));
      toast({ title: "Success", description: "Event deleted." });
    }
  };

  const handleSubmit = () => {
    if (!formData.name || !formData.date || !formData.timeIn || !formData.timeOut) {
        toast({ title: "Error", description: "Name, date, and times are required.", variant: "destructive"});
        return;
    }
    if (editingEvent) {
      setClubEvents(prev => prev.map(e => e.id === editingEvent.id ? { ...e, ...formData, organizerType: 'club', organizerId: clubAdminClubId! } as Event : e));
      toast({ title: "Success", description: "Event updated successfully." });
    } else {
      const newEvent: Event = {
        id: `event_club_${clubAdminClubId}_${Date.now()}`,
        ...formData,
        organizerType: 'club',
        organizerId: clubAdminClubId!,
      } as Event;
      setClubEvents(prev => [...prev, newEvent]);
      toast({ title: "Success", description: "Event created successfully." });
    }
    setIsFormOpen(false);
  };
  
  const filteredClubEvents = clubEvents.filter(event =>
    event.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    event.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!clubAdminClubId) {
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
              <CardDescription>Create and manage events for your club.</CardDescription>
            </div>
            <Button onClick={handleCreateNew} className="bg-primary hover:bg-primary/90">
              <PlusCircle className="mr-2 h-5 w-5" /> Create New Event
            </Button>
          </div>
        </CardHeader>
        <CardContent>
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
                        <DropdownMenuTrigger asChild><Button variant="ghost" className="h-8 w-8 p-0"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEdit(event)}><Edit className="mr-2 h-4 w-4" /> Edit</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDelete(event.id)} className="text-destructive focus:text-destructive focus:bg-destructive/10"><Trash2 className="mr-2 h-4 w-4" /> Delete</DropdownMenuItem>
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
        </CardContent>
      </Card>

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingEvent ? 'Edit Club Event' : 'Create New Club Event'}</DialogTitle>
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
                            />
                            <Label htmlFor={`oic-${oic.userID}`} className="font-normal">{oic.fullName}</Label>
                        </div>
                    )) : <p className="text-sm text-muted-foreground">No OICs available for assignment.</p>}
                    </div>
                </Card>
            </div>

            <div><Label htmlFor="sanctions">Sanctions for Non-participation (Optional)</Label><Textarea id="sanctions" name="sanctions" value={formData.sanctions || ''} onChange={handleInputChange} /></div>
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
