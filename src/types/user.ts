
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
  id: string;
  studentUserID: string;
  studentFullName: string;
  studentDepartmentName: string;
  studentClubName?: string;
  requestedDate: any; // Firestore Timestamp or string representation

  clubIdAtRequest?: string;
  departmentIdAtRequest: string;

  clubApprovalStatus: ApprovalStatus;
  clubApproverID?: string;
  clubApprovalDate?: any;
  clubApprovalNotes?: string;

  departmentApprovalStatus: ApprovalStatus;
  departmentApproverID?: string;
  departmentApprovalDate?: any;
  departmentApprovalNotes?: string;

  ssgStatus: ApprovalStatus;
  ssgApproverID?: string;
  ssgApprovalDate?: any;
  ssgApprovalNotes?: string;

  unifiedClearanceID?: string;
  overallStatus: 'Pending' | 'Approved' | 'Rejected' | 'Action Required' | 'Not Requested';
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

// Messaging System Types
export interface MessageFirestore {
  id: string; // Firestore document ID
  senderId: string; // UserProfile.userID
  senderName: string; // Denormalized for display
  text: string;
  timestamp: any; // Firestore Timestamp
  conversationId: string; // To easily link back or denormalize, though usually part of subcollection path
}

export interface ConversationFirestore {
  id: string; // Firestore document ID
  participantUIDs: string[]; // Array of UserProfile.userID
  participantInfo?: Record<string, { fullName: string; avatarSeed?: string }>; // Optional: Store basic info for quick display
  type: 'direct' | 'group';
  groupName?: string; // if type is 'group'
  groupAvatarSeed?: string; // if type is 'group'
  lastMessageText?: string;
  lastMessageTimestamp?: any; // Firestore Timestamp
  lastMessageSenderId?: string;
  // Optional: For unread counts, more complex but useful
  unreadCounts?: Record<string, number>; // e.g., { [userId]: count }
  createdAt: any; // Firestore Timestamp
}
