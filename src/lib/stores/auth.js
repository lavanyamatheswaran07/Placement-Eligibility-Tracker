import { writable } from 'svelte/store';
import { getCurrentUser, logout } from '../auth';

export const userStore = writable(null);
export const authLoading = writable(true);
export const toastMessage = writable(null);

export function showToast(message, type = 'success') {
  toastMessage.set({ message, type });
  setTimeout(() => {
    toastMessage.set(null);
  }, 4000);
}

/**
 * Initializes and syncs the auth store
 */
export async function initAuth() {
  authLoading.set(true);
  try {
    const user = await getCurrentUser();
    userStore.set(user);
  } catch (err) {
    console.error("Error initializing auth store:", err);
    userStore.set(null);
  } finally {
    authLoading.set(false);
  }

  // Subscribe to storage changes for Mock Mode synchronization across tabs/pages
  const handleStorageChange = async () => {
    try {
      const user = await getCurrentUser();
      userStore.set(user);
    } catch (e) {
      console.error(e);
    }
  };

  if (typeof window !== 'undefined') {
    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }
  return () => {};
}

/**
 * Trigger reload of the current user profile from the database
 */
export async function refreshUser() {
  try {
    const user = await getCurrentUser();
    userStore.set(user);
  } catch (err) {
    console.error("Error refreshing auth store:", err);
  }
}
