
// TODO: Implement Department Admin OIC Management page
// CRUD users with the oic role specifically for their department.
// Assign OICs to departmental events.
"use client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { UserCog } from "lucide-react";

export default function DepartmentOICManagementPage() {
  return (
    <div className="space-y-6">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl font-headline flex items-center gap-2">
            <UserCog className="text-primary h-7 w-7" /> Officer-in-Charge (OIC) Management (Department)
          </CardTitle>
          <CardDescription>Manage OICs for your department's events.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Department Admins will use this page to manage OIC users for their department and assign them to events.</p>
          <div className="mt-6 p-8 border-2 border-dashed border-border rounded-lg text-center">
            <p className="text-lg font-medium text-muted-foreground">No OICs found for your department.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
