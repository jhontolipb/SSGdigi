
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
  password?: string; 
  departmentID?: string; 
  clubID?: string; 
  assignedClubId?: string; 
  qrCodeID?: string; 
  points?: number; 
}

export type ApprovalStatus = 'pending' | 'approved' | 'rejected' | 'not_applicable';
export interface ClearanceRequest {
  id: string; // Firestore document ID
  studentUserID: string; 
  studentFullName: string; // Denormalized for easier display
  studentDepartmentName: string; // Denormalized
  studentClubName?: string; // Denormalized
  requestedDate: any; // Firestore Timestamp or string
  
  clubIdAtRequest?: string; // Student's club ID at the time of request
  departmentIdAtRequest: string; // Student's department ID at the time of request

  clubApprovalStatus: ApprovalStatus;
  clubApproverID?: string;
  clubApprovalDate?: any; // Firestore Timestamp or string
  clubApprovalNotes?: string;

  departmentApprovalStatus: ApprovalStatus;
  departmentApproverID?: string;
  departmentApprovalDate?: any; // Firestore Timestamp or string
  departmentApprovalNotes?: string;

  ssgStatus: ApprovalStatus;
  ssgApproverID?: string;
  ssgApprovalDate?: any; // Firestore Timestamp or string
  ssgApprovalNotes?: string; // Consolidated notes or SSG specific notes

  unifiedClearanceID?: string; // Generated upon final SSG approval
  overallStatus: 'Pending' | 'Approved' | 'Rejected' | 'Action Required' | 'Not Requested'; // Calculated or set
}

export interface AttendanceRecord {
  id: string;
  eventID: string;
  studentUserID: string;
  timeIn: string | null; 
  timeOut: string | null; 
  status: 'present' | 'absent' | 'late' | 'pending'; 
  scannedByOICUserID: string;
  timestamp?: any; // Firestore Timestamp
}

