
"use client";

import type { UserRole, UserProfile, Department, Club, Event, AttendanceRecord, ClearanceRequest, ApprovalStatus } from '@/types/user';
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
  writeBatch,
  Timestamp,
  serverTimestamp,
  QuerySnapshot,
  DocumentData,
  orderBy,
  limit,
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
  fetchEvents: () => Promise<void>;
  addEventToFirestore: (eventData: Omit<Event, 'id'>) => Promise<string | null>;
  updateEventInFirestore: (eventId: string, eventData: Omit<Event, 'id'>) => Promise<void>;
  deleteEventFromFirestore: (eventId: string) => Promise<void>;

  updateUserClub: (userId: string, clubId: string | null) => void;
  addNewOIC: (fullName: string, email: string) => Promise<{success: boolean, message: string}>;

  // Attendance
  currentEventAttendance: AttendanceRecord[];
  fetchAttendanceRecordsForEvent: (eventId: string) => Promise<void>;
  addAttendanceRecord: (recordData: Omit<AttendanceRecord, 'id'>) => Promise<string | null>;
  updateAttendanceRecord: (recordId: string, updates: Partial<AttendanceRecord>) => Promise<void>;
  findStudentEventAttendance: (studentUserID: string, eventID: string) => Promise<AttendanceRecord | null>;

  // Clearance
  studentClearanceRequest: ClearanceRequest | null;
  allClearanceRequests: ClearanceRequest[];
  initiateClearanceRequest: () => Promise<void>;
  fetchStudentClearanceRequest: (studentId: string) => Promise<void>;
  fetchAllClearanceRequests: () => Promise<void>;
  updateSsgClearanceStatus: (requestId: string, status: ApprovalStatus, approverId: string, notes?: string) => Promise<void>;
  updateClubClearanceStatus: (requestId: string, status: ApprovalStatus, approverId: string, notes?: string) => Promise<void>;
  updateDepartmentClearanceStatus: (requestId: string, status: ApprovalStatus, approverId: string, notes?: string) => Promise<void>;

}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [allUsers, setAllUsers] = useState<UserProfile[]>([]);
  const [allDepartments, setAllDepartments] = useState<Department[]>([]);
  const [allClubs, setAllClubs] = useState<Club[]>([]);
  const [allEvents, setAllEvents] = useState<Event[]>([]);
  const [currentEventAttendance, setCurrentEventAttendance] = useState<AttendanceRecord[]>([]);
  const [studentClearanceRequest, setStudentClearanceRequest] = useState<ClearanceRequest | null>(null);
  const [allClearanceRequests, setAllClearanceRequests] = useState<ClearanceRequest[]>([]);

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

  const fetchEvents = async () => {
    try {
      const eventsCollectionRef = collection(db, "events");
      const q = query(eventsCollectionRef, orderBy("date", "desc"));
      const querySnapshot = await getDocs(q);
      const eventsList = querySnapshot.docs.map(docSnap => ({
        id: docSnap.id,
        ...docSnap.data()
      } as Event));
      setAllEvents(eventsList);
    } catch (error) {
      console.error("Error fetching events:", error);
      toast({ title: "Error loading events", description: (error as Error).message || "Could not load event data.", variant: "destructive" });
    }
  };


  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const userDocRef = doc(db, 'users', firebaseUser.uid);
          const userDocSnap = await getDoc(userDocRef);
          if (userDocSnap.exists()) {
            const userData = { userID: firebaseUser.uid, ...userDocSnap.data() } as UserProfile;
            setUser(userData);
            if (userData.role === 'student') {
              fetchStudentClearanceRequest(userData.userID);
            } else if (userData.role === 'ssg_admin') {
              fetchAllClearanceRequests();
            }
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
        setStudentClearanceRequest(null);
        setAllClearanceRequests([]);
      }
      setLoading(false);
    });

    fetchUsers();
    fetchDepartments();
    fetchClubs();
    fetchEvents();

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
      
      const dataForFirestore: Omit<UserProfile, 'password'> = {
        userID: firebaseUser.uid,
        email,
        fullName,
        role: 'student',
        departmentID: departmentId,
        qrCodeID: 'qr-' + firebaseUser.uid.substring(0,8) + Date.now().toString().slice(-4),
        points: 0,
      };

      await setDoc(doc(db, 'users', firebaseUser.uid), dataForFirestore);
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
      setAllEvents([]);
      setCurrentEventAttendance([]);
      setStudentClearanceRequest(null);
      setAllClearanceRequests([]);
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

      const finalUpdates: Partial<UserProfile> = { ...safeUpdates };
      
      if (safeUpdates.clubID === "" || safeUpdates.clubID === null) finalUpdates.clubID = undefined;
      else if (safeUpdates.clubID) finalUpdates.clubID = safeUpdates.clubID;
      else delete finalUpdates.clubID;

      if (safeUpdates.departmentID === "" || safeUpdates.departmentID === null) finalUpdates.departmentID = undefined;
      else if (safeUpdates.departmentID) finalUpdates.departmentID = safeUpdates.departmentID;
      else delete finalUpdates.departmentID;
      
      if (safeUpdates.assignedClubId === "" || safeUpdates.assignedClubId === null) finalUpdates.assignedClubId = undefined;
      else if (safeUpdates.assignedClubId) finalUpdates.assignedClubId = safeUpdates.assignedClubId;
      else delete finalUpdates.assignedClubId;

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
    const adminEmail = user?.email; 
    const adminPasswordAttempt = user?.password; 


    try {
      const tempUserCredential = await createUserWithEmailAndPassword(auth, newUserProfileData.email, password);
      createdAuthUserUid = tempUserCredential.user.uid;

      const dataForFirestore: Partial<UserProfile> & { userID: string; email: string; fullName: string; role: UserRole } = {
        userID: createdAuthUserUid,
        email: newUserProfileData.email,
        fullName: newUserProfileData.fullName,
        role: newUserProfileData.role,
      };

      if (newUserProfileData.departmentID && newUserProfileData.departmentID.trim() !== "") {
        dataForFirestore.departmentID = newUserProfileData.departmentID;
      }
      if (newUserProfileData.clubID && newUserProfileData.clubID.trim() !== "") {
        dataForFirestore.clubID = newUserProfileData.clubID;
      }
      if (newUserProfileData.assignedClubId && newUserProfileData.assignedClubId.trim() !== "") {
        dataForFirestore.assignedClubId = newUserProfileData.assignedClubId;
      }

      if (newUserProfileData.role === 'student') {
        dataForFirestore.qrCodeID = 'qr-' + createdAuthUserUid.substring(0,8) + Date.now().toString().slice(-4);
        dataForFirestore.points = 0;
      }


      await setDoc(doc(db, 'users', createdAuthUserUid), dataForFirestore);

      if (currentAuthUser && adminEmail && adminPasswordAttempt) { // Re-authenticate admin
        await signOut(auth); 
        try {
            await signInWithEmailAndPassword(auth, adminEmail, adminPasswordAttempt);
            // Re-fetch admin's profile if necessary, or rely on onAuthStateChanged
        } catch (reauthError) {
            console.warn("Admin re-authentication failed after creating user. Admin may need to log in again.", reauthError);
            // Optionally force admin to login page
            // router.push('/login'); 
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
      if (!auth.currentUser && currentAuthUser && adminEmail && adminPasswordAttempt) { // Final re-auth attempt
        try {
            await signInWithEmailAndPassword(auth, adminEmail, adminPasswordAttempt);
        } catch (finalReauthError) {
            console.warn("Final admin re-authentication attempt failed.", finalReauthError);
        }
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
      if (user && user.userID === firebaseUser.uid) {
        // Note: Storing password in user state is not recommended for security.
        // This is a placeholder for if you were directly managing it, which we are not.
        // setUser(prev => prev ? ({...prev, password: newPassword}) : null);
      }
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
      } else {
        dataToSave.description = undefined;
      }
      if (clubData.departmentId && clubData.departmentId.trim() !== "") {
        dataToSave.departmentId = clubData.departmentId;
      } else {
        dataToSave.departmentId = undefined;
      }

      const docRef = await addDoc(clubColRef, dataToSave);
      await fetchClubs();
      toast({ title: "Club Added", description: `${clubData.name} created successfully.`});
      return docRef.id;
    } catch (error: any) {
      console.error("Error adding club to Firestore:", error);
      toast({ title: "Error Adding Club", description: `Failed to save club: ${(error as Error).message || "Unknown Firestore error."}`, variant: "destructive" });
      return null;
    }
  };

  const updateClub = async (clubId: string, clubData: Omit<Club, 'id'>) => {
    try {
      const clubDocRef = doc(db, "clubs", clubId);
      const dataToUpdate: Partial<Club> = { name: clubData.name };
       if (clubData.description && clubData.description.trim() !== "") {
        dataToUpdate.description = clubData.description;
      } else {
        dataToUpdate.description = undefined; 
      }
      if (clubData.departmentId && clubData.departmentId.trim() !== "") {
        dataToUpdate.departmentId = clubData.departmentId;
      } else {
        dataToUpdate.departmentId = undefined; 
      }

      await updateDoc(clubDocRef, dataToUpdate);
      await fetchClubs();
      toast({ title: "Club Updated", description: `${clubData.name} updated successfully.`});
    } catch (error: any) {
      console.error("Error updating club:", error);
      toast({ title: "Error Updating Club", description: (error as Error).message || "Could not update club.", variant: "destructive" });
    }
  };

  const deleteClub = async (clubId: string) => {
    try {
      const batch = writeBatch(db);
      const usersToUpdateQuery = query(collection(db, "users"), where("clubID", "==", clubId));
      const usersSnapshot = await getDocs(usersToUpdateQuery);
      usersSnapshot.docs.forEach(userDoc => batch.update(userDoc.ref, { clubID: undefined }));

      const oicsToUpdateQuery = query(collection(db, "users"), where("assignedClubId", "==", clubId));
      const oicsSnapshot = await getDocs(oicsToUpdateQuery);
      oicsSnapshot.docs.forEach(userDoc => batch.update(userDoc.ref, { assignedClubId: undefined }));

      const clubDocRef = doc(db, "clubs", clubId);
      batch.delete(clubDocRef);

      await batch.commit();

      await fetchClubs();
      await fetchUsers();
      toast({ title: "Club Deleted", description: `Club removed successfully.`});
    } catch (error: any) {
      console.error("Error deleting club:", error);
      toast({ title: "Error Deleting Club", description: (error as Error).message || "Could not delete club.", variant: "destructive" });
    }
  };

  const addEventToFirestore = async (eventData: Omit<Event, 'id'>): Promise<string | null> => {
    try {
      const eventColRef = collection(db, "events");
      const docRef = await addDoc(eventColRef, eventData);
      await fetchEvents();
      toast({ title: "Event Added", description: `${eventData.name} created successfully.`});
      return docRef.id;
    } catch (error: any) {
      console.error("Error adding event to Firestore:", error);
      toast({ title: "Error Adding Event", description: `Failed to save event: ${(error as Error).message || "Unknown Firestore error."}`, variant: "destructive" });
      return null;
    }
  };

  const updateEventInFirestore = async (eventId: string, eventData: Omit<Event, 'id'>) => {
    try {
      const eventDocRef = doc(db, "events", eventId);
      await updateDoc(eventDocRef, eventData);
      await fetchEvents();
      toast({ title: "Event Updated", description: `${eventData.name} updated successfully.`});
    } catch (error: any) {
      console.error("Error updating event:", error);
      toast({ title: "Error Updating Event", description: (error as Error).message || "Could not update event.", variant: "destructive" });
    }
  };

  const deleteEventFromFirestore = async (eventId: string) => {
    try {
      const eventDocRef = doc(db, "events", eventId);
      await deleteDoc(eventDocRef);
      await fetchEvents();
      toast({ title: "Event Deleted", description: `Event removed successfully.`});
    } catch (error: any) {
      console.error("Error deleting event:", error);
      toast({ title: "Error Deleting Event", description: (error as Error).message || "Could not delete event.", variant: "destructive" });
    }
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

  const fetchAttendanceRecordsForEvent = async (eventId: string) => {
    if (!eventId) {
      setCurrentEventAttendance([]);
      return;
    }
    try {
      const attendanceQuery = query(
        collection(db, "attendanceRecords"),
        where("eventID", "==", eventId),
        orderBy("timestamp", "asc") 
      );
      const querySnapshot = await getDocs(attendanceQuery);
      const records = querySnapshot.docs.map(docSnap => ({
        id: docSnap.id,
        ...docSnap.data()
      } as AttendanceRecord));
      setCurrentEventAttendance(records);
    } catch (error) {
      console.error("Error fetching attendance records for event:", eventId, error);
      toast({ title: "Attendance Error", description: (error as Error).message || "Could not fetch attendance records.", variant: "destructive" });
      setCurrentEventAttendance([]);
    }
  };


  const addAttendanceRecord = async (recordData: Omit<AttendanceRecord, 'id'>): Promise<string | null> => {
    try {
      const attendanceColRef = collection(db, "attendanceRecords");
      const docRef = await addDoc(attendanceColRef, {
        ...recordData,
        timestamp: serverTimestamp() 
      });
      toast({ title: "Attendance Recorded", description: `Student ${recordData.studentUserID} marked ${recordData.status}.`});
      if (recordData.eventID === (allEvents.find(e => e.id === recordData.eventID)?.id)) { 
         await fetchAttendanceRecordsForEvent(recordData.eventID);
      }
      return docRef.id;
    } catch (error: any) {
      console.error("Error adding attendance record:", error);
      toast({ title: "Attendance Error", description: (error as Error).message || "Could not record attendance.", variant: "destructive" });
      return null;
    }
  };

  const updateAttendanceRecord = async (recordId: string, updates: Partial<AttendanceRecord>) => {
    try {
      const attendanceDocRef = doc(db, "attendanceRecords", recordId);
      await updateDoc(attendanceDocRef, {
        ...updates,
        timestamp: serverTimestamp() 
      });
      toast({ title: "Attendance Updated", description: `Record ${recordId} updated.`});
      if (updates.eventID) { 
        await fetchAttendanceRecordsForEvent(updates.eventID);
      }
    } catch (error: any) {
      console.error("Error updating attendance record:", error);
      toast({ title: "Attendance Error", description: (error as Error).message || "Could not update attendance.", variant: "destructive" });
    }
  };

  const findStudentEventAttendance = async (studentUserID: string, eventID: string): Promise<AttendanceRecord | null> => {
    try {
      const q = query(
        collection(db, "attendanceRecords"),
        where("studentUserID", "==", studentUserID),
        where("eventID", "==", eventID),
        limit(1)
      );
      const querySnapshot: QuerySnapshot<DocumentData> = await getDocs(q);
      if (!querySnapshot.empty) {
        const docSnap = querySnapshot.docs[0];
        return { id: docSnap.id, ...docSnap.data() } as AttendanceRecord;
      }
      return null;
    } catch (error) {
      console.error("Error finding attendance record:", error);
      toast({ title: "Attendance Error", description: (error as Error).message || "Could not find attendance record.", variant: "destructive" });
      return null;
    }
  };

  // --- Clearance Request Functions ---
  const initiateClearanceRequest = async () => {
    if (!user || user.role !== 'student') {
      toast({ title: "Error", description: "Only students can initiate clearance requests.", variant: "destructive" });
      return;
    }
    if (studentClearanceRequest && studentClearanceRequest.overallStatus !== 'Rejected' && studentClearanceRequest.overallStatus !== 'Not Requested') {
        toast({ title: "Info", description: "You already have an active or completed clearance request.", variant: "default" });
        return;
    }

    const studentDept = allDepartments.find(d => d.id === user.departmentID);
    const studentClub = user.clubID ? allClubs.find(c => c.id === user.clubID) : null;

    const newRequestData: Omit<ClearanceRequest, 'id'> = {
      studentUserID: user.userID,
      studentFullName: user.fullName,
      studentDepartmentName: studentDept?.name || 'N/A',
      studentClubName: studentClub?.name || undefined,
      requestedDate: serverTimestamp(),
      clubIdAtRequest: user.clubID || undefined,
      departmentIdAtRequest: user.departmentID!,
      clubApprovalStatus: user.clubID ? 'pending' : 'not_applicable',
      departmentApprovalStatus: 'pending',
      ssgStatus: 'pending',
      overallStatus: 'Pending',
    };

    try {
      const docRef = await addDoc(collection(db, "clearanceRequests"), newRequestData);
      setStudentClearanceRequest({ ...newRequestData, id: docRef.id, requestedDate: new Date() }); // Optimistic update
      toast({ title: "Success", description: "Clearance request initiated." });
    } catch (error: any) {
      console.error("Error initiating clearance request:", error);
      toast({ title: "Error", description: error.message || "Could not initiate clearance request.", variant: "destructive" });
    }
  };

  const fetchStudentClearanceRequest = async (studentId: string) => {
    try {
      const q = query(
        collection(db, "clearanceRequests"),
        where("studentUserID", "==", studentId),
        orderBy("requestedDate", "desc"),
        limit(1)
      );
      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
        const docSnap = querySnapshot.docs[0];
        const requestData = { id: docSnap.id, ...docSnap.data() } as ClearanceRequest;
        // Convert Firestore Timestamps to JS Date objects if necessary
        if (requestData.requestedDate && requestData.requestedDate.toDate) {
            requestData.requestedDate = requestData.requestedDate.toDate().toLocaleDateString();
        }
        setStudentClearanceRequest(requestData);
      } else {
        setStudentClearanceRequest(null);
      }
    } catch (error) {
      console.error("Error fetching student clearance request:", error);
      setStudentClearanceRequest(null);
    }
  };
  
  const fetchAllClearanceRequests = async () => {
    try {
      const q = query(collection(db, "clearanceRequests"), orderBy("requestedDate", "desc"));
      const querySnapshot = await getDocs(q);
      const requests = querySnapshot.docs.map(docSnap => {
        const data = docSnap.data() as Omit<ClearanceRequest, 'id'>;
        return {
            id: docSnap.id,
            ...data,
            requestedDate: data.requestedDate && (data.requestedDate as Timestamp).toDate ? (data.requestedDate as Timestamp).toDate().toLocaleDateString() : String(data.requestedDate)
        } as ClearanceRequest;
      });
      setAllClearanceRequests(requests);
    } catch (error) {
      console.error("Error fetching all clearance requests:", error);
      toast({ title: "Error", description: (error as Error).message || "Could not fetch clearance requests.", variant: "destructive" });
    }
  };

  const updateClearanceStageStatus = async (
    requestId: string,
    stage: 'club' | 'department' | 'ssg',
    status: ApprovalStatus,
    approverId: string,
    notes?: string
  ) => {
    if (!user) return;
    const clearanceDocRef = doc(db, "clearanceRequests", requestId);
    const updates: Partial<ClearanceRequest> = {
        [`${stage}ApprovalStatus`]: status,
        [`${stage}ApproverID`]: approverId,
        [`${stage}ApprovalDate`]: serverTimestamp(),
        [`${stage}ApprovalNotes`]: notes || undefined, // Use undefined to remove field if notes are empty
    };

    // Logic to determine overall status
    const currentRequest = allClearanceRequests.find(r => r.id === requestId) || 
                           (studentClearanceRequest?.id === requestId ? studentClearanceRequest : null);

    if (currentRequest) {
        const tempUpdatedRequest = { ...currentRequest, ...updates };
        let overall: ClearanceRequest['overallStatus'] = 'Pending';
        if (status === 'rejected') {
            overall = 'Rejected';
            updates.ssgStatus = 'rejected'; // If any stage rejects, SSG is implicitly rejected
        } else if (
            (tempUpdatedRequest.clubApprovalStatus === 'approved' || tempUpdatedRequest.clubApprovalStatus === 'not_applicable') &&
            tempUpdatedRequest.departmentApprovalStatus === 'approved' &&
            (stage === 'ssg' && status === 'approved') // Only if SSG is approving now
        ) {
            overall = 'Approved';
            updates.unifiedClearanceID = `UC-${new Date().getFullYear()}-${requestId.substring(0, 4)}`;
        } else if (
            (tempUpdatedRequest.clubApprovalStatus === 'approved' || tempUpdatedRequest.clubApprovalStatus === 'not_applicable') &&
            tempUpdatedRequest.departmentApprovalStatus === 'approved' &&
            tempUpdatedRequest.ssgStatus === 'approved' // if SSG was already approved (e.g. an earlier stage is re-approved)
        ) {
             overall = 'Approved'; // Stays approved
        }
        updates.overallStatus = overall;
    }


    try {
        await updateDoc(clearanceDocRef, updates as DocumentData); // Cast to DocumentData for Firestore
        toast({ title: "Success", description: `Clearance request ${stage} stage updated to ${status}.` });
        if (user.role === 'student') {
            await fetchStudentClearanceRequest(user.userID);
        } else {
            await fetchAllClearanceRequests(); // For admins
        }
    } catch (error: any) {
        console.error(`Error updating ${stage} clearance status:`, error);
        toast({ title: "Error", description: error.message || `Could not update ${stage} clearance status.`, variant: "destructive" });
    }
  };

  const updateSsgClearanceStatus = (requestId: string, status: ApprovalStatus, approverId: string, notes?: string) => {
      return updateClearanceStageStatus(requestId, 'ssg', status, approverId, notes);
  };
  const updateClubClearanceStatus = (requestId: string, status: ApprovalStatus, approverId: string, notes?: string) => {
      return updateClearanceStageStatus(requestId, 'club', status, approverId, notes);
  };
  const updateDepartmentClearanceStatus = (requestId: string, status: ApprovalStatus, approverId: string, notes?: string) => {
      return updateClearanceStageStatus(requestId, 'department', status, approverId, notes);
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
        fetchEvents,
        addEventToFirestore,
        updateEventInFirestore,
        deleteEventFromFirestore,
        updateUserClub,
        addNewOIC,
        currentEventAttendance,
        fetchAttendanceRecordsForEvent,
        addAttendanceRecord,
        updateAttendanceRecord,
        findStudentEventAttendance,
        studentClearanceRequest,
        allClearanceRequests,
        initiateClearanceRequest,
        fetchStudentClearanceRequest,
        fetchAllClearanceRequests,
        updateSsgClearanceStatus,
        updateClubClearanceStatus,
        updateDepartmentClearanceStatus,
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

