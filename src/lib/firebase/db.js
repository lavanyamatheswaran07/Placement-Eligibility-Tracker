import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  collection, 
  getDocs, 
  query, 
  where, 
  addDoc, 
  orderBy, 
  deleteDoc
} from 'firebase/firestore';
import { db, useMock } from './client';

// Local Storage keys for Mocks
const DRIVES_KEY = 'pet_mock_drives';
const STUDENTS_KEY = 'pet_mock_students';
const APPLICATIONS_KEY = 'pet_mock_applications';

// Initialize mock database seeds if empty
if (useMock && typeof window !== 'undefined') {
  if (!localStorage.getItem(DRIVES_KEY)) {
    const defaultDrives = [
      {
        id: 'drive_google',
        companyName: 'Google',
        jobRole: 'Associate Software Engineer',
        jobDescription: 'Join the Google Cloud developer team to build global infrastructure. Requires strong algorithmic foundations, systems design concepts, and proficiency in Java, C++, or Go.',
        packageCTC: 18.5,
        deadline: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7).toISOString(), // 7 days from now
        status: 'active',
        eligibilityCriteria: {
          minCgpa: 8.0,
          maxActiveBacklogs: 0,
          allowedBranches: ['CSE', 'ECE']
        },
        createdAt: new Date().toISOString()
      },
      {
        id: 'drive_microsoft',
        companyName: 'Microsoft',
        jobRole: 'Support Engineer',
        jobDescription: 'Help customers resolve high-priority architecture challenges on Azure. Excellent debugging, communication, and virtualization principles required.',
        packageCTC: 12.0,
        deadline: new Date(Date.now() + 1000 * 60 * 60 * 24 * 3).toISOString(), // 3 days from now
        status: 'active',
        eligibilityCriteria: {
          minCgpa: 7.0,
          maxActiveBacklogs: 1,
          allowedBranches: ['CSE', 'ECE', 'ME', 'CE']
        },
        createdAt: new Date().toISOString()
      },
      {
        id: 'drive_tesla',
        companyName: 'Tesla',
        jobRole: 'Embedded Systems Intern',
        jobDescription: 'Write micro-controller firmware for energy storage products. Needs solid C/C++ knowledge, real-time operating systems (RTOS), and hardware debugging basics.',
        packageCTC: 15.0,
        deadline: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(), // Closed 2 days ago
        status: 'closed',
        eligibilityCriteria: {
          minCgpa: 7.5,
          maxActiveBacklogs: 0,
          allowedBranches: ['CSE', 'ECE', 'ME']
        },
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 10).toISOString()
      }
    ];
    localStorage.setItem(DRIVES_KEY, JSON.stringify(defaultDrives));
  }

  if (!localStorage.getItem(APPLICATIONS_KEY)) {
    const defaultApplications = [
      {
        id: 'app_1',
        driveId: 'drive_google',
        studentId: 'student1',
        studentName: 'John Doe',
        studentRollNumber: 'CS2023001',
        appliedAt: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(),
        status: 'applied',
        eligibleAtTimeOfApplication: true
      }
    ];
    localStorage.setItem(APPLICATIONS_KEY, JSON.stringify(defaultApplications));
  }
}

// ----------------- STUDENT PROFILES -----------------

export async function getStudentProfile(uid) {
  if (useMock) {
    const students = JSON.parse(localStorage.getItem(STUDENTS_KEY) || '{}');
    return students[uid] || null;
  }
  const studentDoc = await getDoc(doc(db, 'students', uid));
  return studentDoc.exists() ? studentDoc.data() : null;
}

export async function updateStudentProfile(uid, profileData) {
  if (useMock) {
    const students = JSON.parse(localStorage.getItem(STUDENTS_KEY) || '{}');
    students[uid] = {
      ...(students[uid] || {}),
      ...profileData,
      cgpa: parseFloat(profileData.cgpa),
      activeBacklogs: parseInt(profileData.activeBacklogs),
      historyOfBacklogs: parseInt(profileData.historyOfBacklogs)
    };
    localStorage.setItem(STUDENTS_KEY, JSON.stringify(students));
    
    // Update display name in mock user database as well
    const users = JSON.parse(localStorage.getItem('pet_mock_users') || '[]');
    const userIndex = users.findIndex(u => u.uid === uid);
    if (userIndex !== -1 && profileData.fullName) {
      users[userIndex].displayName = profileData.fullName;
      localStorage.setItem('pet_mock_users', JSON.stringify(users));
      
      // Update session storage
      const curr = localStorage.getItem('pet_mock_current_user');
      if (curr) {
        const parsed = JSON.parse(curr);
        if (parsed.uid === uid) {
          parsed.displayName = profileData.fullName;
          localStorage.setItem('pet_mock_current_user', JSON.stringify(parsed));
        }
      }
    }
    window.dispatchEvent(new Event('storage'));
    return;
  }
  await setDoc(doc(db, 'students', uid), {
    ...profileData,
    cgpa: parseFloat(profileData.cgpa),
    activeBacklogs: parseInt(profileData.activeBacklogs),
    historyOfBacklogs: parseInt(profileData.historyOfBacklogs),
    updatedAt: new Date()
  }, { merge: true });
}

