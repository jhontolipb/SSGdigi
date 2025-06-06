
"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { BellRing, Check } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

const initialNotificationsData: NotificationItem[] = [];

interface NotificationItem {
  id: string;
  text: string;
  read: boolean;
  time: string;
  type: 'attendance' | 'message' | 'clearance' | 'event' | 'general';
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<NotificationItem[]>(initialNotificationsData);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setNotifications(initialNotificationsData);
    setMounted(true);
  }, []);

  const markAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  if (!mounted) {
    return <div className="p-6">Loading notifications...</div>;
  }

  return (
    <div className="container mx-auto py-8">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl font-headline flex items-center gap-2">
            <BellRing className="text-primary h-7 w-7" />
            All Notifications
          </CardTitle>
          <CardDescription>Stay updated with the latest alerts and information.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex justify-end mb-4">
            <Button onClick={markAllAsRead} variant="outline" size="sm" disabled={notifications.every(n => n.read) || notifications.length === 0}>
              <Check className="mr-2 h-4 w-4" /> Mark all as read
            </Button>
          </div>
          {notifications.length === 0 ? (
            <p className="text-center text-muted-foreground py-10">No notifications yet.</p>
          ) : (
            <ScrollArea className="h-[calc(100vh-20rem)] pr-4"> {/* Adjust height as needed */}
              <ul className="space-y-3">
                {notifications.map(notification => (
                  <li 
                    key={notification.id} 
                    className={`p-4 rounded-lg border flex justify-between items-start transition-colors duration-300
                                ${notification.read ? 'bg-card' : 'bg-accent/10 border-accent shadow-sm'}`}
                  >
                    <div>
                      <p className={`text-sm ${!notification.read ? 'font-semibold' : ''}`}>{notification.text}</p>
                      <p className="text-xs text-muted-foreground mt-1">{notification.time} - Type: {notification.type}</p>
                    </div>
                    {!notification.read && (
                      <Button variant="ghost" size="sm" onClick={() => markAsRead(notification.id)} className="text-primary hover:text-primary/80">
                        Mark as read
                      </Button>
                    )}
                  </li>
                ))}
              </ul>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

