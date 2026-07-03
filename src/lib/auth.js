import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut,
  onAuthStateChanged
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db, useMock } from './firebase';

const MOCK_USERS_KEY = 'pet_users';
const CURRENT_USER_KEY = 'pet_current_user';

// Helper to seed mock database
function initMockDb() {
  if (typeof window === 'undefined') return;
  
  if (!localStorage.getItem(MOCK_USERS_KEY)) {
    const defaultUsers = [
      {
        uid: 'mock_admin_1',
        email: 'admin@college.edu',
        password: 'password123',
        name: 'Dr. Sarah Jenkins',
        role: 'admin',
        department: 'Placement Cell',
        cgpa: 0,
        arrears: 0,
        skills: [],
        createdAt: new Date().toISOString()
      },
      {
        uid: 'mock_student_1',
        email: 'student@college.edu',
        password: 'password123',
        name: 'John Doe',
        role: 'student',
        department: 'Computer Science',
        cgpa: 8.5,
        arrears: 0,
        skills: ['React', 'Node.js', 'Python'],
        createdAt: new Date().toISOString()
      },
      {
        uid: 'mock_student_2',
        email: 'student2@college.edu',
        password: 'password123',
        name: 'Jane Smith',
        role: 'student',
        department: 'Information Technology',
        cgpa: 7.2,
        arrears: 2,
        skills: ['Java', 'SQL'],
        createdAt: new Date().toISOString()
      }
    ];
    localStorage.setItem(MOCK_USERS_KEY, JSON.stringify(defaultUsers));
  }
}

// Run initialization
if (useMock) {
  initMockDb();
}

/**
 * Register a new user
 */
export async function register(email, password, name, role = 'student', department = '', cgpa = 0, arrears = 0, skills = []) {
  const cgpaNum = parseFloat(cgpa) || 0;
  const arrearsNum = parseInt(arrears) || 0;
  const skillsArr = Array.isArray(skills) ? skills : (skills ? skills.split(',').map(s => s.trim()).filter(Boolean) : []);

  if (useMock) {
    const users = JSON.parse(localStorage.getItem(MOCK_USERS_KEY) || '[]');
    if (users.some(u => u.email.toLowerCase() === email.toLowerCase())) {
      throw new Error("Email already registered");
    }
    
    const uid = 'mock_' + Math.random().toString(36).substr(2, 9);
    const newUser = {
      uid,
      email,
      password, // Stored in plain text only for mock purposes
      name,
      role,
      department,
      cgpa: cgpaNum,
      arrears: arrearsNum,
      skills: skillsArr,
      createdAt: new Date().toISOString()
    };
    
    users.push(newUser);
    localStorage.setItem(MOCK_USERS_KEY, JSON.stringify(users));
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(newUser));
    
    // Dispatch event to sync state across tabs/stores
    window.dispatchEvent(new Event('storage'));
    return newUser;
  }

  // Real Firebase Registration
  const credential = await createUserWithEmailAndPassword(auth, email, password);
  const uid = credential.user.uid;
  
  const userData = {
    uid,
    name,
    email,
    role,
    department,
    cgpa: cgpaNum,
    arrears: arrearsNum,
    skills: skillsArr,
    createdAt: new Date().toISOString()
  };

  await setDoc(doc(db, 'users', uid), userData);
  return userData;
}

/**
 * Log in an existing user
 */
export async function login(email, password) {
  if (useMock) {
    const users = JSON.parse(localStorage.getItem(MOCK_USERS_KEY) || '[]');
    const user = users.find(u => u.email.toLowerCase() === email.toLowerCase() && u.password === password);
    if (!user) {
      throw new Error("Invalid email or password");
    }
    
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
    window.dispatchEvent(new Event('storage'));
    return user;
  }

  // Real Firebase Login
  const credential = await signInWithEmailAndPassword(auth, email, password);
  const uid = credential.user.uid;
  const userDoc = await getDoc(doc(db, 'users', uid));
  if (!userDoc.exists()) {
    throw new Error("User profile not found in Firestore.");
  }
  return {
    uid,
    ...userDoc.data()
  };
}

/**
 * Log out the current user
 */
export async function logout() {
  if (useMock) {
    localStorage.removeItem(CURRENT_USER_KEY);
    window.dispatchEvent(new Event('storage'));
    return;
  }
  await signOut(auth);
}

/**
 * Get current user details
 */
export function getCurrentUser() {
  if (useMock) {
    if (typeof window === 'undefined') return Promise.resolve(null);
    const stored = localStorage.getItem(CURRENT_USER_KEY);
    return Promise.resolve(stored ? JSON.parse(stored) : null);
  }

  return new Promise((resolve, reject) => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      unsubscribe();
      if (firebaseUser) {
        try {
          const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
          if (userDoc.exists()) {
            resolve({
              uid: firebaseUser.uid,
              ...userDoc.data()
            });
          } else {
            resolve(null);
          }
        } catch (err) {
          reject(err);
        }
      } else {
        resolve(null);
      }
    }, reject);
  });
}
