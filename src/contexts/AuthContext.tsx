
"use client";

import type { UserRole, UserProfile, Department, Club, Event } from '@/types/user';
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { auth, db } from '@/lib/firebase'; // Import Firebase instances
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  updatePassword as firebaseUpdatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider
} from 'firebase/auth';
import { doc, setDoc, getDoc, updateDoc, deleteDoc, collection, getDocs, query, where } from 'firebase/firestore';

interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  login: (email: string, passwordAttempt: string) => Promise<void>;
  logout: () => Promise<void>;
  registerStudent: (fullName: string, email: string, departmentId: string, passwordAttempt: string) => Promise<void>;
  allUsers: UserProfile[]; 
  updateUser: (updatedProfileData: Partial<UserProfile>, userId: string) => Promise<void>; 
  addUser: (newUserProfileData: Omit<UserProfile, 'userID' | 'password'>, password?: string) => Promise<string | null>; // Returns new userID or null
  deleteUserAuth: (userId: string) => Promise<{success: boolean, message: string}>; // Deletes from Firebase Auth
  deleteUserProfile: (userId: string) => Promise<void>; // Deletes from Firestore
  changePassword: (currentPasswordAttempt: string, newPassword: string) => Promise<{ success: boolean, message: string }>;
  fetchUsers: () => Promise<void>; // To refresh allUsers state
  // These will remain mock for now, to be migrated later
  allClubs: Club[];
  allDepartments: Department[];
  allEvents: Event[];
  addEvent: (newEvent: Event) => void;
  updateEvent: (updatedEvent: Event) => void;
  deleteEvent: (eventId: string) => void;
  updateUserClub: (userId: string, clubId: string | null) => void; // Will be part of updateUser
  addNewOIC: (fullName: string, email: string) => Promise<{success: boolean, message: string}>; // Will use addUser
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Default departments and clubs remain for selection UI and structure, not users.
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

