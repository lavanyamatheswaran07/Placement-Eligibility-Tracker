<script>
  import './layout.css';
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import { userStore, authLoading, toastMessage, initAuth } from '$lib/stores/auth';
  import { onDestroy, onMount } from 'svelte';

  // Navigation state
  let isMobileSidebarOpen = $state(false);
  let isDarkMode = $state(false);
  let isCheckingAuth = $state(true);

  // Initialize auth on mount
  let unsubAuth = () => {};
  
  onMount(async () => {
    // Theme setup
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
      isDarkMode = true;
      document.documentElement.classList.add('dark');
    } else {
      isDarkMode = false;
      document.documentElement.classList.remove('dark');
    }

    unsubAuth = await initAuth();
    isCheckingAuth = false;
  });

  onDestroy(() => {
    unsubAuth();
  });

  // Toggle Dark Mode
  function toggleDarkMode() {
    isDarkMode = !isDarkMode;
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }

  // Handle Logout
  async function handleLogout() {
    const { logout } = await import('$lib/auth');
    try {
      await logout();
      goto('/login');
    } catch (err) {
      console.error(err);
    }
  }

  // Redirection guard logic (Runs on auth update or path change)
  $effect(() => {
    if (isCheckingAuth || $authLoading) return;

    const path = $page.url.pathname;
    const user = $userStore;

    // Public / Auth screens
    const isAuthRoute = path === '/login' || path === '/register';

    if (!user) {
      // Unauthenticated users are redirected to login if on private route
      if (!isAuthRoute && path !== '/') {
        goto('/login');
      }
    } else {
      // Authenticated users
      if (isAuthRoute || path === '/') {
        if (user.role === 'admin') {
          goto('/admin');
        } else {
          goto('/dashboard');
        }
      } else if (user.role !== 'admin' && (path === '/admin' || path === '/reports')) {
        // Students cannot access admin routes
        goto('/dashboard');
      } else if (user.role === 'admin' && path === '/profile') {
        // Admin has no profile editing route (profile is student specific)
        goto('/admin');
      }
    }
  });

  let currentPath = $derived($page.url.pathname);
  let user = $derived($userStore);
  let isLoading = $derived(isCheckingAuth || $authLoading);

  let { children } = $props();
</script>

