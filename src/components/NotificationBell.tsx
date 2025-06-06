
"use client";

import Link from 'next/link';
import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { useState, useEffect } from 'react';

interface NotificationItem {
 id: string;
 text: string;
 read: boolean;
 time: string;
}

const initialNotifications: NotificationItem[] = [];

export function NotificationBell() {
  const [notifications, setNotifications] = useState(initialNotifications);
  const [unreadCount, setUnreadCount] = useState(0);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // In a real app, fetch notifications
    setNotifications(initialNotifications);
  }, []);

  useEffect(() => {
    setUnreadCount(notifications.filter(n => !n.read).length);
  }, [notifications]);

  if (!mounted) {
    return (
      <Button variant="ghost" size="icon" className="relative rounded-full">
        <Bell className="h-5 w-5" />
      </Button>
    );
  }

  const markAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative rounded-full">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge variant="destructive" className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs">
              {unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel>Notifications</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {notifications.length === 0 ? (
          <DropdownMenuItem disabled>No new notifications</DropdownMenuItem>
        ) : (
          notifications.slice(0, 5).map(notification => (
            <DropdownMenuItem key={notification.id} onClick={() => markAsRead(notification.id)} className={`flex flex-col items-start ${!notification.read ? 'font-semibold' : ''}`}>
              <p className="text-sm truncate w-full">{notification.text}</p>
              <p className="text-xs text-muted-foreground">{notification.time}</p>
            </DropdownMenuItem>
          ))
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/notifications" className="w-full text-center text-primary hover:underline">
            View all notifications
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
