
"use client";

import React from 'react';
import { SidebarProvider, Sidebar, SidebarHeader, SidebarContent, SidebarFooter, SidebarTrigger } from '@/components/ui/sidebar';
import { SidebarNav } from '@/components/layout/SidebarNav';
import { HeaderNav } from '@/components/layout/HeaderNav';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

export function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    // This should ideally be handled by AuthProvider redirect, but as a fallback:
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p>Redirecting to login...</p>
      </div>
    );
  }
  
  // Use a default open state for the sidebar based on localStorage or a default
  // The 'open' prop on SidebarProvider can be used to control it externally if needed.
  const initialSidebarOpen = typeof window !== 'undefined' ? localStorage.getItem('sidebar_state') === 'true' : true;


  return (
    <SidebarProvider defaultOpen={initialSidebarOpen} onOpenChange={(isOpen) => {
      if (typeof window !== 'undefined') {
        localStorage.setItem('sidebar_state', isOpen.toString());
      }
    }}>
      <Sidebar variant="sidebar" collapsible="icon" side="left">
        <SidebarHeader className="p-4 items-center justify-center">
          <Link href="/" className="flex items-center gap-2">
            {/* Placeholder logo */}
            <Image src="https://placehold.co/40x40.png/3F51B5/FFFFFF?text=CC" alt="CampusConnect Logo" width={40} height={40} data-ai-hint="logo campus" className="rounded-md" />
            <h1 className="text-xl font-headline font-semibold text-sidebar-foreground group-data-[collapsible=icon]:hidden">CampusConnect</h1>
          </Link>
        </SidebarHeader>
        <SidebarContent className="flex-1 overflow-y-auto">
          <SidebarNav role={user.role} />
        </SidebarContent>
        <SidebarFooter className="p-2">
          {/* Footer content if any */}
        </SidebarFooter>
      </Sidebar>
      <div className="flex flex-1 flex-col">
        <HeaderNav />
        <main className="flex-1 overflow-y-auto bg-background p-4 md:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </SidebarProvider>
  );
}
