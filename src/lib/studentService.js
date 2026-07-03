import { 
  collection, 
  getDocs, 
  getDoc,
  doc, 
  updateDoc, 
  setDoc,
  query, 
  where 
} from 'firebase/firestore';
import { db, useMock } from './firebase';

const MOCK_USERS_KEY = 'pet_users';

/**
 * Add a student (usually done during registration, but available as service helper)
 */
export async function addStudent(student) {
  const formattedStudent = {
    uid: student.uid || 'mock_' + Math.random().toString(36).substr(2, 9),
    name: student.name || "",
    email: student.email || "",
    role: 'student',
    department: student.department || "",
    cgpa: parseFloat(student.cgpa) || 0,
    arrears: parseInt(student.arrears) || 0,
    skills: Array.isArray(student.skills) 
      ? student.skills 
      : (student.skills ? student.skills.split(',').map(s => s.trim()).filter(Boolean) : []),
    createdAt: new Date().toISOString()
  };

  if (useMock) {
    const users = JSON.parse(localStorage.getItem(MOCK_USERS_KEY) || '[]');
    users.push(formattedStudent);
    localStorage.setItem(MOCK_USERS_KEY, JSON.stringify(users));
    window.dispatchEvent(new Event('storage'));
    return formattedStudent.uid;
  }

  // Real Firestore add
  await setDoc(doc(db, 'users', formattedStudent.uid), formattedStudent);
  return formattedStudent.uid;
}

/**
 * Get all students (role === 'student')
 */
export async function getStudents() {
  if (useMock) {
    if (typeof window === 'undefined') return [];
    const users = JSON.parse(localStorage.getItem(MOCK_USERS_KEY) || '[]');
    return users.filter(u => u.role === 'student');
  }

  // Real Firestore query
  const q = query(collection(db, 'users'), where('role', '==', 'student'));
  const snap = await getDocs(q);
  return snap.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));
}

/**
 * Update a student's profile details
 */
export async function updateStudent(uid, student) {
  const updates = {};
  if (student.name !== undefined) updates.name = student.name;
  if (student.department !== undefined) updates.department = student.department;
  if (student.cgpa !== undefined) updates.cgpa = parseFloat(student.cgpa) || 0;
  if (student.arrears !== undefined) updates.arrears = parseInt(student.arrears) || 0;
  
  if (student.skills !== undefined) {
    updates.skills = Array.isArray(student.skills) 
      ? student.skills 
      : (student.skills ? student.skills.split(',').map(s => s.trim()).filter(Boolean) : []);
  }

  if (useMock) {
    const users = JSON.parse(localStorage.getItem(MOCK_USERS_KEY) || '[]');
    const index = users.findIndex(u => u.uid === uid);
    if (index !== -1) {
      users[index] = {
        ...users[index],
        ...updates
      };
      localStorage.setItem(MOCK_USERS_KEY, JSON.stringify(users));
      
      // Update currently logged in user if it matches
      const current = localStorage.getItem('pet_current_user');
      if (current) {
        const parsed = JSON.parse(current);
        if (parsed.uid === uid) {
          localStorage.setItem('pet_current_user', JSON.stringify({ ...parsed, ...updates }));
        }
      }
      
      window.dispatchEvent(new Event('storage'));
    }
    return;
  }

  // Real Firestore update
  await updateDoc(doc(db, 'users', uid), updates);
}

/**
 * Get a specific student profile by ID
 */
export async function getStudentById(uid) {
  if (useMock) {
    if (typeof window === 'undefined') return null;
    const users = JSON.parse(localStorage.getItem(MOCK_USERS_KEY) || '[]');
    return users.find(u => u.uid === uid && u.role === 'student') || null;
  }

  // Real Firestore get
  const docSnap = await getDoc(doc(db, 'users', uid));
  if (docSnap.exists() && docSnap.data().role === 'student') {
    return {
      uid: docSnap.id,
      ...docSnap.data()
    };
  }
  return null;
}

const APPLICATIONS_KEY = 'pet_applications';

// Helper to seed applications in mock database
function initMockApplications() {
  if (typeof window === 'undefined') return;
  if (!localStorage.getItem(APPLICATIONS_KEY)) {
    const defaultApps = [
      {
        id: 'app_1',
        studentId: 'mock_student_1',
        companyId: 'comp_google',
        status: 'Eligible',
        appliedAt: new Date().toISOString()
      }
    ];
    localStorage.setItem(APPLICATIONS_KEY, JSON.stringify(defaultApps));
  }
}

if (useMock) {
  initMockApplications();
}

/**
 * Apply to a company placement drive
 */
export async function applyToCompany(studentId, companyId) {
  const application = {
    studentId,
    companyId,
    status: 'Eligible',
    appliedAt: new Date().toISOString()
  };

  if (useMock) {
    const apps = JSON.parse(localStorage.getItem(APPLICATIONS_KEY) || '[]');
    if (apps.some(a => a.studentId === studentId && a.companyId === companyId)) {
      throw new Error("You have already applied for this company");
    }
    const newApp = {
      id: 'app_' + Math.random().toString(36).substr(2, 9),
      ...application
    };
    apps.push(newApp);
    localStorage.setItem(APPLICATIONS_KEY, JSON.stringify(apps));
    window.dispatchEvent(new Event('storage'));
    return newApp.id;
  }

  // Real Firestore add
  // First check if already applied
  const { query, collection, where, getDocs, addDoc } = await import('firebase/firestore');
  const q = query(
    collection(db, 'applications'), 
    where('studentId', '==', studentId), 
    where('companyId', '==', companyId)
  );
  const snap = await getDocs(q);
  if (!snap.empty) {
    throw new Error("You have already applied for this company");
  }

  const docRef = await addDoc(collection(db, 'applications'), application);
  return docRef.id;
}

/**
 * Get all applications
 */
export async function getApplications() {
  if (useMock) {
    if (typeof window === 'undefined') return [];
    return JSON.parse(localStorage.getItem(APPLICATIONS_KEY) || '[]');
  }

  // Real Firestore get
  const { collection, getDocs } = await import('firebase/firestore');
  const snap = await getDocs(collection(db, 'applications'));
  return snap.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));
}

