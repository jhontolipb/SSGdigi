
export type UserRole = 'ssg_admin' | 'club_admin' | 'department_admin' | 'oic' | 'student';

export interface Department {
  id: string;
  name: string;
}

export interface Club {
  id: string;
  name: string;
  departmentId?: string;
  description?: string; // Added for more club detail
}

export interface Event {
  id: string;
  name: string;
  description: string;
  date: string; // Should be Timestamp in real app
  timeIn: string; // Should be Timestamp
  timeOut: string; // Should be Timestamp
  location?: string; // Added location
  organizerType: 'ssg' | 'club' | 'department';
  organizerId: string; // e.g., ssg_main, club_id, department_id
  sanctions?: string;
  oicIds: string[]; // UserIDs of assigned OICs
}

export interface UserProfile {
  userID: string;
  email: string;
  fullName: string;
  role: UserRole;
  departmentID?: string; // For students, dept_admins, OICs affiliated with a department
  clubID?: string; // For students who are members, club_admins
  assignedClubId?: string; // For OICs specifically managed by a club
  qrCodeID?: string; // For students
  points?: number; // For students
}

// For clearance requests (can be expanded)
export type ApprovalStatus = 'pending' | 'approved' | 'rejected' | 'not_started';
export interface ClearanceRequest {
  requestID: string;
  studentUserID: string; // links to UserProfile.userID
  // studentName: string; // Can be fetched from UserProfile
  // studentIDNumber: string; // Can be fetched from UserProfile
  // department: string; // Can be fetched from UserProfile
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

// For Attendance Records
export interface AttendanceRecord {
  id: string;
  eventID: string;
  studentUserID: string;
  timeIn: string | null; // ISOString
  timeOut: string | null; // ISOString
  status: 'present' | 'absent' | 'late' | 'pending'; // 'pending' if expected but not scanned
  scannedByOICUserID: string; // OIC who scanned
}
