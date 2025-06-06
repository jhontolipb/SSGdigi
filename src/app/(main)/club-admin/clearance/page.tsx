
// TODO: Implement Club Admin Clearance Approval page
// View clearance_requests from their club members.
// Approve/Reject the clubApprovalStatus part of the clearance.
"use client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ListChecks } from "lucide-react";

export default function ClubClearancePage() {
  return (
    <div className="space-y-6">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl font-headline flex items-center gap-2">
            <ListChecks className="text-primary h-7 w-7" /> Club Clearance Approval
          </CardTitle>
          <CardDescription>Manage clearance requests for your club members.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Club Admins will use this page to view clearance requests from their club members and approve or reject the club-specific part of the clearance.</p>
          <div className="mt-6 p-8 border-2 border-dashed border-border rounded-lg text-center">
            <p className="text-lg font-medium text-muted-foreground">No clearance requests found for your club members.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
