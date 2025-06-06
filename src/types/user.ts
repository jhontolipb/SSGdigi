
export type UserRole = 'ssg_admin' | 'club_admin' | 'department_admin' | 'oic' | 'student';

export interface Department {
  id: string;
  name: string;
}

export interface Club {
  id: string;
  name: string;
  departmentId?: string;
}

export interface Event {
  id: string;
  name: string;
  description: string;
  date: string; // Should be Timestamp in real app
  timeIn: string; // Should be Timestamp
  timeOut: string; // Should be Timestamp
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
  departmentID?: string;
  clubID?: string;
  qrCodeID?: string;
  points?: number;
}
