
"use client";

import type { UserRole, UserProfile, Department, Club } from '@/types/user';
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';

interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  login: (email: string) => void;
  logout: () => void;
  registerStudent: (fullName: string, email: string, departmentId: string) => void;
  allUsers: UserProfile[]; // To simulate a user database
  updateUserClub: (userId: string, clubId: string | null) => void; // For club member management
  allClubs: Club[];
  allDepartments: Department[];
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Define default departments
const defaultDepartments: Department[] = [
  { id: 'dept_bs_tourism', name: 'BS Tourism Management' },
  { id: 'dept_bs_it', name: 'BS Information Technology' },
  { id: 'dept_bs_criminology', name: 'BS Criminology' },
  { id: 'dept_bs_ism', name: 'BS Industrial Security Management' },
  { id: 'dept_bs_educ', name: 'Bachelor of Secondary Education' },
  { id: 'dept_bs_ais', name: 'BS Accounting Information System' },
];

// Define default clubs
const defaultClubs: Club[] = [
  { id: 'club_robotics', name: 'Robotics Club', departmentId: 'dept_bs_it', description: 'Exploring the world of robotics and automation.' },
  { id: 'club_tourism_soc', name: 'Tourism Society', departmentId: 'dept_bs_tourism', description: 'Promoting tourism awareness and hospitality skills.' },
  { id: 'club_debate', name: 'Debate Club', description: 'Sharpening critical thinking and public speaking skills.' },
  { id: 'club_eco_warriors', name: 'Eco Warriors Club', description: 'Advocating for environmental sustainability on campus.' },
];


// Mock user data for various roles and scenarios
const initialMockUsers: UserProfile[] = [
  // SSG Admin
  { userID: 'ssg001', email: 'ssg.superadmin@yourcampus.edu', fullName: 'Super Admin', role: 'ssg_admin' },
  // Club Admins
  { userID: 'ca001', email: 'clubadmin.robotics@example.com', fullName: 'Alice Wonderland (Robotics CA)', role: 'club_admin', clubID: 'club_robotics' },
  { userID: 'ca002', email: 'clubadmin.tourism@example.com', fullName: 'Bob The Builder (Tourism CA)', role: 'club_admin', clubID: 'club_tourism_soc' },
  // Department Admins
  { userID: 'da001', email: 'deptadmin.it@example.com', fullName: 'Charlie Chaplin (IT DA)', role: 'department_admin', departmentID: 'dept_bs_it' },
  { userID: 'da002', email: 'deptadmin.tourism@example.com', fullName: 'Diana Prince (Tourism DA)', role: 'department_admin', departmentID: 'dept_bs_tourism' },
  // OICs (some affiliated with departments, some potentially managed by clubs later)
  { userID: 'oic001', email: 'oic.tech@example.com', fullName: 'Edward Scissorhands (OIC)', role: 'oic', departmentID: 'dept_bs_it' },
  { userID: 'oic002', email: 'oic.events@example.com', fullName: 'Fiona Gallagher (OIC)', role: 'oic', departmentID: 'dept_bs_tourism' },
  { userID: 'oic003', email: 'oic.security@example.com', fullName: 'Gregory House (OIC)', role: 'oic', assignedClubId: 'club_robotics' }, // Example of OIC assigned to a club by SSG/Club Admin
  // Students
  { userID: 'stud001', email: 'john.doe@example.com', fullName: 'John Doe', role: 'student', departmentID: 'dept_bs_it', clubID: 'club_robotics', qrCodeID: 'qr_john_doe', points: 150 },
  { userID: 'stud002', email: 'jane.smith@example.com', fullName: 'Jane Smith', role: 'student', departmentID: 'dept_bs_tourism', clubID: 'club_tourism_soc', qrCodeID: 'qr_jane_smith', points: 120 },
  { userID: 'stud003', email: 'peter.pan@example.com', fullName: 'Peter Pan', role: 'student', departmentID: 'dept_bs_criminology', qrCodeID: 'qr_peter_pan', points: 90 },
  { userID: 'stud004', email: 'lucy.heart@example.com', fullName: 'Lucy Heartfilia', role: 'student', departmentID: 'dept_bs_it', qrCodeID: 'qr_lucy_heart', points: 200 },
  { userID: 'stud005', email: 'bruce.wayne@example.com', fullName: 'Bruce Wayne', role: 'student', departmentID: 'dept_bs_criminology', clubID: 'club_debate', qrCodeID: 'qr_bruce_wayne', points: 50 },
];


