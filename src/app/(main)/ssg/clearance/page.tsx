
// TODO: Implement SSG Admin Clearance Approval Workflow page
// This page will allow SSG Admins to view all clearance_requests.
// They can approve/reject requests (final step) and generate unifiedClearanceID.

"use client";

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ListChecks, CheckCircle, XCircle, MoreHorizontal, Filter, Search, FileText } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type ApprovalStatus = 'pending' | 'approved' | 'rejected';
interface ClearanceRequest {
  requestID: string;
  studentName: string;
  studentID: string;
  department: string;
  requestedDate: string; // Should be Timestamp
  clubApprovalStatus: ApprovalStatus;
  departmentApprovalStatus: ApprovalStatus;
  ssgStatus: ApprovalStatus; // This is what SSG admin controls
  unifiedClearanceID?: string;
  sanctionDetails?: string;
}

// Mock Data
const mockRequests: ClearanceRequest[] = [
  { requestID: 'req1', studentName: 'John Doe', studentID: 'S001', department: 'BSIT', requestedDate: '2024-07-01', clubApprovalStatus: 'approved', departmentApprovalStatus: 'approved', ssgStatus: 'pending' },
  { requestID: 'req2', studentName: 'Jane Smith', studentID: 'S002', department: 'BSTM', requestedDate: '2024-07-02', clubApprovalStatus: 'approved', departmentApprovalStatus: 'pending', ssgStatus: 'pending', sanctionDetails: "Missed 1 club event" },
  { requestID: 'req3', studentName: 'Mike Brown', studentID: 'S003', department: 'BSCrim', requestedDate: '2024-07-03', clubApprovalStatus: 'rejected', departmentApprovalStatus: 'rejected', ssgStatus: 'pending' },
  { requestID: 'req4', studentName: 'Alice Green', studentID: 'S004', department: 'BSIT', requestedDate: '2024-07-04', clubApprovalStatus: 'approved', departmentApprovalStatus: 'approved', ssgStatus: 'approved', unifiedClearanceID: 'UC-2024-001' },
];

