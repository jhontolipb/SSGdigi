
// TODO: Implement Club Admin Event Management page
// Create and manage events specific to their assigned club.
// Define sanctions for non-participation in club events.
"use client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { CalendarDays } from "lucide-react";

export default function ClubEventsPage() {
  return (
    <div className="space-y-6">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl font-headline flex items-center gap-2">
            <CalendarDays className="text-primary h-7 w-7" /> Club Event Management
          </CardTitle>
          <CardDescription>Create and manage events for your club.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Club Admins will use this page to create and manage events specific to their club, including defining sanctions for non-participation. Functionality to be implemented.</p>
          <div className="mt-6 p-8 border-2 border-dashed border-border rounded-lg text-center">
            <p className="text-lg font-medium text-muted-foreground">Club Event Creation & Management Tools Coming Soon</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

