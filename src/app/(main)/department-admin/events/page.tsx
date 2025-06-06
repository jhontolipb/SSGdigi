
// TODO: Implement Department Admin Event Management page
// Create and manage events specific to their assigned department.
"use client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { CalendarDays } from "lucide-react";

export default function DepartmentEventsPage() {
  return (
    <div className="space-y-6">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl font-headline flex items-center gap-2">
            <CalendarDays className="text-primary h-7 w-7" /> Department Event Management
          </CardTitle>
          <CardDescription>Create and manage events for your department.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">This page will allow Department Admins to create and manage events specific to their department.</p>
          <div className="mt-6 p-8 border-2 border-dashed border-border rounded-lg text-center">
            <p className="text-lg font-medium text-muted-foreground">No events found for your department.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