const initialMockEvents: Event[] = []; // Events will also be migrated later

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [allUsers, setAllUsers] = useState<UserProfile[]>([]); // Populated from Firestore
  const [allEvents, setAllEvents] = useState<Event[]>(initialMockEvents); // Mock for now
  const router = useRouter();
  const pathname = usePathname();
  const { toast } = useToast();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const userDocRef = doc(db, 'users', firebaseUser.uid);
          const userDocSnap = await getDoc(userDocRef);
          if (userDocSnap.exists()) {
            setUser({ userID: firebaseUser.uid, ...userDocSnap.data() } as UserProfile);
          } else {
            // User exists in Auth but not in Firestore users collection. This is an edge case.
            // For now, sign them out. Could also create a default profile or redirect to a setup page.
            console.warn("User exists in Auth, but no profile in Firestore. Logging out.");
            await signOut(auth);
            setUser(null);
          }
        } catch (error) {
            console.error("Error fetching user profile from Firestore:", error);
            setUser(null); // Ensure user is null if profile fetch fails
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    // Fetch all users for admin management (can be optimized later for larger datasets)
    fetchUsers();
    
    // Load events from localStorage or initialize (temporary)
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

  const login = async (email: string, passwordAttempt: string) => {
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, passwordAttempt);
      // onAuthStateChanged will handle setting user and redirecting
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
      // Check if email already exists in Firestore (Auth guards against duplicates too, but this is an extra check for profiles)
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
        qrCodeID: 'qr-' + firebaseUser.uid.substring(0,8) + Date.now().toString().slice(-4), // More unique QR
        points: 0,
        // Password is not stored in Firestore profile
      };
      await setDoc(doc(db, 'users', firebaseUser.uid), newStudentProfile);
      // onAuthStateChanged will set the user, triggering redirect.
      toast({ title: "Registration Successful", description: `Welcome, ${fullName}!` });
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
      // onAuthStateChanged will set user to null and trigger redirect.
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
      // Ensure sensitive fields like userID or role are not directly updatable if they shouldn't be
      const { userID, password, ...safeUpdates } = updatedProfileData; 
      await updateDoc(userDocRef, safeUpdates);
      
      // Refresh allUsers state
      await fetchUsers();

      // If updating the current user, update local user state
      if (user && user.userID === userIdToUpdate) {
        setUser(prev => prev ? ({ ...prev, ...safeUpdates }) : null);
      }
      toast({ title: "Success", description: "User profile updated." });
    } catch (error: any) {
      console.error("Error updating user profile:", error);
      toast({ title: "Error", description: error.message || "Could not update user profile.", variant: "destructive" });
    }
  };

  // For admins creating users
  const addUser = async (newUserProfileData: Omit<UserProfile, 'userID' | 'password'>, password?: string): Promise<string | null> => {
    if (!password) {
      toast({ title: "Error", description: "Password is required for new users.", variant: "destructive" });
      return null;
    }
    
    // Check if email already exists in Firestore
    const usersQuery = query(collection(db, "users"), where("email", "==", newUserProfileData.email));
    const querySnapshot = await getDocs(usersQuery);
    if (!querySnapshot.empty) {
        toast({ title: "Creation Failed", description: "Email already exists in user profiles.", variant: "destructive" });
        return null;
    }

    // Temporary way to create user in Auth - This is not ideal as it signs in the new user for the admin.
    // A proper solution uses Firebase Admin SDK on a backend or Cloud Function.
    // For this client-side prototype, we'll accept this limitation.
    let createdAuthUserUid: string | null = null;
    const currentAuthUser = auth.currentUser; 

    try {
      const tempUserCredential = await createUserWithEmailAndPassword(auth, newUserProfileData.email, password);
      createdAuthUserUid = tempUserCredential.user.uid;

      const finalProfileData: Omit<UserProfile, 'password'> = {
        ...newUserProfileData,
        userID: createdAuthUserUid, // This will be overwritten by Firestore doc ID
        qrCodeID: newUserProfileData.role === 'student' ? 'qr-' + createdAuthUserUid.substring(0,8) + Date.now().toString().slice(-4) : undefined,
        points: newUserProfileData.role === 'student' ? 0 : undefined,
      };
      await setDoc(doc(db, 'users', createdAuthUserUid), finalProfileData);
      
      // Sign back in the original admin user if one was logged in
      if (currentAuthUser && currentAuthUser.email && user?.password) { // Need user's current password to re-login
          // This is a simplified re-login. Real re-auth is more complex.
          // For now, we rely on onAuthStateChanged to eventually pick up the original admin if they re-login manually
          // or if the app navigates in a way that triggers re-auth.
          // A better approach for admin user creation involves backend functions.
          // For now, we'll just proceed. The admin might have to re-login if their session is lost.
          await signOut(auth); // Sign out the newly created user
          // Attempt to re-sign in the admin - this part is tricky client-side
          // For simplicity, we'll assume the admin might need to manually re-login if session is lost
          // or onAuthStateChanged handles it if the admin's token is still valid.
          // The main goal here is that the new user is in Auth and Firestore.
      }
      
      await fetchUsers(); // Refresh list
      toast({ title: "User Created", description: `${newUserProfileData.fullName} added successfully.` });
      return createdAuthUserUid;
    } catch (error: any) {
      console.error("Error creating user (Auth/Firestore):", error);
      toast({ title: "Creation Failed", description: error.message || "Could not create user.", variant: "destructive" });
      // If user was created in Auth but Firestore failed, try to delete from Auth
      if (createdAuthUserUid && error.code !== 'auth/email-already-in-use') {
          // This requires re-authentication of the admin or a backend function. Complex client-side.
          console.warn("User created in Auth but Firestore profile failed. Manual cleanup might be needed in Firebase Auth console.");
      }
      return null;
    }
  };

  // This function is problematic to implement securely on the client-side
  // as deleting other users from Firebase Auth requires admin privileges, typically via Admin SDK.
  // For this prototype, we will only delete the Firestore profile. Auth deletion would need manual console action or a backend.
  const deleteUserAuth = async (userId: string): Promise<{success: boolean, message: string}> => {
    toast({ title: "Action Required", description: "Deleting users from Firebase Authentication must be done via the Firebase Console or a backend function for security reasons in this prototype.", variant: "default" });
    return { success: false, message: "Manual deletion from Firebase Auth required." };
    // Actual client-side deletion is complex and insecure for other users.
    // const userToDelete = auth.currentUser; // This would be the *currently logged in user*
    // if (userToDelete && userToDelete.uid === userId) { ... }
  };
  
  const deleteUserProfile = async (userId: string) => {
    try {
      await deleteDoc(doc(db, 'users', userId));
      await fetchUsers(); // Refresh user list
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
      // Re-authenticate user before changing password for security
      const credential = EmailAuthProvider.credential(firebaseUser.email, currentPasswordAttempt);
      await reauthenticateWithCredential(firebaseUser, credential);
      
      // If re-authentication is successful, update the password
      await firebaseUpdatePassword(firebaseUser, newPassword);
      // Note: We don't store password in Firestore profile, so no Firestore update needed here for the password itself.
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

  // Deprecated placeholders - functionality should be within updateUser or addUser now
  const updateUserClub = async (userId: string, clubId: string | null) => {
    await updateUser({ clubID: clubId || undefined }, userId);
  };
  const addNewOIC = async (fullName: string, email: string): Promise<{success: boolean, message: string}> => {
     const oicProfile: Omit<UserProfile, 'userID' | 'password'> = {
        email,
        fullName,
        role: 'oic',
     };
     const newOicId = await addUser(oicProfile, "password123"); // Using default password
     if (newOicId) {
        return { success: true, message: "New OIC added to Firestore and Auth." };
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
        allClubs: defaultClubs, 
        allDepartments: defaultDepartments, 
        // Mocked event system for now
        allEvents,
        addEvent,
        updateEvent,
        deleteEvent,
        // Deprecated placeholders
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

export const PredefinedDepartments = defaultDepartments;
export const PredefinedClubs = defaultClubs;
