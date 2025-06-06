
"use client";

import type { UserRole, UserProfile, Department, Club, Event } from '@/types/user';
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { auth, db } from '@/lib/firebase'; 
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

  allDepartments: Department[];
  fetchDepartments: () => Promise<void>;
  addDepartment: (departmentName: string) => Promise<string | null>;
  updateDepartment: (departmentId: string, departmentName: string) => Promise<void>;
  deleteDepartment: (departmentId: string) => Promise<void>;

  allClubs: Club[];
  fetchClubs: () => Promise<void>;
  addClub: (clubData: Omit<Club, 'id'>) => Promise<string | null>;
  updateClub: (clubId: string, clubData: Omit<Club, 'id'>) => Promise<void>;
  deleteClub: (clubId: string) => Promise<void>;

  allEvents: Event[];
  addEvent: (newEvent: Event) => void;
  updateEvent: (updatedEvent: Event) => void;
  deleteEvent: (eventId: string) => void;

  updateUserClub: (userId: string, clubId: string | null) => void;
  addNewOIC: (fullName: string, email: string) => Promise<{success: boolean, message: string}>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const initialMockEvents: Event[] = [];

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [allUsers, setAllUsers] = useState<UserProfile[]>([]);
  const [allDepartments, setAllDepartments] = useState<Department[]>([]);
  const [allClubs, setAllClubs] = useState<Club[]>([]);
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

  const fetchClubs = async () => {
    try {
      const clubsCollectionRef = collection(db, "clubs");
      const querySnapshot = await getDocs(clubsCollectionRef);
      const clubsList = querySnapshot.docs.map(docSnap => ({
        id: docSnap.id,
        ...docSnap.data()
      } as Club));
      setAllClubs(clubsList);
    } catch (error) {
      console.error("Error fetching clubs:", error);
      toast({ title: "Error loading clubs", description: (error as Error).message || "Could not load club data.", variant: "destructive" });
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
            setUser(null); 
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    fetchUsers();
    fetchDepartments();
    fetchClubs();

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
            default: router.push('/login'); 
        }
    }
  }, [user, loading, pathname, router]);


  const login = async (email: string, passwordAttempt: string) => {
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, passwordAttempt);
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
        qrCodeID: 'qr-' + firebaseUser.uid.substring(0,8) + Date.now().toString().slice(-4), 
        points: 0,
      };
      await setDoc(doc(db, 'users', firebaseUser.uid), newStudentProfile);
      toast({ title: "Registration Successful", description: `Welcome, ${fullName}!` });
      await fetchUsers(); 
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
      setUser(null); 
      setAllUsers([]); 
      setAllDepartments([]); 
      setAllClubs([]);
      router.push('/login'); 
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
      const { userID, password, ...safeUpdates } = updatedProfileData;
      
      // Sanitize optional fields: if an empty string is passed for an optional ID field, convert to undefined
      const finalUpdates: Partial<UserProfile> = { ...safeUpdates };
      if (safeUpdates.clubID === "") finalUpdates.clubID = undefined;
      if (safeUpdates.departmentID === "") finalUpdates.departmentID = undefined;
      if (safeUpdates.assignedClubId === "") finalUpdates.assignedClubId = undefined;

      await updateDoc(userDocRef, finalUpdates);
      await fetchUsers(); 
      if (user && user.userID === userIdToUpdate) {
        setUser(prev => prev ? ({ ...prev, ...finalUpdates }) : null);
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
    const usersQuery = query(collection(db, "users"), where("email", "==", newUserProfileData.email));
    const querySnapshot = await getDocs(usersQuery);
    if (!querySnapshot.empty) {
        toast({ title: "Creation Failed", description: "Email already exists in user profiles.", variant: "destructive" });
        return null;
    }

    let createdAuthUserUid: string | null = null;
    const currentAuthUser = auth.currentUser; 

    try {
      const tempUserCredential = await createUserWithEmailAndPassword(auth, newUserProfileData.email, password);
      createdAuthUserUid = tempUserCredential.user.uid;

      const finalProfileData: Omit<UserProfile, 'password'> = {
        ...newUserProfileData,
        userID: createdAuthUserUid,
        qrCodeID: newUserProfileData.role === 'student' ? 'qr-' + createdAuthUserUid.substring(0,8) + Date.now().toString().slice(-4) : undefined,
        points: newUserProfileData.role === 'student' ? 0 : undefined,
        departmentID: newUserProfileData.departmentID || undefined,
        clubID: newUserProfileData.clubID || undefined,
        assignedClubId: newUserProfileData.assignedClubId || undefined,
      };
      await setDoc(doc(db, 'users', createdAuthUserUid), finalProfileData);

      if (currentAuthUser && currentAuthUser.email && user?.password) { 
        await signOut(auth); 
        try {
            await signInWithEmailAndPassword(auth, currentAuthUser.email, user.password);
        } catch (reauthError) {
            console.warn("Admin re-authentication failed after creating user. Admin may need to log in again.", reauthError);
        }
      }

      await fetchUsers(); 
      toast({ title: "User Created", description: `${newUserProfileData.fullName} added successfully.` });
      return createdAuthUserUid;
    } catch (error: any) {
      console.error("Error creating user (Auth/Firestore):", error);
      toast({ title: "Creation Failed", description: error.message || "Could not create user.", variant: "destructive" });
      if (createdAuthUserUid && error.code !== 'auth/email-already-in-use') { 
          console.warn("User created in Auth but Firestore profile failed. Manual cleanup might be needed in Firebase Auth console.");
      }
      return null;
    }
  };

  const deleteUserAuth = async (userId: string): Promise<{success: boolean, message: string}> => {
    toast({ title: "Action Required", description: "Deleting users from Firebase Authentication must be done via the Firebase Console or a backend function for security reasons in this prototype.", variant: "default" });
    return { success: false, message: "Manual deletion from Firebase Auth required." };
  };

  const deleteUserProfile = async (userId: string) => {
    try {
      await deleteDoc(doc(db, 'users', userId));
      await fetchUsers(); 
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

  const addDepartment = async (departmentName: string): Promise<string | null> => {
    try {
      const deptColRef = collection(db, "departments");
      const docRef = await addDoc(deptColRef, { name: departmentName });
      await fetchDepartments(); 
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
      await fetchDepartments(); 
      toast({ title: "Department Updated", description: `Department updated to ${departmentName}.`});
    } catch (error: any) {
      console.error("Error updating department:", error);
      toast({ title: "Error", description: error.message || "Could not update department.", variant: "destructive" });
    }
  };

  const deleteDepartment = async (departmentId: string) => {
    try {
      const deptDocRef = doc(db, "departments", departmentId);
      await deleteDoc(deptDocRef);
      await fetchDepartments(); 
      toast({ title: "Department Deleted", description: `Department removed successfully.`});
    } catch (error: any) {
      console.error("Error deleting department:", error);
      toast({ title: "Error", description: error.message || "Could not delete department.", variant: "destructive" });
    }
  };

  const addClub = async (clubData: Omit<Club, 'id'>): Promise<string | null> => {
    try {
      const clubColRef = collection(db, "clubs");
      const dataToSave: { name: string; description?: string; departmentId?: string } = {
        name: clubData.name,
      };
      if (clubData.description && clubData.description.trim() !== "") {
        dataToSave.description = clubData.description;
      }
      if (clubData.departmentId && clubData.departmentId.trim() !== "") {
        dataToSave.departmentId = clubData.departmentId;
      }

      const docRef = await addDoc(clubColRef, dataToSave);
      await fetchClubs(); 
      toast({ title: "Club Added", description: `${clubData.name} created successfully.`});
      return docRef.id;
    } catch (error: any) {
      console.error("Error adding club to Firestore:", error); 
      toast({ title: "Error Adding Club", description: `Failed to save club: ${error.message || "Unknown Firestore error."}`, variant: "destructive" });
      return null;
    }
  };

  const updateClub = async (clubId: string, clubData: Omit<Club, 'id'>) => {
    try {
      const clubDocRef = doc(db, "clubs", clubId);
      const dataToUpdate: { name: string; description?: string; departmentId?: string } = {
        name: clubData.name,
      };
      if (clubData.description && clubData.description.trim() !== "") {
        dataToUpdate.description = clubData.description;
      } else {
        dataToUpdate.description = undefined; // Explicitly set to undefined to remove if empty
      }
      if (clubData.departmentId && clubData.departmentId.trim() !== "") {
        dataToUpdate.departmentId = clubData.departmentId;
      } else {
        dataToUpdate.departmentId = undefined; // Explicitly set to undefined to remove if empty
      }
      await updateDoc(clubDocRef, dataToUpdate);
      await fetchClubs(); 
      toast({ title: "Club Updated", description: `${clubData.name} updated successfully.`});
    } catch (error: any) {
      console.error("Error updating club:", error);
      toast({ title: "Error Updating Club", description: error.message || "Could not update club.", variant: "destructive" });
    }
  };

  const deleteClub = async (clubId: string) => {
    try {
      // Before deleting a club, unassign it from any users (club admins or members)
      const usersToUpdateQuery = query(collection(db, "users"), where("clubID", "==", clubId));
      const usersSnapshot = await getDocs(usersToUpdateQuery);
      const batchUpdates = usersSnapshot.docs.map(userDoc => updateDoc(userDoc.ref, { clubID: undefined }));
      await Promise.all(batchUpdates);

      // Unassign from OICs if assignedClubId matches
      const oicsToUpdateQuery = query(collection(db, "users"), where("assignedClubId", "==", clubId));
      const oicsSnapshot = await getDocs(oicsToUpdateQuery);
      const oicBatchUpdates = oicsSnapshot.docs.map(userDoc => updateDoc(userDoc.ref, { assignedClubId: undefined }));
      await Promise.all(oicBatchUpdates);


      const clubDocRef = doc(db, "clubs", clubId);
      await deleteDoc(clubDocRef);
      
      await fetchClubs(); 
      await fetchUsers(); // Refresh users as their clubID might have changed
      toast({ title: "Club Deleted", description: `Club removed successfully.`});
    } catch (error: any) {
      console.error("Error deleting club:", error);
      toast({ title: "Error Deleting Club", description: error.message || "Could not delete club.", variant: "destructive" });
    }
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

  const updateUserClub = async (userId: string, clubId: string | null) => {
    await updateUser({ clubID: clubId || undefined }, userId);
  };
  const addNewOIC = async (fullName: string, email: string): Promise<{success: boolean, message: string}> => {
     const oicProfile: Omit<UserProfile, 'userID' | 'password'> = {
        email,
        fullName,
        role: 'oic',
     };
     const newOicId = await addUser(oicProfile, "password123"); 
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
        allDepartments,
        fetchDepartments,
        addDepartment,
        updateDepartment,
        deleteDepartment,
        allClubs,
        fetchClubs,
        addClub,
        updateClub,
        deleteClub,
        allEvents,
        addEvent,
        updateEvent,
        deleteEvent,
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

export const PredefinedClubs = []; // Removed mock data
