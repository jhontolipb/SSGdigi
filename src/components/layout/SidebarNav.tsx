
"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Users, Building, Shield, CalendarDays, ClipboardCheck, ListChecks, MessageSquare, Award, CreditCard, QrCode, ScanLine, UserCog, Bell, LogOut, FileText, Bot } from 'lucide-react';
import { SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarGroup, SidebarGroupLabel, SidebarMenuSub, SidebarMenuSubItem, SidebarMenuSubButton } from '@/components/ui/sidebar';
import type { UserRole } from '@/types/user';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';

interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
  children?: NavItem[];
}

const navLinks: Record<UserRole, NavItem[]> = {
  ssg_admin: [
    { href: '/ssg/dashboard', label: 'Dashboard', icon: Home },
    { href: '/ssg/users', label: 'User Management', icon: Users },
    { href: '/ssg/departments', label: 'Departments', icon: Building },
    { href: '/ssg/clubs', label: 'Clubs', icon: Shield },
    { href: '/ssg/events', label: 'Events', icon: CalendarDays },
    { href: '/ssg/attendance', label: 'Attendance', icon: ClipboardCheck },
    { href: '/ssg/clearance', label: 'Clearance Requests', icon: ListChecks },
    { href: '/ssg/points', label: 'Student Points', icon: Award },
    { href: '/ssg/compose-notification', label: 'AI Compose', icon: Bot },
    { href: '/messages', label: 'Messages', icon: MessageSquare },
  ],
  club_admin: [
    { href: '/club-admin/dashboard', label: 'Dashboard', icon: Home },
    { href: '/club-admin/members', label: 'Members', icon: Users },
    { href: '/club-admin/oic', label: 'OIC Management', icon: UserCog },
    { href: '/club-admin/events', label: 'Events', icon: CalendarDays },
    { href: '/club-admin/attendance', label: 'Attendance', icon: ClipboardCheck },
    { href: '/club-admin/clearance', label: 'Clearance Requests', icon: ListChecks },
    { href: '/club-admin/compose-notification', label: 'AI Compose', icon: Bot },
    { href: '/messages', label: 'Messages', icon: MessageSquare },
  ],
  department_admin: [
    { href: '/department-admin/dashboard', label: 'Dashboard', icon: Home },
    { href: '/department-admin/students', label: 'Students', icon: Users },
    { href: '/department-admin/oic', label: 'OIC Management', icon: UserCog },
    { href: '/department-admin/events', label: 'Events', icon: CalendarDays },
    { href: '/department-admin/attendance', label: 'Attendance', icon: ClipboardCheck },
    { href: '/department-admin/clearance', label: 'Clearance Requests', icon: ListChecks },
    { href: '/department-admin/compose-notification', label: 'AI Compose', icon: Bot },
    { href: '/messages', label: 'Messages', icon: MessageSquare },
  ],
  oic: [
    { href: '/oic/events', label: 'Assigned Events', icon: CalendarDays },
    { href: '/oic/scan', label: 'QR Scanner', icon: ScanLine },
  ],
  student: [
    { href: '/student/dashboard', label: 'Dashboard', icon: Home },
    { href: '/student/qr-code', label: 'My QR Code', icon: QrCode },
    { href: '/student/events', label: 'Events', icon: CalendarDays },
    { href: '/student/clearance', label: 'Clearance', icon: FileText },
    { href: '/student/points', label: 'My Points', icon: Award },
    { href: '/messages', label: 'Messages', icon: MessageSquare },
    { href: '/notifications', label: 'Notifications', icon: Bell },
  ],
};

const commonBottomLinks = [
    // { href: '/profile', label: 'Profile', icon: UserCircle }, // Or use User avatar in header
];


export function SidebarNav({ role }: { role: UserRole }) {
  const pathname = usePathname();
  const { logout } = useAuth();
  const links = navLinks[role] || [];

  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  const renderNavItem = (item: NavItem) => (
    <SidebarMenuItem key={item.href}>
      <Link href={item.href} passHref legacyBehavior>
        <SidebarMenuButton 
          isActive={isActive(item.href)} 
          className={cn(isActive(item.href) ? 'bg-sidebar-accent text-sidebar-accent-foreground' : 'hover:bg-sidebar-accent hover:text-sidebar-accent-foreground')}
          tooltip={item.label}
        >
          <item.icon className="h-5 w-5" />
          <span>{item.label}</span>
        </SidebarMenuButton>
      </Link>
      {item.children && isActive(item.href) && ( // Or always render sub-menu and control open state
        <SidebarMenuSub>
          {item.children.map(subItem => (
            <SidebarMenuSubItem key={subItem.href}>
               <Link href={subItem.href} passHref legacyBehavior>
                <SidebarMenuSubButton isActive={isActive(subItem.href)}>
                  <subItem.icon className="h-4 w-4" />
                  <span>{subItem.label}</span>
                </SidebarMenuSubButton>
              </Link>
            </SidebarMenuSubItem>
          ))}
        </SidebarMenuSub>
      )}
    </SidebarMenuItem>
  );

  return (
    <SidebarMenu>
      <SidebarGroup>
        <SidebarGroupLabel>Menu</SidebarGroupLabel>
          {links.map(renderNavItem)}
      </SidebarGroup>
      
      <div className="mt-auto"> {/* Pushes logout to bottom */}
        <SidebarGroup>
          {commonBottomLinks.map(renderNavItem)}
          <SidebarMenuItem>
            <SidebarMenuButton onClick={logout} className="hover:bg-sidebar-accent hover:text-sidebar-accent-foreground" tooltip="Logout">
              <LogOut className="h-5 w-5" />
              <span>Logout</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarGroup>
      </div>
    </SidebarMenu>
  );
}
