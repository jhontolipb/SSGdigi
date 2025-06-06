
"use client";

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ListChecks, CheckCircle, XCircle, MoreHorizontal, Filter, Search, FileText, Loader2 } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { ClearanceRequest, ApprovalStatus } from '@/types/user';
import { useAuth } from '@/contexts/AuthContext';
import { Textarea } from '@/components/ui/textarea';

export default function ClearanceApprovalPage() {
  const { user, allClearanceRequests, fetchAllClearanceRequests, updateSsgClearanceStatus, loading: authLoading } = useAuth();
  
  const [filteredRequests, setFilteredRequests] = useState<ClearanceRequest[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<ClearanceRequest | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isActionModalOpen, setIsActionModalOpen] = useState(false);
  const [actionType, setActionType] = useState<'approve' | 'reject' | null>(null);
  const [actionNotes, setActionNotes] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<ApprovalStatus | 'all'>('all');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!authLoading) {
        fetchAllClearanceRequests();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading]);

  useEffect(() => {
    let result = allClearanceRequests;
    if (searchTerm) {
      result = result.filter(req => 
        req.studentFullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        req.studentUserID.toLowerCase().includes(searchTerm.toLowerCase()) || 
        req.id.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    if (statusFilter !== 'all') {
      result = result.filter(req => req.ssgStatus === statusFilter);
    }
    setFilteredRequests(result);
  }, [allClearanceRequests, searchTerm, statusFilter]);

  const handleViewDetails = (request: ClearanceRequest) => {
    setSelectedRequest(request);
    setIsDetailsModalOpen(true);
  };

  const openActionModal = (request: ClearanceRequest, type: 'approve' | 'reject') => {
    setSelectedRequest(request);
    setActionType(type);
    setActionNotes(request.ssgApprovalNotes || '');
    setIsActionModalOpen(true);
  };

  const handleSsgAction = async () => {
    if (!selectedRequest || !actionType || !user) return;
    setIsSubmitting(true);
    await updateSsgClearanceStatus(selectedRequest.id, actionType === 'approve' ? 'approved' : 'rejected', user.userID, actionNotes);
    setIsSubmitting(false);
    setIsActionModalOpen(false);
    setSelectedRequest(null); 
    setActionNotes('');
  };
  
  const getStatusBadge = (status: ApprovalStatus) => {
    switch(status) {
      case 'approved': return <Badge variant="default" className="bg-green-500 hover:bg-green-600">Approved</Badge>;
      case 'rejected': return <Badge variant="destructive">Rejected</Badge>;
      case 'pending': return <Badge variant="secondary" className="bg-yellow-400 text-yellow-900 hover:bg-yellow-500">Pending</Badge>;
      case 'not_applicable': return <Badge variant="outline">N/A</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  const canSsgAct = (req: ClearanceRequest) => {
    return req.ssgStatus === 'pending' && 
           (req.clubApprovalStatus === 'approved' || req.clubApprovalStatus === 'not_applicable') &&
           req.departmentApprovalStatus === 'approved';
  }


  return (
    <div className="space-y-6">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl font-headline flex items-center gap-2">
            <ListChecks className="text-primary h-7 w-7" /> Clearance Approval Workflow (SSG)
          </CardTitle>
          <CardDescription>Review and manage student clearance requests. Data from Firestore.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 mb-6 p-4 border rounded-lg bg-muted/20">
            <Input 
              placeholder="Search by student name/ID or request ID..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1"
            />
            <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as ApprovalStatus | 'all')}>
              <SelectTrigger className="w-full md:w-[200px]">
                <SelectValue placeholder="Filter by SSG Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All SSG Statuses</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {authLoading && allClearanceRequests.length === 0 ? (
            <div className="flex justify-center items-center py-10">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="ml-2">Loading clearance requests...</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student Name</TableHead>
                    <TableHead>Request ID</TableHead>
                    <TableHead>Club Status</TableHead>
                    <TableHead>Dept Status</TableHead>
                    <TableHead>SSG Status</TableHead>
                    <TableHead>Overall Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRequests.map((req) => (
                    <TableRow key={req.id}>
                      <TableCell className="font-medium">{req.studentFullName}<br/><span className="text-xs text-muted-foreground">{req.studentUserID}</span></TableCell>
                      <TableCell className="text-xs">{req.id}</TableCell>
                      <TableCell>{getStatusBadge(req.clubApprovalStatus)}</TableCell>
                      <TableCell>{getStatusBadge(req.departmentApprovalStatus)}</TableCell>
                      <TableCell>{getStatusBadge(req.ssgStatus)}</TableCell>
                      <TableCell>
                        <Badge variant={req.overallStatus === 'Approved' ? 'default' : req.overallStatus === 'Rejected' || req.overallStatus === 'Action Required' ? 'destructive' : 'secondary'}
                               className={req.overallStatus === 'Approved' ? 'bg-green-500 hover:bg-green-600' : ''}
                        >
                          {req.overallStatus}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild><Button variant="ghost" className="h-8 w-8 p-0" disabled={isSubmitting}><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleViewDetails(req)}>View Details</DropdownMenuItem>
                            {canSsgAct(req) && (
                              <>
                                <DropdownMenuItem onClick={() => openActionModal(req, 'approve')} className="text-green-600 focus:text-green-700 focus:bg-green-500/10">
                                  <CheckCircle className="mr-2 h-4 w-4" /> Approve (SSG)
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => openActionModal(req, 'reject')} className="text-red-600 focus:text-red-700 focus:bg-red-500/10">
                                  <XCircle className="mr-2 h-4 w-4" /> Reject (SSG)
                                </DropdownMenuItem>
                              </>
                            )}
                             {req.overallStatus === 'Approved' && req.unifiedClearanceID && (
                              <DropdownMenuItem onClick={() => alert(`Download clearance PDF for ${req.unifiedClearanceID}`)} disabled>
                                 <FileText className="mr-2 h-4 w-4" /> Download Clearance (Not Impl.)
                              </DropdownMenuItem>
                             )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                   {filteredRequests.length === 0 && !authLoading && (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-muted-foreground h-24">
                        No clearance requests found matching your criteria.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Details Modal */}
      <Dialog open={isDetailsModalOpen} onOpenChange={setIsDetailsModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Clearance Request Details</DialogTitle>
            <DialogDescription>Request ID: {selectedRequest?.id}</DialogDescription>
          </DialogHeader>
          {selectedRequest && (
            <div className="py-4 space-y-3 text-sm">
              <p><strong>Student:</strong> {selectedRequest.studentFullName} ({selectedRequest.studentUserID})</p>
              <p><strong>Department:</strong> {selectedRequest.studentDepartmentName}</p>
              <p><strong>Club:</strong> {selectedRequest.studentClubName || 'N/A'}</p>
              <p><strong>Requested Date:</strong> {selectedRequest.requestedDate?.toString()}</p>
              <hr/>
              <p><strong>Club Approval:</strong> {getStatusBadge(selectedRequest.clubApprovalStatus)} {selectedRequest.clubApprovalDate && `on ${selectedRequest.clubApprovalDate.toString()}`}</p>
              {selectedRequest.clubApprovalNotes && <p className="pl-4 text-xs text-muted-foreground">Notes: {selectedRequest.clubApprovalNotes}</p>}
              <p><strong>Dept. Approval:</strong> {getStatusBadge(selectedRequest.departmentApprovalStatus)} {selectedRequest.departmentApprovalDate && `on ${selectedRequest.departmentApprovalDate.toString()}`}</p>
              {selectedRequest.departmentApprovalNotes && <p className="pl-4 text-xs text-muted-foreground">Notes: {selectedRequest.departmentApprovalNotes}</p>}
              <p><strong>SSG Approval:</strong> {getStatusBadge(selectedRequest.ssgStatus)} {selectedRequest.ssgApprovalDate && `on ${selectedRequest.ssgApprovalDate.toString()}`}</p>
              {selectedRequest.ssgApprovalNotes && <p className="pl-4 text-xs text-muted-foreground">Notes: {selectedRequest.ssgApprovalNotes}</p>}
               <hr/>
              <p><strong>Overall Status:</strong> <Badge variant={selectedRequest.overallStatus === 'Approved' ? 'default' : selectedRequest.overallStatus === 'Rejected' ? 'destructive' : 'secondary'} className={selectedRequest.overallStatus === 'Approved' ? 'bg-green-500 hover:bg-green-600' : ''}>{selectedRequest.overallStatus}</Badge></p>
              {selectedRequest.unifiedClearanceID && <p><strong>Unified ID:</strong> {selectedRequest.unifiedClearanceID}</p>}
            </div>
          )}
          <DialogFooter className="sm:justify-start">
            <Button type="button" variant="outline" onClick={() => setIsDetailsModalOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Action Modal (Approve/Reject) */}
       <Dialog open={isActionModalOpen} onOpenChange={setIsActionModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{actionType === 'approve' ? 'Approve' : 'Reject'} SSG Clearance</DialogTitle>
            <DialogDescription>For {selectedRequest?.studentFullName} (Request ID: {selectedRequest?.id})</DialogDescription>
          </DialogHeader>
            <div className="py-4 space-y-3">
                <Label htmlFor="actionNotes">Notes (Optional for Approve, Recommended for Reject)</Label>
                <Textarea 
                    id="actionNotes" 
                    value={actionNotes} 
                    onChange={(e) => setActionNotes(e.target.value)}
                    placeholder={actionType === 'reject' ? "Reason for rejection..." : "Optional notes..."}
                />
            </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsActionModalOpen(false)} disabled={isSubmitting}>Cancel</Button>
            <Button 
                onClick={handleSsgAction} 
                className={actionType === 'approve' ? 'bg-green-500 hover:bg-green-600' : 'bg-red-500 hover:bg-red-600'}
                disabled={isSubmitting}
            >
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Confirm {actionType === 'approve' ? 'Approval' : 'Rejection'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
