
"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, CheckCircle, XCircle, Clock, Download, PlusCircle, AlertTriangle, Loader2, Info } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { useAuth } from '@/contexts/AuthContext';
import type { ClearanceRequest, ApprovalStatus } from '@/types/user';

export default function StudentClearancePage() {
  const { user, studentClearanceRequest, initiateClearanceRequest, fetchStudentClearanceRequest, loading: authLoading } = useAuth();
  const [isInitiating, setIsInitiating] = useState(false);

  useEffect(() => {
    if (user && user.role === 'student' && !studentClearanceRequest && !authLoading) {
      // Fetch once on mount if no request loaded and not already loading user data
      fetchStudentClearanceRequest(user.userID);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, authLoading]); // studentClearanceRequest removed to avoid loop if fetch sets it to null

  const handleInitiate = async () => {
    setIsInitiating(true);
    await initiateClearanceRequest();
    setIsInitiating(false);
  };
  
  const getStatusIconAndColor = (status: ApprovalStatus) => {
    switch(status) {
      case 'approved': return { icon: <CheckCircle className="h-5 w-5 text-green-500" />, color: "text-green-600" };
      case 'rejected': return { icon: <XCircle className="h-5 w-5 text-red-500" />, color: "text-red-600" };
      case 'pending': return { icon: <Clock className="h-5 w-5 text-yellow-500 animate-pulse" />, color: "text-yellow-600" };
      case 'not_applicable': return { icon: <Info className="h-5 w-5 text-gray-400" />, color: "text-gray-500" };
      default: return { icon: <Clock className="h-5 w-5 text-gray-400" />, color: "text-gray-500" }; 
    }
  };
  
  const calculateProgress = () => {
    if (!studentClearanceRequest) return 0;
    let completedSteps = 0;
    let totalApplicableSteps = 0; 

    if (studentClearanceRequest.clubApprovalStatus !== 'not_applicable') totalApplicableSteps++;
    if (studentClearanceRequest.departmentApprovalStatus !== 'not_applicable') totalApplicableSteps++; // Dept should always be applicable for student
    if (studentClearanceRequest.ssgStatus !== 'not_applicable') totalApplicableSteps++; // SSG should always be applicable

    if (studentClearanceRequest.clubApprovalStatus === 'approved') completedSteps++;
    if (studentClearanceRequest.departmentApprovalStatus === 'approved') completedSteps++;
    if (studentClearanceRequest.ssgStatus === 'approved') completedSteps++;
    
    if (totalApplicableSteps === 0) return 100; // If all are N/A, consider it complete
    return (completedSteps / totalApplicableSteps) * 100;
  };

  const getOverallStatusBadgeVariant = (status: ClearanceRequest['overallStatus']) => {
    switch(status) {
        case 'Approved': return 'default'; // Will use green-500 if customized, or ShadCN primary
        case 'Rejected': return 'destructive';
        case 'Action Required': return 'destructive';
        case 'Pending': return 'secondary'; // Yellowish in ShadCN default
        default: return 'outline';
    }
  }


  if (authLoading && !studentClearanceRequest) {
    return <div className="flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /> <span className="ml-2">Loading clearance status...</span></div>;
  }

  return (
    <div className="space-y-6">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl font-headline flex items-center gap-2">
            <FileText className="text-primary h-7 w-7" /> My Digital Clearance
          </CardTitle>
          <CardDescription>Request and track your clearance status. Data is from Firestore.</CardDescription>
        </CardHeader>
        <CardContent>
          {!studentClearanceRequest || studentClearanceRequest.overallStatus === 'Not Requested' ? (
            <div className="text-center py-10">
              <p className="text-muted-foreground mb-4">You have not initiated a clearance request yet, or your previous one was rejected and needs re-initiation.</p>
              <Button onClick={handleInitiate} disabled={isInitiating || authLoading} className="bg-primary hover:bg-primary/90">
                {isInitiating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <PlusCircle className="mr-2 h-4 w-4" />}
                Initiate Clearance Request
              </Button>
            </div>
          ) : (
            <div className="space-y-6">
              {studentClearanceRequest.overallStatus === 'Rejected' && studentClearanceRequest.ssgApprovalNotes && (
                <div className="p-4 border-l-4 border-red-500 bg-red-50 rounded-md">
                    <div className="flex">
                        <div className="flex-shrink-0">
                            <AlertTriangle className="h-5 w-5 text-red-400" aria-hidden="true" />
                        </div>
                        <div className="ml-3">
                            <h3 className="text-sm font-medium text-red-700">Clearance Rejected</h3>
                            <div className="mt-2 text-sm text-red-600">
                                <p>Reason: {studentClearanceRequest.ssgApprovalNotes || studentClearanceRequest.departmentApprovalNotes || studentClearanceRequest.clubApprovalNotes || "No specific reason provided."}</p>
                            </div>
                        </div>
                    </div>
                     <Button onClick={handleInitiate} disabled={isInitiating || authLoading} className="mt-4">
                        {isInitiating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <PlusCircle className="mr-2 h-4 w-4" />}
                        Re-initiate Clearance Request
                    </Button>
                </div>
              )}

              <div>
                <Label className="text-sm font-medium">Overall Progress (Request ID: {studentClearanceRequest.id})</Label>
                <Progress value={calculateProgress()} className="w-full mt-1 h-3" />
                <p className="text-sm text-muted-foreground mt-1 text-right">{calculateProgress().toFixed(0)}% Complete</p>
              </div>

              <div className="space-y-4 pt-4 border-t">
                <h3 className="text-lg font-semibold">Approval Stages:</h3>
                
                <div className={`flex items-center justify-between p-3 border rounded-md bg-card ${studentClearanceRequest.clubApprovalStatus === 'not_applicable' ? 'opacity-60' : ''}`}>
                  <div>
                      <p className="font-medium">Club Clearance ({studentClearanceRequest.studentClubName || 'N/A'})</p>
                      <p className={`text-sm capitalize ${getStatusIconAndColor(studentClearanceRequest.clubApprovalStatus).color}`}>{studentClearanceRequest.clubApprovalStatus.replace('_', ' ')}</p>
                      {studentClearanceRequest.clubApprovalNotes && <p className="text-xs text-muted-foreground mt-1">Notes: {studentClearanceRequest.clubApprovalNotes}</p>}
                  </div>
                  {getStatusIconAndColor(studentClearanceRequest.clubApprovalStatus).icon}
                </div>

                <div className="flex items-center justify-between p-3 border rounded-md bg-card">
                  <div>
                    <p className="font-medium">Department Clearance ({studentClearanceRequest.studentDepartmentName})</p>
                    <p className={`text-sm capitalize ${getStatusIconAndColor(studentClearanceRequest.departmentApprovalStatus).color}`}>{studentClearanceRequest.departmentApprovalStatus}</p>
                     {studentClearanceRequest.departmentApprovalNotes && <p className="text-xs text-muted-foreground mt-1">Notes: {studentClearanceRequest.departmentApprovalNotes}</p>}
                  </div>
                  {getStatusIconAndColor(studentClearanceRequest.departmentApprovalStatus).icon}
                </div>
                <div className="flex items-center justify-between p-3 border rounded-md bg-card">
                  <div>
                    <p className="font-medium">SSG Final Approval</p>
                    <p className={`text-sm capitalize ${getStatusIconAndColor(studentClearanceRequest.ssgStatus).color}`}>{studentClearanceRequest.ssgStatus}</p>
                    {studentClearanceRequest.ssgApprovalNotes && <p className="text-xs text-muted-foreground mt-1">Notes: {studentClearanceRequest.ssgApprovalNotes}</p>}
                  </div>
                  {getStatusIconAndColor(studentClearanceRequest.ssgStatus).icon}
                </div>
              </div>

              {studentClearanceRequest.overallStatus === 'Approved' && studentClearanceRequest.unifiedClearanceID ? (
                <div className="mt-6 text-center p-6 bg-green-50 border-2 border-dashed border-green-500 rounded-lg">
                  <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-3" />
                  <h3 className="text-xl font-semibold text-green-700">Clearance Approved!</h3>
                  <p className="text-muted-foreground mt-1">Unified Clearance ID: <strong>{studentClearanceRequest.unifiedClearanceID}</strong></p>
                  <Button className="mt-4 bg-primary hover:bg-primary/90" onClick={() => alert(`Downloading PDF for ${studentClearanceRequest.unifiedClearanceID}`)} disabled>
                    <Download className="mr-2 h-4 w-4" /> Download Unified Clearance (Not Impl.)
                  </Button>
                </div>
              ) : (
                 <div className="text-center text-muted-foreground mt-6">
                    <span>Overall Status: </span><Badge variant={getOverallStatusBadgeVariant(studentClearanceRequest.overallStatus)} className={`text-sm ${studentClearanceRequest.overallStatus === 'Approved' ? 'bg-green-500 hover:bg-green-600' : ''}`}>{studentClearanceRequest.overallStatus}</Badge>
                 </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

