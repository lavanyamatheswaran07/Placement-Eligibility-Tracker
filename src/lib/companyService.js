import { 
  collection, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  query, 
  orderBy 
} from 'firebase/firestore';
import { db, useMock } from './firebase';

const COMPANIES_KEY = 'pet_companies';

// Helper to seed companies in mock database
function initMockCompanies() {
  if (typeof window === 'undefined') return;
  if (!localStorage.getItem(COMPANIES_KEY)) {
    const defaultCompanies = [
      {
        id: 'comp_google',
        companyName: 'Google',
        minimumCGPA: 8.0,
        maximumArrears: 0,
        requiredSkills: ['Python', 'Go', 'Data Structures'],
        package: '18 LPA',
        location: 'Bangalore',
        createdAt: new Date().toISOString()
      },
      {
        id: 'comp_microsoft',
        companyName: 'Microsoft',
        minimumCGPA: 7.5,
        maximumArrears: 1,
        requiredSkills: ['C#', 'SQL', 'System Design'],
        package: '14 LPA',
        location: 'Hyderabad',
        createdAt: new Date().toISOString()
      },
      {
        id: 'comp_accenture',
        companyName: 'Accenture',
        minimumCGPA: 6.0,
        maximumArrears: 3,
        requiredSkills: ['Java', 'SQL', 'Communication'],
        package: '4.5 LPA',
        location: 'Pune',
        createdAt: new Date().toISOString()
      }
    ];
    localStorage.setItem(COMPANIES_KEY, JSON.stringify(defaultCompanies));
  }
}

if (useMock) {
  initMockCompanies();
}

/**
 * Add a new company
 */
export async function addCompany(company) {
  const formattedCompany = {
    companyName: company.companyName,
    minimumCGPA: parseFloat(company.minimumCGPA) || 0,
    maximumArrears: parseInt(company.maximumArrears) || 0,
    requiredSkills: Array.isArray(company.requiredSkills) 
      ? company.requiredSkills 
      : (company.requiredSkills ? company.requiredSkills.split(',').map(s => s.trim()).filter(Boolean) : []),
    package: company.package || "",
    location: company.location || "",
    createdAt: new Date().toISOString()
  };

  if (useMock) {
    const companies = JSON.parse(localStorage.getItem(COMPANIES_KEY) || '[]');
    const newCompany = {
      id: 'comp_' + Math.random().toString(36).substr(2, 9),
      ...formattedCompany
    };
    companies.unshift(newCompany);
    localStorage.setItem(COMPANIES_KEY, JSON.stringify(companies));
    window.dispatchEvent(new Event('storage'));
    return newCompany.id;
  }

  // Real Firestore add
  const docRef = await addDoc(collection(db, 'companies'), formattedCompany);
  return docRef.id;
}

/**
 * Get all companies
 */
export async function getCompanies() {
  if (useMock) {
    if (typeof window === 'undefined') return [];
    return JSON.parse(localStorage.getItem(COMPANIES_KEY) || '[]');
  }

  // Real Firestore get
  const q = query(collection(db, 'companies'), orderBy('createdAt', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));
}

/**
 * Update an existing company
 */
export async function updateCompany(id, company) {
  const formattedCompany = {
    companyName: company.companyName,
    minimumCGPA: parseFloat(company.minimumCGPA) || 0,
    maximumArrears: parseInt(company.maximumArrears) || 0,
    requiredSkills: Array.isArray(company.requiredSkills) 
      ? company.requiredSkills 
      : (company.requiredSkills ? company.requiredSkills.split(',').map(s => s.trim()).filter(Boolean) : []),
    package: company.package || "",
    location: company.location || ""
  };

  if (useMock) {
    const companies = JSON.parse(localStorage.getItem(COMPANIES_KEY) || '[]');
    const index = companies.findIndex(c => c.id === id);
    if (index !== -1) {
      companies[index] = {
        ...companies[index],
        ...formattedCompany
      };
      localStorage.setItem(COMPANIES_KEY, JSON.stringify(companies));
      window.dispatchEvent(new Event('storage'));
    }
    return;
  }

  // Real Firestore update
  await updateDoc(doc(db, 'companies', id), formattedCompany);
}

/**
 * Delete a company
 */
export async function deleteCompany(id) {
  if (useMock) {
    let companies = JSON.parse(localStorage.getItem(COMPANIES_KEY) || '[]');
    companies = companies.filter(c => c.id !== id);
    localStorage.setItem(COMPANIES_KEY, JSON.stringify(companies));
    window.dispatchEvent(new Event('storage'));
    return;
  }

  // Real Firestore delete
  await deleteDoc(doc(db, 'companies', id));
}
