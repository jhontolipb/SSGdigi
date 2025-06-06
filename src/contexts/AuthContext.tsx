
"use client";

import type { UserRole } from '@/types/user';
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';

interface User {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  departmentId?: string;
  clubId?: string;
  qrCodeId?: string;
  points?: number;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, role: UserRole) => void;
  logout: () => void;
  registerStudent: (fullName: string, email: string, departmentId: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Define default departments
const defaultDepartments = [
  { id: 'dept_bs_tourism', name: 'BS Tourism Management' },
  { id: 'dept_bs_it', name: 'BS Information Technology' },
  { id: 'dept_bs_criminology', name: 'BS Criminology' },
  { id: 'dept_bs_ism', name: 'BS Industrial Security Management' },
  { id: 'dept_bs_educ', name: 'Bachelor of Secondary Education' },
  { id: 'dept_bs_ais', name: 'BS Accounting Information System' },
];

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Simulate checking auth state
    const storedUser = localStorage.getItem('campusConnectUser');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

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


  const login = (email: string, role: UserRole) => {
    // Simulate login
    const mockUser: User = {
      id: 'user-' + Math.random().toString(36).substr(2, 9),
      email,
      fullName: email === 'ssg.superadmin@yourcampus.edu' ? 'Super Admin' : 'Test User',
      role,
      qrCodeId: role === 'student' ? 'qr-' + Math.random().toString(36).substr(2, 9) : undefined,
      departmentId: role === 'student' ? defaultDepartments[0].id : undefined, // Assign a default department for testing
    };
    localStorage.setItem('campusConnectUser', JSON.stringify(mockUser));
    setUser(mockUser);
  };

  const registerStudent = (fullName: string, email: string, departmentId: string) => {
    const newStudent: User = {
      id: 'user-' + Math.random().toString(36).substr(2, 9),
      email,
      fullName,
      role: 'student',
      departmentId,
      qrCodeId: 'qr-' + Math.random().toString(36).substr(2, 9),
      points: 0,
    };
    localStorage.setItem('campusConnectUser', JSON.stringify(newStudent));
    setUser(newStudent);
    router.push('/student/dashboard');
  };

  const logout = () => {
    localStorage.removeItem('campusConnectUser');
    setUser(null);
    router.push('/login');
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, registerStudent }}>
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

