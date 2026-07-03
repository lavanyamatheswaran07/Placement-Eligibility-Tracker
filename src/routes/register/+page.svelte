<script>
  import { register } from '$lib/auth';
  import { userStore, showToast } from '$lib/stores/auth';
  import { goto } from '$app/navigation';

  let name = $state('');
  let email = $state('');
  let password = $state('');
  let role = $state('student'); // 'student' or 'admin'
  
  // Student-specific fields
  let department = $state('');
  let cgpa = $state(0);
  let arrears = $state(0);
  let skills = $state(''); // will parse comma-separated string to array
  
  let isSubmitting = $state(false);
  let errorMsg = $state('');

  async function handleRegister(e) {
    e.preventDefault();
    if (!name || !email || !password) {
      errorMsg = 'Please fill out all required base fields (Name, Email, Password).';
      return;
    }
    
    if (role === 'student' && !department) {
      errorMsg = 'Please select or enter your department.';
      return;
    }

    if (role === 'student' && (cgpa < 0 || cgpa > 10)) {
      errorMsg = 'CGPA must be a value between 0.0 and 10.0';
      return;
    }

    isSubmitting = true;
    errorMsg = '';

    // Convert comma-separated skills to clean array
    const skillsArr = skills
      ? skills.split(',').map(s => s.trim()).filter(Boolean)
      : [];

    try {
      const newUser = await register(
        email.trim(),
        password,
        name.trim(),
        role,
        role === 'student' ? department : '',
        role === 'student' ? parseFloat(cgpa) : 0,
        role === 'student' ? parseInt(arrears) : 0,
        role === 'student' ? skillsArr : []
      );
      
      userStore.set(newUser);
      showToast(`Account registered! Welcome ${newUser.name}.`);
      
      if (newUser.role === 'admin') {
        goto('/admin');
      } else {
        goto('/dashboard');
      }
    } catch (err) {
      errorMsg = err.message || 'Registration failed. Please try again.';
      showToast(errorMsg, 'error');
    } finally {
      isSubmitting = false;
    }
  }
</script>

<svelte:head>
  <title>Register - Placement Eligibility Tracker</title>
</svelte:head>

<div class="min-h-[85vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
  <div class="max-w-xl w-full space-y-8 bg-white dark:bg-slate-900 p-8 sm:p-10 rounded-3xl shadow-xl border border-slate-100 dark:border-slate-800 transition-all duration-300">
    <div>
      <div class="mx-auto h-12 w-12 rounded-2xl bg-gradient-to-tr from-brand-600 to-indigo-500 flex items-center justify-center text-white font-extrabold text-2xl shadow-lg shadow-brand-500/20">
        P
      </div>
      <h2 class="mt-6 text-center text-3xl font-display font-bold tracking-tight bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
        Create your account
      </h2>
      <p class="mt-2 text-center text-sm text-slate-500 dark:text-slate-400">
        Already have an account?
        <a href="/login" class="font-semibold text-brand-600 hover:text-brand-500 dark:text-brand-400 dark:hover:text-brand-300 transition-colors">
          Sign in here
        </a>
      </p>
    </div>

    {#if errorMsg}
      <div class="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-100 dark:border-rose-900/40 text-rose-800 dark:text-rose-200 text-sm font-medium flex items-center gap-2.5">
        <svg class="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
        </svg>
        <span>{errorMsg}</span>
      </div>
    {/if}

    <form class="mt-8 space-y-6" onsubmit={handleRegister}>
      <div class="space-y-4">
        <!-- Account Type Toggle -->
        <div>
          <span class="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Register as</span>
          <div class="grid grid-cols-2 gap-2 bg-slate-50 dark:bg-slate-950 p-1.5 rounded-2xl border border-slate-200/60 dark:border-slate-800">
            <button 
              type="button" 
              onclick={() => role = 'student'}
              class="py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer
                {role === 'student' 
                  ? 'bg-white dark:bg-slate-900 text-brand-600 dark:text-brand-400 shadow-sm border border-slate-200/50 dark:border-slate-800/80' 
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }">
              Student Profile
            </button>
            <button 
              type="button" 
              onclick={() => role = 'admin'}
              class="py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer
                {role === 'admin' 
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm border border-slate-200/50 dark:border-slate-800/80' 
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }">
              Admin Officer
            </button>
          </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label for="name" class="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Full Name</label>
            <input 
              id="name" 
              type="text" 
              required 
              bind:value={name}
              class="block w-full px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all text-sm font-medium"
              placeholder="e.g. Jane Smith" 
            />
          </div>
          <div>
            <label for="email" class="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Email Address</label>
            <input 
              id="email" 
              type="email" 
              required 
              bind:value={email}
              class="block w-full px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all text-sm font-medium"
              placeholder="jane.smith@college.edu" 
            />
          </div>
        </div>

        <div>
          <label for="password" class="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Password</label>
          <input 
            id="password" 
            type="password" 
            required 
            bind:value={password}
            class="block w-full px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all text-sm font-medium"
            placeholder="••••••••" 
          />
        </div>

        <!-- Student-Specific Section -->
        {#if role === 'student'}
          <div class="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-4 animate-fadeIn">
            <h3 class="text-xs font-extrabold uppercase tracking-wider text-brand-600 dark:text-brand-400 mb-2">Academic Information</h3>
            
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div class="md:col-span-1">
                <label for="department" class="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Department</label>
                <select 
                  id="department" 
                  bind:value={department}
                  class="block w-full px-3 py-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all text-sm font-medium">
                  <option value="">Select...</option>
                  <option value="Computer Science">Computer Science</option>
                  <option value="Information Technology">Information Technology</option>
                  <option value="Electronics & Communication">Electronics & Communication</option>
                  <option value="Electrical Engineering">Electrical Engineering</option>
                  <option value="Mechanical Engineering">Mechanical Engineering</option>
                  <option value="Civil Engineering">Civil Engineering</option>
                </select>
              </div>

              <div>
                <label for="cgpa" class="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Current CGPA</label>
                <input 
                  id="cgpa" 
                  type="number" 
                  step="0.01" 
                  min="0" 
                  max="10" 
                  bind:value={cgpa}
                  class="block w-full px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all text-sm font-medium"
                  placeholder="8.50" 
                />
              </div>

              <div>
                <label for="arrears" class="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Active Arrears</label>
                <input 
                  id="arrears" 
                  type="number" 
                  min="0" 
                  bind:value={arrears}
                  class="block w-full px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all text-sm font-medium"
                  placeholder="0" 
                />
              </div>
            </div>

            <div>
              <label for="skills" class="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Skills (Comma-separated)</label>
              <input 
                id="skills" 
                type="text" 
                bind:value={skills}
                class="block w-full px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all text-sm font-medium"
                placeholder="React, Node.js, SQL, Java" 
              />
              <span class="block mt-1.5 text-xxs text-slate-400">Separate key skills with a comma. These are matched with company requirements.</span>
            </div>
          </div>
        {/if}
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
            Creating Account...
          {:else}
            Register Profile
          {/if}
        </button>
      </div>
    </form>
  </div>
</div>
