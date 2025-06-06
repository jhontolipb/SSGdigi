
"use client";

import type { UserRole, UserProfile, Department, Club, Event } from '@/types/user';
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { auth, db } from '@/lib/firebase'; // Ensure this path is correct
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updatePassword as firebaseUpdatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider
} from 'firebase/auth';
import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
  deleteDoc,
  collection,
  getDocs,
  query,
  where,
  addDoc,
  // serverTimestamp // If you want to add timestamps
} from 'firebase/firestore';

interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  login: (email: string, passwordAttempt: string) => Promise<void>;
  logout: () => Promise<void>;
  registerStudent: (fullName: string, email: string, departmentId: string, passwordAttempt: string) => Promise<void>;
  allUsers: UserProfile[];
  updateUser: (updatedProfileData: Partial<UserProfile>, userId: string) => Promise<void>;
  addUser: (newUserProfileData: Omit<UserProfile, 'userID' | 'password'>, password?: string) => Promise<string | null>;
  deleteUserAuth: (userId: string) => Promise<{success: boolean, message: string}>;
  deleteUserProfile: (userId: string) => Promise<void>;
  changePassword: (currentPasswordAttempt: string, newPassword: string) => Promise<{ success: boolean, message: string }>;
  fetchUsers: () => Promise<void>;

  // Departments - Now Firestore-backed
  allDepartments: Department[];
  fetchDepartments: () => Promise<void>;
  addDepartment: (departmentName: string) => Promise<string | null>; // Returns new department ID or null
  updateDepartment: (departmentId: string, departmentName: string) => Promise<void>;
  deleteDepartment: (departmentId: string) => Promise<void>;

  // Clubs - Still mock for now
  allClubs: Club[];
  // TODO: Add Firestore functions for clubs similar to departments

  // Events - Still mock for now
  allEvents: Event[];
  addEvent: (newEvent: Event) => void;
  updateEvent: (updatedEvent: Event) => void;
  deleteEvent: (eventId: string) => void;

  // Deprecated placeholders - to be fully integrated or removed
  updateUserClub: (userId: string, clubId: string | null) => void;
  addNewOIC: (fullName: string, email: string) => Promise<{success: boolean, message: string}>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Default clubs remain for selection UI and structure, not users.
const defaultClubs: Club[] = [
  { id: 'club_robotics', name: 'Robotics Club', departmentId: 'dept_bs_it', description: 'Exploring the world of robotics and automation.' },
  { id: 'club_tourism_soc', name: 'Tourism Society', departmentId: 'dept_bs_tourism', description: 'Promoting tourism awareness and hospitality skills.' },
  { id: 'club_debate', name: 'Debate Club', description: 'Sharpening critical thinking and public speaking skills.' },
  { id: 'club_eco_warriors', name: 'Eco Warriors Club', description: 'Advocating for environmental sustainability on campus.' },
];

