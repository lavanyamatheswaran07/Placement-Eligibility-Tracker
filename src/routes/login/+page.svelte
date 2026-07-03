<script>
  import { login } from '$lib/auth';
  import { userStore, showToast } from '$lib/stores/auth';
  import { goto } from '$app/navigation';
  import { useMock } from '$lib/firebase';

  let email = $state('');
  let password = $state('');
  let isSubmitting = $state(false);
  let errorMsg = $state('');

  async function handleLogin(e) {
    if (e) e.preventDefault();
    if (!email || !password) {
      errorMsg = 'Please enter both email and password.';
      return;
    }

    isSubmitting = true;
    errorMsg = '';

    try {
      const loggedUser = await login(email.trim(), password);
      userStore.set(loggedUser);
      showToast(`Welcome back, ${loggedUser.name}!`);
      
      if (loggedUser.role === 'admin') {
        goto('/admin');
      } else {
        goto('/dashboard');
      }
    } catch (err) {
      errorMsg = err.message || 'Login failed. Please check your credentials.';
      showToast(errorMsg, 'error');
    } finally {
      isSubmitting = false;
    }
  }

  // Quick Login helper for developers in Mock Mode
  function quickLogin(role) {
    if (role === 'admin') {
      email = 'admin@college.edu';
    } else {
      email = 'student@college.edu';
    }
    password = 'password123';
    handleLogin();
  }
</script>

<svelte:head>
  <title>Login - Placement Eligibility Tracker</title>
</svelte:head>

<div class="min-h-[80vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
  <div class="max-w-md w-full space-y-8 bg-white dark:bg-slate-900 p-8 sm:p-10 rounded-3xl shadow-xl border border-slate-100 dark:border-slate-800 transition-all duration-300">
    <div>
      <div class="mx-auto h-12 w-12 rounded-2xl bg-gradient-to-tr from-brand-600 to-indigo-500 flex items-center justify-center text-white font-extrabold text-2xl shadow-lg shadow-brand-500/20">
        P
      </div>
      <h2 class="mt-6 text-center text-3xl font-display font-bold tracking-tight bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
        Sign in to your account
      </h2>
      <p class="mt-2 text-center text-sm text-slate-500 dark:text-slate-400">
        Or
        <a href="/register" class="font-semibold text-brand-600 hover:text-brand-500 dark:text-brand-400 dark:hover:text-brand-300 transition-colors">
          register a new student profile
        </a>
      </p>
    </div>

    {#if errorMsg}
      <div class="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-100 dark:border-rose-900/40 text-rose-800 dark:text-rose-200 text-sm font-medium flex items-center gap-2.5 animate-pulse">
        <svg class="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
        </svg>
        <span>{errorMsg}</span>
      </div>
    {/if}

    <form class="mt-8 space-y-6" onsubmit={handleLogin}>
      <div class="space-y-4">
        <div>
          <label for="email" class="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Email address</label>
          <input 
            id="email" 
            name="email" 
            type="email" 
            autocomplete="email" 
            required 
            bind:value={email}
            class="block w-full px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all text-sm font-medium"
            placeholder="student@college.edu" 
          />
        </div>
        <div>
          <label for="password" class="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Password</label>
          <input 
            id="password" 
            name="password" 
            type="password" 
            autocomplete="current-password" 
            required 
            bind:value={password}
            class="block w-full px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all text-sm font-medium"
            placeholder="••••••••" 
          />
        </div>
      </div>

      <div>
        <button 
          type="submit" 
          disabled={isSubmitting}
          class="group relative w-full flex justify-center py-3.5 px-4 border border-transparent rounded-2xl font-bold text-sm text-white bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500 active:scale-[0.99] disabled:opacity-50 transition-all duration-150 cursor-pointer shadow-md shadow-brand-500/10">
          {#if isSubmitting}
            <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Signing in...
          {:else}
            Sign In
          {/if}
        </button>
      </div>
    </form>

    {#if useMock}
      <div class="mt-6 pt-6 border-t border-slate-100 dark:border-slate-800">
        <div class="flex items-center justify-between mb-4">
          <span class="text-xs font-semibold uppercase tracking-wider text-slate-400">Mock Sandbox mode</span>
          <span class="px-2 py-0.5 rounded-full text-xxs font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-400">Local Only</span>
        </div>
        <div class="grid grid-cols-2 gap-3">
          <button 
            type="button" 
            onclick={() => quickLogin('student')}
            class="flex items-center justify-center gap-1.5 py-2 px-3 border border-slate-200 dark:border-slate-800 hover:border-brand-500/40 hover:bg-brand-50/20 dark:hover:bg-brand-950/10 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 transition-all cursor-pointer">
            <div class="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
            Student Demo
          </button>
          <button 
            type="button" 
            onclick={() => quickLogin('admin')}
            class="flex items-center justify-center gap-1.5 py-2 px-3 border border-slate-200 dark:border-slate-800 hover:border-indigo-500/40 hover:bg-indigo-50/20 dark:hover:bg-indigo-950/10 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 transition-all cursor-pointer">
            <div class="w-1.5 h-1.5 rounded-full bg-indigo-500"></div>
            Admin Demo
          </button>
        </div>
      </div>
    {/if}
  </div>
</div>
