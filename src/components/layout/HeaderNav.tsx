
"use client";

import Link from 'next/link';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { LogOut, UserCircle, Settings, LayoutDashboard, SidebarOpen } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { NotificationBell } from '@/components/NotificationBell';
import { useSidebar } from '@/components/ui/sidebar'; 

export function HeaderNav() {
  const { user, logout } = useAuth();
  const { toggleSidebar, isMobile } = useSidebar(); 

  const getInitials = (name: string = "") => {
    const names = name.split(' ');
    if (names.length === 0 || names[0] === "") return "?";
    let initials = names[0].substring(0, 1).toUpperCase();
    if (names.length > 1) {
      initials += names[names.length - 1].substring(0, 1).toUpperCase();
    }
    return initials;
  };

  const getDashboardLink = () => {
    if (!user) return "/login";
    switch (user.role) {
      case 'ssg_admin': return '/ssg/dashboard';
      case 'club_admin': return '/club-admin/dashboard';
      case 'department_admin': return '/department-admin/dashboard';
      case 'oic': return '/oic/events';
      case 'student': return '/student/dashboard';
      default: return '/';
    }
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background/80 backdrop-blur-sm px-4 md:px-6">
       {isMobile && (
        <Button variant="ghost" size="icon" onClick={toggleSidebar} className="md:hidden">
          <SidebarOpen className="h-6 w-6" />
          <span className="sr-only">Toggle sidebar</span>
        </Button>
      )}
      <div className="flex-1">
        {/* Can add breadcrumbs or page title here */}
      </div>
      <div className="flex items-center gap-4">
        <NotificationBell />
        {user && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={`https://placehold.co/100x100.png?text=${getInitials(user.fullName)}`} alt={user.fullName} data-ai-hint="user avatar" />
                  <AvatarFallback>{getInitials(user.fullName)}</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">{user.fullName}</p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {user.email}
                  </p>
                  <p className="text-xs leading-none text-muted-foreground capitalize">
                    Role: {user.role.replace('_', ' ')}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href={getDashboardLink()}>
                  <LayoutDashboard className="mr-2 h-4 w-4" />
                  <span>Dashboard</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/profile"> 
                  <UserCircle className="mr-2 h-4 w-4" />
                  <span>Profile</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/settings">
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Settings</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={logout}>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Logout</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </header>
  );
}