const initialMockEvents: Event[] = [];

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [allUsers, setAllUsers] = useState<UserProfile[]>([]);
  const [allDepartments, setAllDepartments] = useState<Department[]>([]);
  const [allClubs, setAllClubs] = useState<Club[]>(defaultClubs);
  const [allEvents, setAllEvents] = useState<Event[]>(initialMockEvents);
  const router = useRouter();
  const pathname = usePathname();
  const { toast } = useToast();


  const fetchUsers = async () => {
    try {
      const usersCollectionRef = collection(db, "users");
      const querySnapshot = await getDocs(usersCollectionRef);
      const usersList = querySnapshot.docs.map(docSnap => ({ userID: docSnap.id, ...docSnap.data() } as UserProfile));
      setAllUsers(usersList);
    } catch (error) {
      console.error("Error fetching all users:", error);
      toast({ title: "Error", description: "Could not load user data.", variant: "destructive" });
    }
  };

  const fetchDepartments = async () => {
    try {
      const departmentsCollectionRef = collection(db, "departments");
      const querySnapshot = await getDocs(departmentsCollectionRef);
      const departmentsList = querySnapshot.docs.map(docSnap => ({
        id: docSnap.id,
        ...docSnap.data()
      } as Department));
      setAllDepartments(departmentsList);
    } catch (error) {
      console.error("Error fetching departments:", error);
      toast({ title: "Error loading departments", description: (error as Error).message || "Could not load department data.", variant: "destructive" });
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const userDocRef = doc(db, 'users', firebaseUser.uid);
          const userDocSnap = await getDoc(userDocRef);
          if (userDocSnap.exists()) {
            setUser({ userID: firebaseUser.uid, ...userDocSnap.data() } as UserProfile);
          } else {
            console.warn("User exists in Auth, but no profile in Firestore. Logging out.");
            await signOut(auth);
            setUser(null);
          }
        } catch (error) {
            console.error("Error fetching user profile from Firestore:", error);
            setUser(null); // Ensure user is null on error
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    fetchUsers();
    fetchDepartments();

    const storedEvents = localStorage.getItem('campusConnectEvents');
    if (storedEvents) {
        try {
            const parsedEvents = JSON.parse(storedEvents);
            if (Array.isArray(parsedEvents)) setAllEvents(parsedEvents);
        } catch(e) { console.error("Failed to parse events from LS", e); }
    }


    return () => unsubscribe();
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
            default: router.push('/login'); // Fallback
        }
    }
  }, [user, loading, pathname, router]);


  const login = async (email: string, passwordAttempt: string) => {
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, passwordAttempt);
      // onAuthStateChanged will handle setting user and navigation
      toast({ title: "Login Successful", description: `Welcome back!` });
    } catch (error: any) {
      console.error("Login error", error);
      toast({ title: "Login Failed", description: error.message || "Invalid email or password.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const registerStudent = async (fullName: string, email: string, departmentId: string, passwordAttempt: string) => {
    setLoading(true);
    try {
      // Check if email already exists in Firestore users collection (as a pre-check)
      const usersQuery = query(collection(db, "users"), where("email", "==", email));
      const querySnapshot = await getDocs(usersQuery);
      if (!querySnapshot.empty) {
        toast({ title: "Registration Failed", description: "Email already associated with a profile.", variant: "destructive" });
        setLoading(false);
        return;
      }

      const userCredential = await createUserWithEmailAndPassword(auth, email, passwordAttempt);
      const firebaseUser = userCredential.user;
      const newStudentProfile: UserProfile = {
        userID: firebaseUser.uid,
        email,
        fullName,
        role: 'student',
        departmentID: departmentId,
        qrCodeID: 'qr-' + firebaseUser.uid.substring(0,8) + Date.now().toString().slice(-4), // Example QR ID
        points: 0,
      };
      await setDoc(doc(db, 'users', firebaseUser.uid), newStudentProfile);
      // onAuthStateChanged will handle setting user and navigation
      toast({ title: "Registration Successful", description: `Welcome, ${fullName}!` });
      await fetchUsers(); // Refresh allUsers state
    } catch (error: any) {
      console.error("Registration error", error);
      toast({ title: "Registration Failed", description: error.message || "Could not create account.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      await signOut(auth);
      setUser(null); // Explicitly set user to null
      setAllUsers([]); // Clear all users on logout
      setAllDepartments([]); // Clear departments
      router.push('/login'); // Navigate to login
    } catch (error: any) {
      console.error("Logout error", error);
      toast({ title: "Logout Error", description: error.message || "Could not log out.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const updateUser = async (updatedProfileData: Partial<UserProfile>, userIdToUpdate: string) => {
    try {
      const userDocRef = doc(db, 'users', userIdToUpdate);
      // Ensure we don't try to write userID or password to the Firestore document directly from this partial update
      const { userID, password, ...safeUpdates } = updatedProfileData;
      await updateDoc(userDocRef, safeUpdates);
      await fetchUsers(); // Refresh allUsers state
      // If the updated user is the currently logged-in user, update their local state
      if (user && user.userID === userIdToUpdate) {
        setUser(prev => prev ? ({ ...prev, ...safeUpdates }) : null);
      }
      toast({ title: "Success", description: "User profile updated." });
    } catch (error: any) {
      console.error("Error updating user profile:", error);
      toast({ title: "Error", description: error.message || "Could not update user profile.", variant: "destructive" });
    }
  };

  const addUser = async (newUserProfileData: Omit<UserProfile, 'userID' | 'password'>, password?: string): Promise<string | null> => {
    if (!password) {
      toast({ title: "Error", description: "Password is required for new users.", variant: "destructive" });
      return null;
    }
    // Check if email already exists in Firestore users collection
    const usersQuery = query(collection(db, "users"), where("email", "==", newUserProfileData.email));
    const querySnapshot = await getDocs(usersQuery);
    if (!querySnapshot.empty) {
        toast({ title: "Creation Failed", description: "Email already exists in user profiles.", variant: "destructive" });
        return null;
    }

    let createdAuthUserUid: string | null = null;
    // Temporarily store current auth state if an admin is creating a user
    const currentAuthUser = auth.currentUser; 

    try {
      // Create user in Firebase Auth
      // This will sign out the current admin and sign in as the new user temporarily.
      const tempUserCredential = await createUserWithEmailAndPassword(auth, newUserProfileData.email, password);
      createdAuthUserUid = tempUserCredential.user.uid;

      // Create user profile in Firestore
      const finalProfileData: Omit<UserProfile, 'password'> = {
        ...newUserProfileData,
        userID: createdAuthUserUid,
        // Add default qrCodeID and points if the role is student
        qrCodeID: newUserProfileData.role === 'student' ? 'qr-' + createdAuthUserUid.substring(0,8) + Date.now().toString().slice(-4) : undefined,
        points: newUserProfileData.role === 'student' ? 0 : undefined,
      };
      await setDoc(doc(db, 'users', createdAuthUserUid), finalProfileData);

      // Attempt to re-authenticate the admin if one was logged in
      // This is a simplified re-login. Real-world scenarios might need more robust handling or admin SDK.
      if (currentAuthUser && currentAuthUser.email && user?.password) { 
        await signOut(auth); // Sign out the newly created user
        // Attempt to re-sign in the admin. This requires the admin's password.
        // For this prototype, we assume 'user.password' holds the admin's current password,
        // which is NOT secure and generally unavailable client-side.
        // A better approach for admin user creation uses Firebase Admin SDK on a backend.
        // For now, admin might need to log in again manually if this fails.
        try {
            await signInWithEmailAndPassword(auth, currentAuthUser.email, user.password);
        } catch (reauthError) {
            console.warn("Admin re-authentication failed after creating user. Admin may need to log in again.", reauthError);
            // router.push('/login'); // Or force admin to login page
        }
      }

      await fetchUsers(); // Refresh allUsers state
      toast({ title: "User Created", description: `${newUserProfileData.fullName} added successfully.` });
      return createdAuthUserUid;
    } catch (error: any) {
      console.error("Error creating user (Auth/Firestore):", error);
      toast({ title: "Creation Failed", description: error.message || "Could not create user.", variant: "destructive" });
      // If Auth user was created but Firestore profile failed, it's an orphaned Auth account.
      if (createdAuthUserUid && error.code !== 'auth/email-already-in-use') { // Check it's not just an email-exists error from Auth
          console.warn("User created in Auth but Firestore profile failed. Manual cleanup might be needed in Firebase Auth console.");
          // Consider deleting the orphaned auth user here if possible, though client-side deletion of other users is restricted.
      }
      return null;
    }
  };

  const deleteUserAuth = async (userId: string): Promise<{success: boolean, message: string}> => {
    // Client-side deletion of *other* users' Auth accounts is not typically allowed for security.
    // This would usually be handled by a backend function with Admin SDK privileges.
    toast({ title: "Action Required", description: "Deleting users from Firebase Authentication must be done via the Firebase Console or a backend function for security reasons in this prototype.", variant: "default" });
    return { success: false, message: "Manual deletion from Firebase Auth required." };
  };

  const deleteUserProfile = async (userId: string) => {
    try {
      await deleteDoc(doc(db, 'users', userId));
      await fetchUsers(); // Refresh allUsers state
      toast({ title: "Success", description: "User profile deleted from Firestore." });
    } catch (error: any) {
      console.error("Error deleting user profile:", error);
      toast({ title: "Error", description: error.message || "Could not delete user profile.", variant: "destructive" });
    }
  };

  const changePassword = async (currentPasswordAttempt: string, newPassword: string): Promise<{ success: boolean, message: string }> => {
    const firebaseUser = auth.currentUser;
    if (!firebaseUser || !firebaseUser.email) {
      return { success: false, message: "No user logged in or email not found." };
    }

    try {
      const credential = EmailAuthProvider.credential(firebaseUser.email, currentPasswordAttempt);
      await reauthenticateWithCredential(firebaseUser, credential);
      await firebaseUpdatePassword(firebaseUser, newPassword);
      toast({ title: "Success", description: "Password updated successfully." });
      return { success: true, message: "Password updated successfully." };
    } catch (error: any) {
      console.error("Password change error", error);
      let message = "Could not update password.";
      if (error.code === 'auth/wrong-password') {
        message = "Current password incorrect.";
      } else if (error.code === 'auth/weak-password') {
        message = "New password is too weak.";
      }
      toast({ title: "Error", description: message, variant: "destructive" });
      return { success: false, message };
    }
  };

  // Department CRUD
  const addDepartment = async (departmentName: string): Promise<string | null> => {
    try {
      const deptColRef = collection(db, "departments");
      const docRef = await addDoc(deptColRef, { name: departmentName });
      await fetchDepartments(); // Refresh list
      toast({ title: "Department Added", description: `${departmentName} created successfully.`});
      return docRef.id;
    } catch (error: any) {
      console.error("Error adding department:", error);
      toast({ title: "Error", description: error.message || "Could not add department.", variant: "destructive" });
      return null;
    }
  };

  const updateDepartment = async (departmentId: string, departmentName: string) => {
    try {
      const deptDocRef = doc(db, "departments", departmentId);
      await updateDoc(deptDocRef, { name: departmentName });
      await fetchDepartments(); // Refresh list
      toast({ title: "Department Updated", description: `Department updated to ${departmentName}.`});
    } catch (error: any) {
      console.error("Error updating department:", error);
      toast({ title: "Error", description: error.message || "Could not update department.", variant: "destructive" });
    }
  };

  const deleteDepartment = async (departmentId: string) => {
    try {
      // TODO: Check if department is in use by users or clubs before deletion.
      // For now, direct delete.
      const deptDocRef = doc(db, "departments", departmentId);
      await deleteDoc(deptDocRef);
      await fetchDepartments(); // Refresh list
      toast({ title: "Department Deleted", description: `Department removed successfully.`});
    } catch (error: any) {
      console.error("Error deleting department:", error);
      toast({ title: "Error", description: error.message || "Could not delete department.", variant: "destructive" });
    }
  };


  // MOCK EVENT FUNCTIONS (to be migrated)
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

  // Deprecated placeholders
  const updateUserClub = async (userId: string, clubId: string | null) => {
    await updateUser({ clubID: clubId || undefined }, userId);
  };
  const addNewOIC = async (fullName: string, email: string): Promise<{success: boolean, message: string}> => {
     const oicProfile: Omit<UserProfile, 'userID' | 'password'> = {
        email,
        fullName,
        role: 'oic',
     };
     const newOicId = await addUser(oicProfile, "password123"); // Using a default password
     if (newOicId) {
        return { success: true, message: "New OIC added." };
     }
     return { success: false, message: "Failed to add OIC." };
  };


  return (
    <AuthContext.Provider value={{
        user,
        loading,
        login,
        logout,
        registerStudent,
        allUsers,
        updateUser,
        addUser,
        deleteUserAuth,
        deleteUserProfile,
        changePassword,
        fetchUsers,
        // Departments
        allDepartments,
        fetchDepartments,
        addDepartment,
        updateDepartment,
        deleteDepartment,
        // Clubs (still mock)
        allClubs,
        // Events (still mock)
        allEvents,
        addEvent,
        updateEvent,
        deleteEvent,
        // Deprecated
        updateUserClub,
        addNewOIC,
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

// export const PredefinedDepartments = defaultDepartments; // No longer exporting mock
export const PredefinedClubs = defaultClubs; // Still exporting mock clubs

    