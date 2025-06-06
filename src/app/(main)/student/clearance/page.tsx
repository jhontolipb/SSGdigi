
"use client";

import { useState, useEffect } from 'react'; // Added useEffect
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, CheckCircle, XCircle, Clock, Download, PlusCircle, AlertTriangle } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label"; // Keep Label import
import { useAuth } from '@/contexts/AuthContext'; // For student data

type ApprovalStageStatus = 'pending' | 'approved' | 'rejected' | 'not_started';

interface ClearanceStatus {
  club: { name: string, status: ApprovalStageStatus };
  department: { name: string, status: ApprovalStageStatus };
  ssg: { status: ApprovalStageStatus };
  overallStatus: 'Pending' | 'Approved' | 'Rejected' | 'Action Required' | 'Not Requested';
  unifiedClearanceID?: string;
  sanctionsFlagged?: boolean;
  sanctionDetails?: string;
}

const initialClearanceStatus: ClearanceStatus | null = null;

export default function StudentClearancePage() {
  const { user, allClubs, allDepartments } = useAuth();
  const [clearanceStatus, setClearanceStatus] = useState<ClearanceStatus | null>(initialClearanceStatus);
  const [isLoading, setIsLoading] = useState(false);

  // Simulate fetching clearance status or setting initial state
  useEffect(() => {
    if (user && user.role === 'student') {
      // In a real app, fetch this from a backend based on user.userID
      // For now, we'll set a default "Not Requested" state or a mock initiated one.
      // Let's assume it starts as null (not requested).
      setClearanceStatus(null); 
    }
  }, [user]);

  const handleInitiateClearance = () => {
    if (!user || user.role !== 'student') return;
    setIsLoading(true);
    
    setTimeout(() => {
      const studentClub = allClubs.find(club => club.id === user.clubID);
      const studentDepartment = allDepartments.find(dept => dept.id === user.departmentID);

      setClearanceStatus({ 
        club: { name: studentClub?.name || 'N/A (No Club)', status: studentClub ? 'pending' : 'not_started' },
        department: { name: studentDepartment?.name || 'N/A', status: 'pending' },
        ssg: { status: 'not_started' },
        overallStatus: 'Pending',
        sanctionsFlagged: false, // Default to no sanctions initially
      });
      setIsLoading(false);
    }, 1000);
  };
  
  const getStatusIconAndColor = (status: ApprovalStageStatus) => {
    switch(status) {
      case 'approved': return { icon: <CheckCircle className="h-5 w-5 text-green-500" />, color: "text-green-600" };
      case 'rejected': return { icon: <XCircle className="h-5 w-5 text-red-500" />, color: "text-red-600" };
      case 'pending': return { icon: <Clock className="h-5 w-5 text-yellow-500 animate-pulse" />, color: "text-yellow-600" };
      default: return { icon: <Clock className="h-5 w-5 text-gray-400" />, color: "text-gray-500" }; 
    }
  };
  
  const calculateProgress = () => {
    if (!clearanceStatus) return 0;
    let completedSteps = 0;
    let totalApplicableSteps = 1; // SSG is always applicable

    if (clearanceStatus.club.status !== 'not_started') totalApplicableSteps++;
    if (clearanceStatus.department.status !== 'not_started') totalApplicableSteps++;
    
    if (clearanceStatus.club.status === 'approved') completedSteps++;
    if (clearanceStatus.department.status === 'approved') completedSteps++;
    if (clearanceStatus.ssg.status === 'approved') completedSteps++;
    
    return totalApplicableSteps > 0 ? (completedSteps / totalApplicableSteps) * 100 : 0;
  };

  return (
    <div className="space-y-6">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl font-headline flex items-center gap-2">
            <FileText className="text-primary h-7 w-7" /> My Digital Clearance
          </CardTitle>
          <CardDescription>Request and track your clearance status.</CardDescription>
        </CardHeader>
        <CardContent>
          {!clearanceStatus ? (
            <div className="text-center py-10">
              <p className="text-muted-foreground mb-4">You have not initiated a clearance request yet.</p>
              <Button onClick={handleInitiateClearance} disabled={isLoading} className="bg-primary hover:bg-primary/90">
                {isLoading ? <Clock className="mr-2 h-4 w-4 animate-spin" /> : <PlusCircle className="mr-2 h-4 w-4" />}
                Initiate Clearance Request
              </Button>
            </div>
          ) : (
            <div className="space-y-6">
              {clearanceStatus.sanctionsFlagged && (
                <div className="p-4 border-l-4 border-red-500 bg-red-50 rounded-md">
                    <div className="flex">
                        <div className="flex-shrink-0">
                            <AlertTriangle className="h-5 w-5 text-red-400" aria-hidden="true" />
                        </div>
                        <div className="ml-3">
                            <h3 className="text-sm font-medium text-red-700">Action Required: Sanctions Pending</h3>
                            <div className="mt-2 text-sm text-red-600">
                                <p>{clearanceStatus.sanctionDetails || "You have pending sanctions that need to be resolved."}</p>
                            </div>
                        </div>
                    </div>
                </div>
              )}

              <div>
                <Label className="text-sm font-medium">Overall Progress</Label>
                <Progress value={calculateProgress()} className="w-full mt-1 h-3" />
                <p className="text-sm text-muted-foreground mt-1 text-right">{calculateProgress().toFixed(0)}% Complete</p>
              </div>

              <div className="space-y-4 pt-4 border-t">
                <h3 className="text-lg font-semibold">Approval Stages:</h3>
                {clearanceStatus.club.status !== 'not_started' && (
                    <div className="flex items-center justify-between p-3 border rounded-md bg-card">
                    <div>
                        <p className="font-medium">Club Clearance ({clearanceStatus.club.name})</p>
                        <p className={`text-sm capitalize ${getStatusIconAndColor(clearanceStatus.club.status).color}`}>{clearanceStatus.club.status}</p>
                    </div>
                    {getStatusIconAndColor(clearanceStatus.club.status).icon}
                    </div>
                )}
                <div className="flex items-center justify-between p-3 border rounded-md bg-card">
                  <div>
                    <p className="font-medium">Department Clearance ({clearanceStatus.department.name})</p>
                    <p className={`text-sm capitalize ${getStatusIconAndColor(clearanceStatus.department.status).color}`}>{clearanceStatus.department.status}</p>
                  </div>
                  {getStatusIconAndColor(clearanceStatus.department.status).icon}
                </div>
                <div className="flex items-center justify-between p-3 border rounded-md bg-card">
                  <div>
                    <p className="font-medium">SSG Final Approval</p>
                    <p className={`text-sm capitalize ${getStatusIconAndColor(clearanceStatus.ssg.status).color}`}>{clearanceStatus.ssg.status}</p>
                  </div>
                  {getStatusIconAndColor(clearanceStatus.ssg.status).icon}
                </div>
              </div>

              {clearanceStatus.overallStatus === 'Approved' && clearanceStatus.unifiedClearanceID ? (
                <div className="mt-6 text-center p-6 bg-green-50 border-2 border-dashed border-green-500 rounded-lg">
                  <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-3" />
                  <h3 className="text-xl font-semibold text-green-700">Clearance Approved!</h3>
                  <p className="text-muted-foreground mt-1">Unified Clearance ID: <strong>{clearanceStatus.unifiedClearanceID}</strong></p>
                  <Button className="mt-4 bg-primary hover:bg-primary/90" onClick={() => alert(`Downloading PDF for ${clearanceStatus.unifiedClearanceID}`)} disabled>
                    <Download className="mr-2 h-4 w-4" /> Download Unified Clearance (Not Impl.)
                  </Button>
                </div>
              ) : (
                 <p className="text-center text-muted-foreground mt-6">
                    Overall Status: <Badge variant={clearanceStatus.overallStatus === 'Pending' ? 'secondary' : clearanceStatus.overallStatus === 'Action Required' ? 'destructive' : 'default'} className="text-sm">{clearanceStatus.overallStatus}</Badge>
                 </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
