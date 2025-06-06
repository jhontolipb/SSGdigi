
"use client";

import type { UserRole, UserProfile, Department, Club, Event } from '@/types/user'; // Added Event
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
  updateUser: (updatedUser: UserProfile) => void; 
  addUser: (newUser: UserProfile) => void; 
  deleteUser: (userId: string) => void; 
  changePassword: (userId: string, currentPasswordAttempt: string, newPassword: string) => Promise<{ success: boolean, message: string }>;
  allClubs: Club[];
  allDepartments: Department[];
  allEvents: Event[]; // Added allEvents
  addEvent: (newEvent: Event) => void;
  updateEvent: (updatedEvent: Event) => void;
  deleteEvent: (eventId: string) => void;
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
];

const initialMockEvents: Event[] = [];


export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [allUsers, setAllUsers] = useState<UserProfile[]>(initialMockUsers);
  const [allEvents, setAllEvents] = useState<Event[]>(initialMockEvents);
  const router = useRouter();
  const pathname = usePathname();
  const { toast } = useToast();

  useEffect(() => {
    // Load current user
    const storedUser = localStorage.getItem('campusConnectUser');
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser);
      setUser(parsedUser);
    }

    // Load all users from localStorage or initialize
    const storedAllUsers = localStorage.getItem('allMockUsers');
    if (storedAllUsers) {
        try {
            const parsedAllUsers = JSON.parse(storedAllUsers);
            if (Array.isArray(parsedAllUsers) && parsedAllUsers.every(u => u.userID && u.email && u.fullName && u.role)) { // Basic validation
                setAllUsers(parsedAllUsers);
                if (storedUser) {
                    const parsedCurrentUser = JSON.parse(storedUser);
                    const canonicalUser = parsedAllUsers.find(u => u.userID === parsedCurrentUser.userID);
                    if (canonicalUser) {
                        setUser(canonicalUser);
                    } else { 
                        localStorage.removeItem('campusConnectUser');
                        setUser(null);
                    }
                }
            } else { // Invalid data in localStorage, reset with initial (superadmin only)
                localStorage.setItem('allMockUsers', JSON.stringify(initialMockUsers));
                setAllUsers(initialMockUsers);
                // If current user was in bad data, clear them too
                if (user && !initialMockUsers.find(u => u.userID === user.userID)) {
                    localStorage.removeItem('campusConnectUser');
                    setUser(null);
                }
            }
        } catch (e) {
            console.error("Failed to parse allMockUsers from localStorage", e);
            localStorage.setItem('allMockUsers', JSON.stringify(initialMockUsers));
            setAllUsers(initialMockUsers);
             if (user && !initialMockUsers.find(u => u.userID === user.userID)) {
                localStorage.removeItem('campusConnectUser');
                setUser(null);
            }
        }
    } else { // No stored users, initialize with superadmin only
        localStorage.setItem('allMockUsers', JSON.stringify(initialMockUsers));
        setAllUsers(initialMockUsers);
    }
    
    // Load events from localStorage or initialize
    const storedEvents = localStorage.getItem('campusConnectEvents');
    if (storedEvents) {
        try {
            const parsedEvents = JSON.parse(storedEvents);
            if (Array.isArray(parsedEvents)) { 
                setAllEvents(parsedEvents);
            } else {
                localStorage.setItem('campusConnectEvents', JSON.stringify(initialMockEvents));
                setAllEvents(initialMockEvents);
            }
        } catch(e) {
            console.error("Failed to parse campusConnectEvents from localStorage", e);
            localStorage.setItem('campusConnectEvents', JSON.stringify(initialMockEvents));
            setAllEvents(initialMockEvents);
        }
    } else {
        localStorage.setItem('campusConnectEvents', JSON.stringify(initialMockEvents));
        setAllEvents(initialMockEvents);
    }

    setLoading(false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
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


  const login = (email: string, passwordAttempt: string) => {
    const foundUser = allUsers.find(u => u.email.toLowerCase() === email.toLowerCase());
    
    if (foundUser && foundUser.password === passwordAttempt) {
        localStorage.setItem('campusConnectUser', JSON.stringify(foundUser));
        setUser(foundUser);
         toast({ title: "Login Successful", description: `Welcome back, ${foundUser.fullName}!` });
      } else {
        toast({ title: "Login Failed", description: "Invalid email or password.", variant: "destructive" });
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
      password: passwordAttempt,
      qrCodeID: 'qr-' + Math.random().toString(36).substr(2, 9),
      points: 0,
    };
    
    setAllUsers(prev => {
        const updatedAllUsers = [...prev, newStudent];
        localStorage.setItem('allMockUsers', JSON.stringify(updatedAllUsers)); 
        return updatedAllUsers;
    });
    localStorage.setItem('campusConnectUser', JSON.stringify(newStudent));
    setUser(newStudent);
    toast({ title: "Registration Successful", description: `Welcome, ${fullName}!` });
    router.push('/student/dashboard');
  };

  const logout = () => {
    localStorage.removeItem('campusConnectUser');
    setUser(null);
    router.push('/login');
  };
  
  const updateUserClub = (userId: string, clubId: string | null) => {
    setAllUsers(prevUsers => {
        const updated = prevUsers.map(u => 
            u.userID === userId ? { ...u, clubID: clubId || undefined } : u
        );
        localStorage.setItem('allMockUsers', JSON.stringify(updated));
        return updated;
    });
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
        setAllUsers(prev => {
            const updated = [...prev, newOIC];
            localStorage.setItem('allMockUsers', JSON.stringify(updated));
            return updated;
        });
        resolve({ success: true, message: "New OIC added successfully." });
      }, 500);
    });
  };

  const updateUser = (updatedUser: UserProfile) => {
    setAllUsers(prevUsers => {
        const updated = prevUsers.map(u => u.userID === updatedUser.userID ? updatedUser : u);
        localStorage.setItem('allMockUsers', JSON.stringify(updated));
        return updated;
    });
    if (user && user.userID === updatedUser.userID) {
      setUser(updatedUser);
      localStorage.setItem('campusConnectUser', JSON.stringify(updatedUser));
    }
  };

  const addUser = (newUser: UserProfile) => {
    setAllUsers(prevUsers => {
        const updated = [...prevUsers, newUser];
        localStorage.setItem('allMockUsers', JSON.stringify(updated));
        return updated;
    });
  };

  const deleteUser = (userId: string) => {
    setAllUsers(prevUsers => {
        const updated = prevUsers.filter(u => u.userID !== userId);
        localStorage.setItem('allMockUsers', JSON.stringify(updated));
        return updated;
    });
     if (user && user.userID === userId) { 
        logout();
    }
  };

  const changePassword = async (userId: string, currentPasswordAttempt: string, newPassword: string): Promise<{ success: boolean, message: string }> => {
    return new Promise((resolve) => {
        setTimeout(() => {
            const userIndex = allUsers.findIndex(u => u.userID === userId);
            if (userIndex === -1) {
                resolve({ success: false, message: "User not found." });
                return;
            }

            const targetUser = allUsers[userIndex];
            if (targetUser.password !== currentPasswordAttempt) {
                resolve({ success: false, message: "Current password incorrect." });
                return;
            }

            const updatedUser = { ...targetUser, password: newPassword };
            
            const updatedAllUsers = [...allUsers];
            updatedAllUsers[userIndex] = updatedUser;
            setAllUsers(updatedAllUsers);
            localStorage.setItem('allMockUsers', JSON.stringify(updatedAllUsers));

            if (user && user.userID === userId) {
                setUser(updatedUser);
                localStorage.setItem('campusConnectUser', JSON.stringify(updatedUser));
            }
            resolve({ success: true, message: "Password updated successfully." });
        }, 500);
    });
  };

  const addEvent = (newEvent: Event) => {
    setAllEvents(prevEvents => {
        const updatedEvents = [...prevEvents, newEvent];
        localStorage.setItem('campusConnectEvents', JSON.stringify(updatedEvents));
        return updatedEvents;
    });
  };

  const updateEvent = (updatedEvent: Event) => {
    setAllEvents(prevEvents => {
        const updatedEvents = prevEvents.map(event => event.id === updatedEvent.id ? updatedEvent : event);
        localStorage.setItem('campusConnectEvents', JSON.stringify(updatedEvents));
        return updatedEvents;
    });
  };

  const deleteEvent = (eventId: string) => {
    setAllEvents(prevEvents => {
        const updatedEvents = prevEvents.filter(event => event.id !== eventId);
        localStorage.setItem('campusConnectEvents', JSON.stringify(updatedEvents));
        return updatedEvents;
    });
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
        changePassword,
        allClubs: defaultClubs, 
        allDepartments: defaultDepartments, 
        allEvents,
        addEvent,
        updateEvent,
        deleteEvent,
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

