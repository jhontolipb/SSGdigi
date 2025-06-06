
export type UserRole = 'ssg_admin' | 'club_admin' | 'department_admin' | 'oic' | 'student';

export interface Department {
  id: string;
  name: string;
}

export interface Club {
  id: string;
  name: string;
  departmentId?: string;
  description?: string;
}

export interface Event {
  id: string;
  name: string;
  description: string;
  date: string; 
  timeIn: string; 
  timeOut: string; 
  location?: string; 
  organizerType: 'ssg' | 'club' | 'department';
  organizerId: string; 
  sanctions?: string;
  oicIds: string[]; 
}

export interface UserProfile {
  userID: string;
  email: string;
  fullName: string;
  role: UserRole;
  password?: string; // Added password field
  departmentID?: string; 
  clubID?: string; 
  assignedClubId?: string; 
  qrCodeID?: string; 
  points?: number; 
}

export type ApprovalStatus = 'pending' | 'approved' | 'rejected' | 'not_started';
export interface ClearanceRequest {
  requestID: string;
  studentUserID: string; 
  requestedDate: string;
  clubApprovalStatus: ApprovalStatus;
  clubApproverID?: string;
  clubApprovalDate?: string;
  departmentApprovalStatus: ApprovalStatus;
  departmentApproverID?: string;
  departmentApprovalDate?: string;
  ssgStatus: ApprovalStatus;
  ssgApproverID?: string;
  ssgApprovalDate?: string;
  unifiedClearanceID?: string;
  sanctionDetails?: string;
}

export interface AttendanceRecord {
  id: string;
  eventID: string;
  studentUserID: string;
  timeIn: string | null; 
  timeOut: string | null; 
  status: 'present' | 'absent' | 'late' | 'pending'; 
  scannedByOICUserID: string; 
}