export async function getAllStudents() {
  if (useMock) {
    const students = JSON.parse(localStorage.getItem(STUDENTS_KEY) || '{}');
    const users = JSON.parse(localStorage.getItem('pet_mock_users') || '[]');
    return Object.entries(students).map(([uid, data]) => {
      const u = users.find(user => user.uid === uid);
      return {
        uid,
        email: u ? u.email : '',
        ...data
      };
    });
  }
  const snap = await getDocs(collection(db, 'students'));
  const list = [];
  for (const d of snap.docs) {
    const data = d.data();
    const userSnap = await getDoc(doc(db, 'users', d.id));
    const userEmail = userSnap.exists() ? userSnap.data().email : '';
    list.push({ uid: d.id, email: userEmail, ...data });
  }
  return list;
}

// ----------------- PLACEMENT DRIVES -----------------

export async function getDrives() {
  if (useMock) {
    return JSON.parse(localStorage.getItem(DRIVES_KEY) || '[]');
  }
  const q = query(collection(db, 'drives'), orderBy('createdAt', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

export async function getDrive(driveId) {
  if (useMock) {
    const drives = JSON.parse(localStorage.getItem(DRIVES_KEY) || '[]');
    return drives.find(d => d.id === driveId) || null;
  }
  const driveDoc = await getDoc(doc(db, 'drives', driveId));
  return driveDoc.exists() ? { id: driveDoc.id, ...driveDoc.data() } : null;
}

export async function createDrive(driveData) {
  const formatted = {
    ...driveData,
    packageCTC: parseFloat(driveData.packageCTC),
    eligibilityCriteria: {
      minCgpa: parseFloat(driveData.eligibilityCriteria.minCgpa),
      maxActiveBacklogs: parseInt(driveData.eligibilityCriteria.maxActiveBacklogs),
      allowedBranches: driveData.eligibilityCriteria.allowedBranches || []
    }
  };

  if (useMock) {
    const drives = JSON.parse(localStorage.getItem(DRIVES_KEY) || '[]');
    const id = 'drive_' + Math.random().toString(36).substr(2, 9);
    const newDrive = {
      id,
      ...formatted,
      createdAt: new Date().toISOString()
    };
    drives.unshift(newDrive);
    localStorage.setItem(DRIVES_KEY, JSON.stringify(drives));
    return id;
  }

  const docRef = await addDoc(collection(db, 'drives'), {
    ...formatted,
    createdAt: new Date()
  });
  return docRef.id;
}

export async function updateDrive(driveId, driveData) {
  const formatted = {
    ...driveData,
    packageCTC: parseFloat(driveData.packageCTC),
    eligibilityCriteria: {
      minCgpa: parseFloat(driveData.eligibilityCriteria.minCgpa),
      maxActiveBacklogs: parseInt(driveData.eligibilityCriteria.maxActiveBacklogs),
      allowedBranches: driveData.eligibilityCriteria.allowedBranches || []
    }
  };

  if (useMock) {
    const drives = JSON.parse(localStorage.getItem(DRIVES_KEY) || '[]');
    const index = drives.findIndex(d => d.id === driveId);
    if (index !== -1) {
      drives[index] = { ...drives[index], ...formatted };
      localStorage.setItem(DRIVES_KEY, JSON.stringify(drives));
    }
    return;
  }
  await updateDoc(doc(db, 'drives', driveId), formatted);
}

export async function deleteDrive(driveId) {
  if (useMock) {
    let drives = JSON.parse(localStorage.getItem(DRIVES_KEY) || '[]');
    drives = drives.filter(d => d.id !== driveId);
    localStorage.setItem(DRIVES_KEY, JSON.stringify(drives));
    
    // Also delete associated applications
    let apps = JSON.parse(localStorage.getItem(APPLICATIONS_KEY) || '[]');
    apps = apps.filter(a => a.driveId !== driveId);
    localStorage.setItem(APPLICATIONS_KEY, JSON.stringify(apps));
    return;
  }
  await deleteDoc(doc(db, 'drives', driveId));
  
  // Clean up applications
  const q = query(collection(db, 'applications'), where('driveId', '==', driveId));
  const snap = await getDocs(q);
  for (const d of snap.docs) {
    await deleteDoc(doc(db, 'applications', d.id));
  }
}

// ----------------- APPLICATIONS -----------------

export async function getStudentApplications(studentId) {
  if (useMock) {
    const apps = JSON.parse(localStorage.getItem(APPLICATIONS_KEY) || '[]');
    return apps.filter(a => a.studentId === studentId);
  }
  const q = query(collection(db, 'applications'), where('studentId', '==', studentId));
  const snap = await getDocs(q);
  return snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

export async function getDriveApplications(driveId) {
  if (useMock) {
    const apps = JSON.parse(localStorage.getItem(APPLICATIONS_KEY) || '[]');
    return apps.filter(a => a.driveId === driveId);
  }
  const q = query(collection(db, 'applications'), where('driveId', '==', driveId));
  const snap = await getDocs(q);
  return snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

export async function applyForDrive(studentId, driveId, studentProfile) {
  if (useMock) {
    const apps = JSON.parse(localStorage.getItem(APPLICATIONS_KEY) || '[]');
    
    // Check if already applied
    if (apps.some(a => a.studentId === studentId && a.driveId === driveId)) {
      throw new Error("You have already applied for this placement drive");
    }

    const drive = (JSON.parse(localStorage.getItem(DRIVES_KEY) || '[]')).find(d => d.id === driveId);
    if (!drive) throw new Error("Drive does not exist");
    
    // Check eligibility
    const eligible = studentProfile.cgpa >= drive.eligibilityCriteria.minCgpa &&
                     studentProfile.activeBacklogs <= drive.eligibilityCriteria.maxActiveBacklogs &&
                     drive.eligibilityCriteria.allowedBranches.includes(studentProfile.branch);
    
    const id = 'app_' + Math.random().toString(36).substr(2, 9);
    const newApp = {
      id,
      driveId,
      studentId,
      studentName: studentProfile.fullName,
      studentRollNumber: studentProfile.rollNumber,
      appliedAt: new Date().toISOString(),
      status: 'applied',
      eligibleAtTimeOfApplication: eligible
    };
    apps.push(newApp);
    localStorage.setItem(APPLICATIONS_KEY, JSON.stringify(apps));
    return id;
  }

  // Real Firestore apply
  const credentialQuery = query(
    collection(db, 'applications'), 
    where('studentId', '==', studentId), 
    where('driveId', '==', driveId)
  );
  const checkSnap = await getDocs(credentialQuery);
  if (!checkSnap.empty) {
    throw new Error("You have already applied for this placement drive");
  }

  const driveDoc = await getDoc(doc(db, 'drives', driveId));
  const drive = driveDoc.data();
  const eligible = studentProfile.cgpa >= drive.eligibilityCriteria.minCgpa &&
                   studentProfile.activeBacklogs <= drive.eligibilityCriteria.maxActiveBacklogs &&
                   drive.eligibilityCriteria.allowedBranches.includes(studentProfile.branch);

  const docRef = await addDoc(collection(db, 'applications'), {
    driveId,
    studentId,
    studentName: studentProfile.fullName,
    studentRollNumber: studentProfile.rollNumber,
    appliedAt: new Date(),
    status: 'applied',
    eligibleAtTimeOfApplication: eligible
  });
  return docRef.id;
}

export async function updateApplicationStatus(applicationId, status) {
  if (useMock) {
    const apps = JSON.parse(localStorage.getItem(APPLICATIONS_KEY) || '[]');
    const index = apps.findIndex(a => a.id === applicationId);
    if (index !== -1) {
      apps[index].status = status;
      localStorage.setItem(APPLICATIONS_KEY, JSON.stringify(apps));
      
      // If marked as PLACED, update student placedStatus
      if (status === 'placed') {
        const studentId = apps[index].studentId;
        const students = JSON.parse(localStorage.getItem(STUDENTS_KEY) || '{}');
        if (students[studentId]) {
          students[studentId].placedStatus = true;
          localStorage.setItem(STUDENTS_KEY, JSON.stringify(students));
        }
      }
    }
    window.dispatchEvent(new Event('storage'));
    return;
  }
  await updateDoc(doc(db, 'applications', applicationId), { status });
  if (status === 'placed') {
    const appSnap = await getDoc(doc(db, 'applications', applicationId));
    if (appSnap.exists()) {
      const studentId = appSnap.data().studentId;
      await updateDoc(doc(db, 'students', studentId), { placedStatus: true });
    }
  }
}
