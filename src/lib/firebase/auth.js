import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  sendPasswordResetEmail,
  onAuthStateChanged
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db, useMock } from './client';

// Simple in-memory/localStorage mock store for auth when Firebase config is absent
const MOCK_USERS_KEY = 'pet_mock_users';
const CURRENT_USER_KEY = 'pet_mock_current_user';

// Setup default mock users if empty
if (useMock && typeof window !== 'undefined') {
  if (!localStorage.getItem(MOCK_USERS_KEY)) {
    const defaultUsers = [
      {
        uid: 'admin1',
        email: 'admin@college.edu',
        password: 'password123',
        displayName: 'Dr. Sarah Jenkins',
        role: 'admin'
      },
      {
        uid: 'student1',
        email: 'john.doe@college.edu',
        password: 'password123',
        displayName: 'John Doe',
        role: 'student'
      }
    ];
    localStorage.setItem(MOCK_USERS_KEY, JSON.stringify(defaultUsers));
    
    // Seed default student profiles for the mock
    const defaultStudents = {
      'student1': {
        fullName: 'John Doe',
        rollNumber: 'CS2023001',
        branch: 'CSE',
        cgpa: 8.4,
        activeBacklogs: 0,
        historyOfBacklogs: 0,
        resumeUrl: 'https://example.com/resumes/john_doe.pdf',
        placedStatus: false
      }
    };
    localStorage.setItem('pet_mock_students', JSON.stringify(defaultStudents));
  }
}

export async function loginUser(email, password) {
  if (useMock) {
    const users = JSON.parse(localStorage.getItem(MOCK_USERS_KEY) || '[]');
    const user = users.find(u => u.email === email && u.password === password);
    if (!user) throw new Error("Invalid email or password");
    
    const sessionUser = { uid: user.uid, email: user.email, displayName: user.displayName, role: user.role };
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(sessionUser));
    
    // Trigger window events to notify stores of change
    window.dispatchEvent(new Event('storage'));
    return sessionUser;
  }

  // Real Firebase login
  const credential = await signInWithEmailAndPassword(auth, email, password);
  const userDoc = await getDoc(doc(db, 'users', credential.user.uid));
  if (!userDoc.exists()) {
    throw new Error("User record not found in database");
  }
  return {
    uid: credential.user.uid,
    email: credential.user.email,
    ...userDoc.data()
  };
}

export async function registerUser(email, password, displayName, studentDetails) {
  if (useMock) {
    const users = JSON.parse(localStorage.getItem(MOCK_USERS_KEY) || '[]');
    if (users.find(u => u.email === email)) {
      throw new Error("Email already registered");
    }
    
    const uid = 'mock_uid_' + Math.random().toString(36).substr(2, 9);
    const newUser = { uid, email, password, displayName, role: 'student' };
    users.push(newUser);
    localStorage.setItem(MOCK_USERS_KEY, JSON.stringify(users));
    
    // Update student details
    const students = JSON.parse(localStorage.getItem('pet_mock_students') || '{}');
    students[uid] = {
      fullName: displayName,
      rollNumber: studentDetails.rollNumber || '',
      branch: studentDetails.branch || '',
      cgpa: parseFloat(studentDetails.cgpa || 0),
      activeBacklogs: parseInt(studentDetails.activeBacklogs || 0),
      historyOfBacklogs: parseInt(studentDetails.historyOfBacklogs || 0),
      resumeUrl: studentDetails.resumeUrl || '',
      placedStatus: false
    };
    localStorage.setItem('pet_mock_students', JSON.stringify(students));
    
    const sessionUser = { uid, email, displayName, role: 'student' };
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(sessionUser));
    window.dispatchEvent(new Event('storage'));
    return sessionUser;
  }

  // Real Firebase registration
  const credential = await createUserWithEmailAndPassword(auth, email, password);
  const uid = credential.user.uid;
  
  // Create user entry
  await setDoc(doc(db, 'users', uid), {
    email,
    displayName,
    role: 'student',
    createdAt: new Date()
  });
  
  // Create student entry
  await setDoc(doc(db, 'students', uid), {
    fullName: displayName,
    rollNumber: studentDetails.rollNumber || '',
    branch: studentDetails.branch || '',
    cgpa: parseFloat(studentDetails.cgpa || 0),
    activeBacklogs: parseInt(studentDetails.activeBacklogs || 0),
    historyOfBacklogs: parseInt(studentDetails.historyOfBacklogs || 0),
    resumeUrl: studentDetails.resumeUrl || '',
    placedStatus: false,
    updatedAt: new Date()
  });
  
  return { uid, email, displayName, role: 'student' };
}

export async function logoutUser() {
  if (useMock) {
    localStorage.removeItem(CURRENT_USER_KEY);
    window.dispatchEvent(new Event('storage'));
    return;
  }
  await signOut(auth);
}

export async function resetPassword(email) {
  if (useMock) {
    const users = JSON.parse(localStorage.getItem(MOCK_USERS_KEY) || '[]');
    if (!users.find(u => u.email === email)) {
      throw new Error("No user found with this email");
    }
    return; // Mock reset success
  }
  await sendPasswordResetEmail(auth, email);
}

export function subscribeToAuth(callback) {
  if (useMock) {
    const checkUser = () => {
      const stored = localStorage.getItem(CURRENT_USER_KEY);
      callback(stored ? JSON.parse(stored) : null);
    };
    
    // Check initially
    checkUser();
    
    // Listen for storage events
    if (typeof window !== 'undefined') {
      window.addEventListener('storage', checkUser);
      return () => window.removeEventListener('storage', checkUser);
    }
    return () => {};
  }

  // Real Firebase auth subscription
  return onAuthStateChanged(auth, async (firebaseUser) => {
    if (firebaseUser) {
      try {
        const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
        if (userDoc.exists()) {
          callback({
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            ...userDoc.data()
          });
        } else {
          callback(null);
        }
      } catch (err) {
        console.error("Auth state synchronization error:", err);
        callback(null);
      }
    } else {
      callback(null);
    }
  });
}
