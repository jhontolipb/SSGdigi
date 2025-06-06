
// TODO: Implement Club Admin OIC Management page
// CRUD users with the oic role specifically for their club.
// Assign OICs to club events.
"use client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { UserCog } from "lucide-react";

export default function ClubOICManagementPage() {
  return (
    <div className="space-y-6">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl font-headline flex items-center gap-2">
            <UserCog className="text-primary h-7 w-7" /> Officer-in-Charge (OIC) Management (Club)
          </CardTitle>
          <CardDescription>Manage OICs for your club's events.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">This page will enable Club Admins to create, read, update, and delete OIC users specifically for their club and assign them to club events. Functionality to be implemented.</p>
          <div className="mt-6 p-8 border-2 border-dashed border-border rounded-lg text-center">
            <p className="text-lg font-medium text-muted-foreground">OIC CRUD & Assignment Tools Coming Soon</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