<div class="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100 flex transition-colors duration-300">
  {#if isLoading}
    <div class="fixed inset-0 flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950 z-50">
      <div class="relative w-16 h-16">
        <div class="absolute inset-0 rounded-full border-4 border-brand-100 dark:border-slate-800"></div>
        <div class="absolute inset-0 rounded-full border-4 border-brand-500 border-t-transparent animate-spin"></div>
      </div>
      <h2 class="mt-4 text-xl font-display font-semibold tracking-wider text-slate-700 dark:text-slate-300 animate-pulse">
        Placement eligibility Tracker
      </h2>
    </div>
  {:else}
    <!-- Toast Notification Container -->
    {#if $toastMessage}
      <div class="fixed top-4 right-4 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-2xl border transition-all duration-300 transform translate-y-0
        {$toastMessage.type === 'error' 
          ? 'bg-rose-50 border-rose-200 text-rose-800 dark:bg-rose-950/80 dark:border-rose-900/50 dark:text-rose-200' 
          : 'bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-950/80 dark:border-emerald-900/50 dark:text-emerald-200'
        }">
        {#if $toastMessage.type === 'error'}
          <svg class="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
          </svg>
        {:else}
          <svg class="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
        {/if}
        <span class="font-medium text-sm">{$toastMessage.message}</span>
      </div>
    {/if}

    <!-- Sidebar (Shown when logged in) -->
    {#if user}
      <!-- Backdrop for mobile -->
      {#if isMobileSidebarOpen}
        <button 
          aria-label="Close sidebar"
          class="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-30 lg:hidden"
          onclick={() => isMobileSidebarOpen = false}>
        </button>
      {/if}

      <aside class="fixed lg:sticky top-0 bottom-0 left-0 w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 z-40 transition-transform duration-300 flex flex-col h-screen
        {isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}">
        
        <!-- Logo and header -->
        <div class="h-16 flex items-center px-6 border-b border-slate-100 dark:border-slate-800 gap-3">
          <div class="w-8 h-8 rounded-lg bg-gradient-to-tr from-brand-600 to-indigo-500 flex items-center justify-center text-white font-bold font-display shadow-md shadow-brand-500/20">
            P
          </div>
          <div>
            <h1 class="font-display font-bold text-base leading-tight bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
              PET Portal
            </h1>
            <span class="text-xxs uppercase tracking-wider text-slate-400 font-bold">Eligibility check</span>
          </div>
        </div>

        <!-- Navigation Links -->
        <nav class="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
          {#if user.role === 'admin'}
            <a href="/admin" 
               class="flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-sm transition-all duration-200
                 {currentPath === '/admin' 
                   ? 'bg-brand-50 text-brand-700 dark:bg-brand-950/40 dark:text-brand-400 shadow-sm' 
                   : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white'}"
               onclick={() => isMobileSidebarOpen = false}>
              <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/>
              </svg>
              Admin Dashboard
            </a>

            <a href="/companies" 
               class="flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-sm transition-all duration-200
                 {currentPath === '/companies' 
                   ? 'bg-brand-50 text-brand-700 dark:bg-brand-950/40 dark:text-brand-400 shadow-sm' 
                   : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white'}"
               onclick={() => isMobileSidebarOpen = false}>
              <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/>
              </svg>
              Manage Companies
            </a>

            <a href="/reports" 
               class="flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-sm transition-all duration-200
                 {currentPath === '/reports' 
                   ? 'bg-brand-50 text-brand-700 dark:bg-brand-950/40 dark:text-brand-400 shadow-sm' 
                   : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white'}"
               onclick={() => isMobileSidebarOpen = false}>
              <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
              </svg>
              Reports & Export
            </a>
          {:else}
            <!-- Student Navigation -->
            <a href="/dashboard" 
               class="flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-sm transition-all duration-200
                 {currentPath === '/dashboard' 
                   ? 'bg-brand-50 text-brand-700 dark:bg-brand-950/40 dark:text-brand-400 shadow-sm' 
                   : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white'}"
               onclick={() => isMobileSidebarOpen = false}>
              <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/>
              </svg>
              Student Dashboard
            </a>

            <a href="/companies" 
               class="flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-sm transition-all duration-200
                 {currentPath === '/companies' 
                   ? 'bg-brand-50 text-brand-700 dark:bg-brand-950/40 dark:text-brand-400 shadow-sm' 
                   : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white'}"
               onclick={() => isMobileSidebarOpen = false}>
              <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/>
              </svg>
              Companies Eligibility
            </a>

            <a href="/profile" 
               class="flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-sm transition-all duration-200
                 {currentPath === '/profile' 
                   ? 'bg-brand-50 text-brand-700 dark:bg-brand-950/40 dark:text-brand-400 shadow-sm' 
                   : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white'}"
               onclick={() => isMobileSidebarOpen = false}>
              <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
              </svg>
              Academic Profile
            </a>
          {/if}
        </nav>

        <!-- Sidebar Footer -->
        <div class="p-4 border-t border-slate-100 dark:border-slate-800 space-y-3">
          <!-- Profile Quick Preview -->
          <div class="flex items-center gap-3 px-2 py-1">
            <div class="w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-bold text-slate-700 dark:text-slate-300">
              {user.name ? user.name[0].toUpperCase() : 'U'}
            </div>
            <div class="min-w-0 flex-1">
              <p class="text-xs font-semibold truncate text-slate-900 dark:text-slate-100">{user.name}</p>
              <p class="text-xxs text-slate-400 truncate">{user.email}</p>
            </div>
          </div>

          <button 
            onclick={handleLogout}
            class="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 font-semibold text-xs hover:bg-rose-50 dark:hover:bg-rose-950/20 hover:text-rose-600 dark:hover:text-rose-400 hover:border-rose-200 dark:hover:border-rose-900/50 transition-all duration-200">
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>
            </svg>
            Sign Out
          </button>
        </div>
      </aside>
    {/if}

    <!-- Main Content Area -->
    <div class="flex-1 flex flex-col min-w-0">
      
      <!-- Top Navbar (Only when logged in) -->
      {#if user}
        <header class="h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-6 sticky top-0 z-30">
          <div class="flex items-center gap-4">
            <!-- Mobile Menu Toggle -->
            <button 
              class="lg:hidden p-2 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              onclick={() => isMobileSidebarOpen = !isMobileSidebarOpen}
              aria-label="Toggle Menu">
              <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/>
              </svg>
            </button>
            <span class="text-sm font-semibold text-slate-500 dark:text-slate-400 capitalize hidden sm:inline">
              {currentPath.replace('/', '')} / Home
            </span>
          </div>

          <!-- Utility Bar -->
          <div class="flex items-center gap-4">
            <span class="text-xs px-2.5 py-1 rounded-full font-bold uppercase tracking-wider
              {user.role === 'admin' 
                ? 'bg-purple-100 text-purple-700 dark:bg-purple-950/50 dark:text-purple-400' 
                : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400'
              }">
              {user.role}
            </span>

            <!-- Theme Toggle -->
            <button 
              onclick={toggleDarkMode}
              class="p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 transition-colors"
              aria-label="Toggle Dark Mode">
              {#if isDarkMode}
                <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 9H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m12.728 0l-.707-.707M6.343 6.343l-.707-.707M12 8a4 4 0 100 8 4 4 0 000-8z"/>
                </svg>
              {:else}
                <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"/>
                </svg>
              {/if}
            </button>
          </div>
        </header>
      {:else}
        <!-- Top Navbar for guest access to toggle dark mode -->
        <header class="fixed top-4 right-4 z-40">
          <button 
            onclick={toggleDarkMode}
            class="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl text-slate-600 dark:text-slate-400 hover:scale-105 transition-transform"
            aria-label="Toggle Theme">
            {#if isDarkMode}
              <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 9H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m12.728 0l-.707-.707M6.343 6.343l-.707-.707M12 8a4 4 0 100 8 4 4 0 000-8z"/>
              </svg>
            {:else}
              <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"/>
              </svg>
            {/if}
          </button>
        </header>
      {/if}

      <!-- Page Content -->
      <main class="flex-1 p-6 overflow-y-auto bg-slate-50 dark:bg-slate-950">
        <div class="max-w-7xl mx-auto">
          {@render children()}
        </div>
      </main>
    </div>
  {/if}
</div>

<style>
  :global(.text-xxs) {
    font-size: 0.65rem;
  }
</style>
