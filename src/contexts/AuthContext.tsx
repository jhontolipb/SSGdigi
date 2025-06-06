
"use client";

import type { UserRole, UserProfile, Department, Club } from '@/types/user';
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';

interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  login: (email: string, passwordAttempt: string) => void;
  logout: () => void;
  registerStudent: (fullName: string, email: string, departmentId: string, passwordAttempt: string) => void;
  allUsers: UserProfile[]; 
  updateUserClub: (userId: string, clubId: string | null) => void; 
  addNewOIC: (fullName: string, email: string) => Promise<{success: boolean, message: string}>;
  updateUser: (updatedUser: UserProfile) => void; // For SSG user management
  addUser: (newUser: UserProfile) => void; // For SSG user management
  deleteUser: (userId: string) => void; // For SSG user management
  allClubs: Club[];
  allDepartments: Department[];
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const defaultPassword = "password123";

const defaultDepartments: Department[] = [
  { id: 'dept_bs_tourism', name: 'BS Tourism Management' },
  { id: 'dept_bs_it', name: 'BS Information Technology' },
  { id: 'dept_bs_criminology', name: 'BS Criminology' },
  { id: 'dept_bs_ism', name: 'BS Industrial Security Management' },
  { id: 'dept_bs_educ', name: 'Bachelor of Secondary Education' },
  { id: 'dept_bs_ais', name: 'BS Accounting Information System' },
];

const defaultClubs: Club[] = [
  { id: 'club_robotics', name: 'Robotics Club', departmentId: 'dept_bs_it', description: 'Exploring the world of robotics and automation.' },
  { id: 'club_tourism_soc', name: 'Tourism Society', departmentId: 'dept_bs_tourism', description: 'Promoting tourism awareness and hospitality skills.' },
  { id: 'club_debate', name: 'Debate Club', description: 'Sharpening critical thinking and public speaking skills.' },
  { id: 'club_eco_warriors', name: 'Eco Warriors Club', description: 'Advocating for environmental sustainability on campus.' },
];

const initialMockUsers: UserProfile[] = [
  { userID: 'ssg001', email: 'ssg.superadmin@yourcampus.edu', fullName: 'Super Admin', role: 'ssg_admin', password: defaultPassword },
  { userID: 'ca001', email: 'clubadmin.robotics@example.com', fullName: 'Alice Wonderland (Robotics CA)', role: 'club_admin', clubID: 'club_robotics', password: defaultPassword },
  { userID: 'ca002', email: 'clubadmin.tourism@example.com', fullName: 'Bob The Builder (Tourism CA)', role: 'club_admin', clubID: 'club_tourism_soc', password: defaultPassword },
  { userID: 'da001', email: 'deptadmin.it@example.com', fullName: 'Charlie Chaplin (IT DA)', role: 'department_admin', departmentID: 'dept_bs_it', password: defaultPassword },
  { userID: 'da002', email: 'deptadmin.tourism@example.com', fullName: 'Diana Prince (Tourism DA)', role: 'department_admin', departmentID: 'dept_bs_tourism', password: defaultPassword },
  { userID: 'oic001', email: 'oic.tech@example.com', fullName: 'Edward Scissorhands (OIC)', role: 'oic', departmentID: 'dept_bs_it', password: defaultPassword },
  { userID: 'oic002', email: 'oic.events@example.com', fullName: 'Fiona Gallagher (OIC)', role: 'oic', departmentID: 'dept_bs_tourism', password: defaultPassword },
  { userID: 'oic003', email: 'oic.security@example.com', fullName: 'Gregory House (OIC)', role: 'oic', assignedClubId: 'club_robotics', password: defaultPassword },
  { userID: 'stud001', email: 'john.doe@example.com', fullName: 'John Doe', role: 'student', departmentID: 'dept_bs_it', clubID: 'club_robotics', qrCodeID: 'qr_john_doe', points: 150, password: defaultPassword },
  { userID: 'stud002', email: 'jane.smith@example.com', fullName: 'Jane Smith', role: 'student', departmentID: 'dept_bs_tourism', clubID: 'club_tourism_soc', qrCodeID: 'qr_jane_smith', points: 120, password: defaultPassword },
  { userID: 'stud003', email: 'peter.pan@example.com', fullName: 'Peter Pan', role: 'student', departmentID: 'dept_bs_criminology', qrCodeID: 'qr_peter_pan', points: 90, password: defaultPassword },
  { userID: 'stud004', email: 'lucy.heart@example.com', fullName: 'Lucy Heartfilia', role: 'student', departmentID: 'dept_bs_it', qrCodeID: 'qr_lucy_heart', points: 200, password: defaultPassword },
  { userID: 'stud005', email: 'bruce.wayne@example.com', fullName: 'Bruce Wayne', role: 'student', departmentID: 'dept_bs_criminology', clubID: 'club_debate', qrCodeID: 'qr_bruce_wayne', points: 50, password: defaultPassword },
];