export default function ClearanceApprovalPage() {
  const [requests, setRequests] = useState<ClearanceRequest[]>(mockRequests);
  const [filteredRequests, setFilteredRequests] = useState<ClearanceRequest[]>(mockRequests);
  const [selectedRequest, setSelectedRequest] = useState<ClearanceRequest | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<ApprovalStatus | 'all'>('all');


  useEffect(() => {
    let result = requests;
    if (searchTerm) {
      result = result.filter(req => 
        req.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        req.studentID.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    if (statusFilter !== 'all') {
      result = result.filter(req => req.ssgStatus === statusFilter);
    }
    setFilteredRequests(result);
  }, [requests, searchTerm, statusFilter]);

  const handleViewDetails = (request: ClearanceRequest) => {
    setSelectedRequest(request);
    setIsDetailsModalOpen(true);
  };

  const handleApprove = (requestId: string) => {
    setRequests(prev => prev.map(req => 
      req.requestID === requestId 
      ? { ...req, ssgStatus: 'approved', unifiedClearanceID: `UC-${new Date().getFullYear()}-${String(Math.floor(Math.random()*1000)).padStart(3,'0')}` } 
      : req
    ));
    // Close modal if open for this request
    if(selectedRequest?.requestID === requestId) setIsDetailsModalOpen(false);
  };

  const handleReject = (requestId: string) => {
    const reason = prompt("Enter reason for rejection (optional):");
    setRequests(prev => prev.map(req => 
      req.requestID === requestId 
      ? { ...req, ssgStatus: 'rejected', sanctionDetails: reason || req.sanctionDetails } 
      : req
    ));
     if(selectedRequest?.requestID === requestId) setIsDetailsModalOpen(false);
  };
  
  const getStatusBadge = (status: ApprovalStatus) => {
    switch(status) {
      case 'approved': return <Badge variant="default" className="bg-green-500 hover:bg-green-600">Approved</Badge>;
      case 'rejected': return <Badge variant="destructive">Rejected</Badge>;
      case 'pending': return <Badge variant="secondary" className="bg-yellow-400 text-yellow-900 hover:bg-yellow-500">Pending</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };


  return (
    <div className="space-y-6">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl font-headline flex items-center gap-2">
            <ListChecks className="text-primary h-7 w-7" /> Clearance Approval Workflow
          </CardTitle>
          <CardDescription>Review and manage student clearance requests.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 mb-6 p-4 border rounded-lg bg-muted/20">
            <Input 
              placeholder="Search by student name or ID..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1"
            />
            <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as ApprovalStatus | 'all')}>
              <SelectTrigger className="w-full md:w-[200px]">
                <SelectValue placeholder="Filter by SSG Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student Name</TableHead>
                  <TableHead>Student ID</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Club Status</TableHead>
                  <TableHead>Dept Status</TableHead>
                  <TableHead>SSG Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRequests.map((req) => (
                  <TableRow key={req.requestID}>
                    <TableCell className="font-medium">{req.studentName}</TableCell>
                    <TableCell>{req.studentID}</TableCell>
                    <TableCell>{req.department}</TableCell>
                    <TableCell>{getStatusBadge(req.clubApprovalStatus)}</TableCell>
                    <TableCell>{getStatusBadge(req.departmentApprovalStatus)}</TableCell>
                    <TableCell>{getStatusBadge(req.ssgStatus)}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild><Button variant="ghost" className="h-8 w-8 p-0"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleViewDetails(req)}>View Details</DropdownMenuItem>
                          {req.ssgStatus === 'pending' && req.clubApprovalStatus === 'approved' && req.departmentApprovalStatus === 'approved' && (
                            <DropdownMenuItem onClick={() => handleApprove(req.requestID)} className="text-green-600 focus:text-green-700 focus:bg-green-500/10">
                              <CheckCircle className="mr-2 h-4 w-4" /> Approve
                            </DropdownMenuItem>
                          )}
                          {req.ssgStatus === 'pending' && (
                            <DropdownMenuItem onClick={() => handleReject(req.requestID)} className="text-red-600 focus:text-red-700 focus:bg-red-500/10">
                              <XCircle className="mr-2 h-4 w-4" /> Reject
                            </DropdownMenuItem>
                          )}
                           {req.ssgStatus === 'approved' && req.unifiedClearanceID && (
                            <DropdownMenuItem onClick={() => alert(`Download clearance PDF for ${req.unifiedClearanceID}`)}>
                               <FileText className="mr-2 h-4 w-4" /> Download Clearance
                            </DropdownMenuItem>
                           )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          {filteredRequests.length === 0 && <p className="text-center text-muted-foreground py-10">No clearance requests found matching your criteria.</p>}
        </CardContent>
      </Card>

      {/* Details Modal */}
      <Dialog open={isDetailsModalOpen} onOpenChange={setIsDetailsModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Clearance Request Details</DialogTitle>
            <DialogDescription>Student: {selectedRequest?.studentName} ({selectedRequest?.studentID})</DialogDescription>
          </DialogHeader>
          {selectedRequest && (
            <div className="py-4 space-y-3">
              <p><strong>Department:</strong> {selectedRequest.department}</p>
              <p><strong>Requested Date:</strong> {selectedRequest.requestedDate}</p>
              <p><strong>Club Approval:</strong> {getStatusBadge(selectedRequest.clubApprovalStatus)}</p>
              <p><strong>Department Approval:</strong> {getStatusBadge(selectedRequest.departmentApprovalStatus)}</p>
              <p><strong>SSG Approval:</strong> {getStatusBadge(selectedRequest.ssgStatus)}</p>
              {selectedRequest.unifiedClearanceID && <p><strong>Unified ID:</strong> {selectedRequest.unifiedClearanceID}</p>}
              {selectedRequest.sanctionDetails && <p><strong>Sanctions/Notes:</strong> <span className="text-destructive">{selectedRequest.sanctionDetails}</span></p>}
            </div>
          )}
          <DialogFooter className="sm:justify-start">
             {selectedRequest?.ssgStatus === 'pending' && selectedRequest?.clubApprovalStatus === 'approved' && selectedRequest?.departmentApprovalStatus === 'approved' && (
                <Button onClick={() => handleApprove(selectedRequest!.requestID)} className="bg-green-500 hover:bg-green-600 text-white">
                    <CheckCircle className="mr-2 h-4 w-4" /> Approve
                </Button>
            )}
             {selectedRequest?.ssgStatus === 'pending' && (
                 <Button onClick={() => handleReject(selectedRequest!.requestID)} variant="destructive">
                    <XCircle className="mr-2 h-4 w-4" /> Reject
                </Button>
            )}
            <Button type="button" variant="outline" onClick={() => setIsDetailsModalOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