export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [allUsers, setAllUsers] = useState<UserProfile[]>(initialMockUsers);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const storedUser = localStorage.getItem('campusConnectUser');
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser);
      // Ensure the stored user exists in our canonical list or is a newly registered one
      const canonicalUser = allUsers.find(u => u.userID === parsedUser.userID);
      if (canonicalUser) {
        setUser(canonicalUser); // Use the potentially updated canonical user data
      } else if (parsedUser.role === 'student' && parsedUser.qrCodeId) { // Likely a newly registered student
        setUser(parsedUser);
        if(!allUsers.find(u => u.userID === parsedUser.userID)) { // Add to allUsers if not already there
            setAllUsers(prev => [...prev, parsedUser]);
        }
      }
    }
    setLoading(false);
  }, [allUsers]); // Added allUsers dependency

  useEffect(() => {
    if (!loading && !user && !['/login', '/register'].includes(pathname)) {
      router.push('/login');
    } else if (!loading && user && (pathname === '/login' || pathname === '/register' || pathname === '/')) {
        switch (user.role) {
            case 'ssg_admin': router.push('/ssg/dashboard'); break;
            case 'club_admin': router.push('/club-admin/dashboard'); break;
            case 'department_admin': router.push('/department-admin/dashboard'); break;
            case 'oic': router.push('/oic/events'); break;
            case 'student': router.push('/student/dashboard'); break;
            default: router.push('/login');
        }
    }
  }, [user, loading, pathname, router]);


  const login = (email: string) => {
    const foundUser = allUsers.find(u => u.email.toLowerCase() === email.toLowerCase());
    
    if (foundUser) {
      localStorage.setItem('campusConnectUser', JSON.stringify(foundUser));
      setUser(foundUser);
    } else {
      // Fallback for unregistered emails - create a default student profile for testing
      const defaultStudent: UserProfile = {
        userID: 'user-' + Math.random().toString(36).substr(2, 9),
        email,
        fullName: email.split('@')[0] || 'New Student',
        role: 'student',
        departmentID: defaultDepartments[Math.floor(Math.random() * defaultDepartments.length)].id, // Assign a random department
        qrCodeID: 'qr-' + Math.random().toString(36).substr(2, 9),
        points: 0,
      };
      localStorage.setItem('campusConnectUser', JSON.stringify(defaultStudent));
      setUser(defaultStudent);
      setAllUsers(prev => [...prev, defaultStudent]); // Add to mock DB
    }
  };

  const registerStudent = (fullName: string, email: string, departmentId: string) => {
    const existingUser = allUsers.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (existingUser) {
        alert("Email already registered. Please login or use a different email."); // Or use a toast
        return;
    }

    const newStudent: UserProfile = {
      userID: 'user-' + Math.random().toString(36).substr(2, 9),
      email,
      fullName,
      role: 'student',
      departmentID: departmentId,
      qrCodeID: 'qr-' + Math.random().toString(36).substr(2, 9),
      points: 0,
    };
    localStorage.setItem('campusConnectUser', JSON.stringify(newStudent));
    setUser(newStudent);
    setAllUsers(prev => [...prev, newStudent]); // Add to mock DB
    router.push('/student/dashboard');
  };

  const logout = () => {
    localStorage.removeItem('campusConnectUser');
    setUser(null);
    router.push('/login');
  };
  
  const updateUserClub = (userId: string, clubId: string | null) => {
    setAllUsers(prevUsers => 
      prevUsers.map(u => 
        u.userID === userId ? { ...u, clubID: clubId || undefined } : u
      )
    );
    // If the currently logged-in user is the one being updated, update their local state too
    if (user && user.userID === userId) {
      const updatedUser = { ...user, clubID: clubId || undefined };
      setUser(updatedUser);
      localStorage.setItem('campusConnectUser', JSON.stringify(updatedUser));
    }
  };

  return (
    <AuthContext.Provider value={{ 
        user, 
        loading, 
        login, 
        logout, 
        registerStudent, 
        allUsers, 
        updateUserClub,
        allClubs: defaultClubs,
        allDepartments: defaultDepartments,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export const PredefinedDepartments = defaultDepartments;
export const PredefinedClubs = defaultClubs;