export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [allUsers, setAllUsers] = useState<UserProfile[]>(initialMockUsers);
  const router = useRouter();
  const pathname = usePathname();
  const { toast } = useToast();

  useEffect(() => {
    const storedUser = localStorage.getItem('campusConnectUser');
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser);
      const canonicalUser = allUsers.find(u => u.userID === parsedUser.userID);
      if (canonicalUser) {
        setUser(canonicalUser); 
      } else if (parsedUser.role === 'student' && parsedUser.qrCodeId) { 
        setUser(parsedUser);
        if(!allUsers.find(u => u.userID === parsedUser.userID)) { 
            setAllUsers(prev => [...prev, parsedUser]);
        }
      }
    }
    setLoading(false);
  }, [allUsers]);

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


  const login = (email: string, passwordAttempt: string) => {
    const foundUser = allUsers.find(u => u.email.toLowerCase() === email.toLowerCase());
    
    if (foundUser) {
      // For student role, password check is simplified for this mock. 
      // For other roles, we check the password.
      if (foundUser.role === 'student' || foundUser.password === passwordAttempt) {
        localStorage.setItem('campusConnectUser', JSON.stringify(foundUser));
        setUser(foundUser);
         toast({ title: "Login Successful", description: `Welcome back, ${foundUser.fullName}!` });
      } else {
        toast({ title: "Login Failed", description: "Invalid email or password.", variant: "destructive" });
      }
    } else {
      toast({ title: "Login Failed", description: "User not found.", variant: "destructive" });
    }
  };

  const registerStudent = (fullName: string, email: string, departmentId: string, passwordAttempt: string) => {
    const existingUser = allUsers.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (existingUser) {
        toast({ title: "Registration Failed", description: "Email already registered.", variant: "destructive" });
        return;
    }

    const newStudent: UserProfile = {
      userID: 'user-' + Math.random().toString(36).substr(2, 9),
      email,
      fullName,
      role: 'student',
      departmentID: departmentId,
      password: passwordAttempt, // Store the password
      qrCodeID: 'qr-' + Math.random().toString(36).substr(2, 9),
      points: 0,
    };
    localStorage.setItem('campusConnectUser', JSON.stringify(newStudent));
    setUser(newStudent);
    setAllUsers(prev => [...prev, newStudent]); 
    toast({ title: "Registration Successful", description: `Welcome, ${fullName}!` });
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
    if (user && user.userID === userId) {
      const updatedUser = { ...user, clubID: clubId || undefined };
      setUser(updatedUser);
      localStorage.setItem('campusConnectUser', JSON.stringify(updatedUser));
    }
  };

  const addNewOIC = async (fullName: string, email: string): Promise<{success: boolean, message: string}> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const existingUser = allUsers.find(u => u.email.toLowerCase() === email.toLowerCase());
        if (existingUser) {
          resolve({ success: false, message: "Email already registered." });
          return;
        }

        const newOIC: UserProfile = {
          userID: 'oic-' + Math.random().toString(36).substring(2, 9),
          email,
          fullName,
          role: 'oic',
          password: defaultPassword, 
        };
        setAllUsers(prev => [...prev, newOIC]);
        resolve({ success: true, message: "New OIC added successfully." });
      }, 500);
    });
  };

  const updateUser = (updatedUser: UserProfile) => {
    setAllUsers(prevUsers => prevUsers.map(u => u.userID === updatedUser.userID ? updatedUser : u));
    if (user && user.userID === updatedUser.userID) {
      setUser(updatedUser);
      localStorage.setItem('campusConnectUser', JSON.stringify(updatedUser));
    }
  };

  const addUser = (newUser: UserProfile) => {
    setAllUsers(prevUsers => [...prevUsers, newUser]);
  };

  const deleteUser = (userId: string) => {
    setAllUsers(prevUsers => prevUsers.filter(u => u.userID !== userId));
     if (user && user.userID === userId) { // If deleting self, logout
        logout();
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
        addNewOIC,
        updateUser,
        addUser,
        deleteUser,
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
