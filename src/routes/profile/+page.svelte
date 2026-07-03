<script>
  import { userStore, showToast, refreshUser } from '$lib/stores/auth';
  import { updateStudent } from '$lib/studentService';
  import { onMount } from 'svelte';

  let name = $state('');
  let department = $state('');
  let cgpa = $state(0);
  let arrears = $state(0);
  let skills = $state(''); // string format for textbox editing
  let isUpdating = $state(false);

  // Sync state on load
  onMount(() => {
    if ($userStore) {
      name = $userStore.name || '';
      department = $userStore.department || '';
      cgpa = $userStore.cgpa || 0;
      arrears = $userStore.arrears || 0;
      skills = Array.isArray($userStore.skills) 
        ? $userStore.skills.join(', ') 
        : '';
    }
  });

  async function handleUpdate(e) {
    e.preventDefault();
    if (cgpa < 0 || cgpa > 10) {
      showToast('CGPA must be between 0.0 and 10.0', 'error');
      return;
    }
    if (arrears < 0) {
      showToast('Active arrears cannot be negative', 'error');
      return;
    }

    isUpdating = true;
    try {
      const skillsArr = skills
        ? skills.split(',').map(s => s.trim()).filter(Boolean)
        : [];

      await updateStudent($userStore.uid, {
        name,
        department,
        cgpa: parseFloat(cgpa),
        arrears: parseInt(arrears),
        skills: skillsArr
      });

      await refreshUser(); // update local store details
      showToast('Academic profile updated successfully!');
    } catch (err) {
      showToast(err.message || 'Failed to update academic profile.', 'error');
    } finally {
      isUpdating = false;
    }
  }
</script>

<svelte:head>
  <title>Academic Profile - Placement Eligibility Tracker</title>
</svelte:head>

<div class="space-y-6">
  <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-5">
    <div>
      <h1 class="text-3xl font-display font-bold bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
        Academic Profile
      </h1>
      <p class="text-sm text-slate-500 dark:text-slate-400">
        Review and maintain your official registration data. Ensure your CGPA and arrears are accurate for eligibility checks.
      </p>
    </div>
  </div>

  <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
    <!-- Left column: Profile Summary Card -->
    <div class="lg:col-span-1 space-y-6">
      <div class="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-6 rounded-2xl shadow-sm text-center relative overflow-hidden">
        <div class="absolute top-0 right-0 w-24 h-24 bg-brand-500/5 rounded-bl-full pointer-events-none"></div>
        
        <div class="w-20 h-20 rounded-full bg-gradient-to-tr from-brand-600 to-indigo-500 flex items-center justify-center font-bold text-white text-3xl mx-auto shadow-md shadow-brand-500/20 mb-4">
          {name ? name[0].toUpperCase() : 'U'}
        </div>
        
        <h2 class="text-xl font-display font-bold text-slate-900 dark:text-white">{name}</h2>
        <p class="text-xs font-semibold text-slate-400 mt-1">Student / {department || 'Department Not Set'}</p>
        
        <div class="mt-6 pt-6 border-t border-slate-100 dark:border-slate-800 grid grid-cols-2 gap-4">
          <div class="p-3 bg-slate-50 dark:bg-slate-950 rounded-xl">
            <span class="block text-xxs font-bold uppercase tracking-wider text-slate-400">Current CGPA</span>
            <span class="block text-xl font-extrabold text-brand-600 dark:text-brand-400 mt-1">{parseFloat(cgpa).toFixed(2)}</span>
          </div>
          <div class="p-3 bg-slate-50 dark:bg-slate-950 rounded-xl">
            <span class="block text-xxs font-bold uppercase tracking-wider text-slate-400">Active Arrears</span>
            <span class="block text-xl font-extrabold {arrears > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'} mt-1">{arrears}</span>
          </div>
        </div>

        {#if $userStore && $userStore.skills && $userStore.skills.length > 0}
          <div class="mt-6 text-left">
            <span class="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">Key Skills</span>
            <div class="flex flex-wrap gap-1.5">
              {#each $userStore.skills as skill}
                <span class="text-xxs px-2.5 py-1 rounded-lg font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                  {skill}
                </span>
              {/each}
            </div>
          </div>
        {/if}
      </div>
    </div>

    <!-- Right column: Edit Details Form -->
    <div class="lg:col-span-2">
      <div class="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-sm p-6 sm:p-8">
        <h2 class="text-lg font-display font-bold text-slate-900 dark:text-white mb-6">Update Academic Details</h2>
        
        <form onsubmit={handleUpdate} class="space-y-6">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label for="profile-name" class="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Full Name</label>
              <input 
                id="profile-name" 
                type="text" 
                required 
                bind:value={name}
                class="block w-full px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all text-sm font-medium"
              />
            </div>
            
            <div>
              <label for="profile-dept" class="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Department</label>
              <select 
                id="profile-dept" 
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
              <label for="profile-cgpa" class="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Cumulative GPA (CGPA)</label>
              <input 
                id="profile-cgpa" 
                type="number" 
                step="0.01" 
                min="0" 
                max="10" 
                required 
                bind:value={cgpa}
                class="block w-full px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all text-sm font-medium"
              />
            </div>
            
            <div>
              <label for="profile-arrears" class="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Active Arrears</label>
              <input 
                id="profile-arrears" 
                type="number" 
                min="0" 
                required 
                bind:value={arrears}
                class="block w-full px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all text-sm font-medium"
              />
            </div>
          </div>
          
          <div>
            <label for="profile-skills" class="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Skills (Comma-separated)</label>
            <input 
              id="profile-skills" 
              type="text" 
              bind:value={skills}
              class="block w-full px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all text-sm font-medium"
              placeholder="React, Node.js, SQL, Java" 
            />
            <span class="block mt-1.5 text-xxs text-slate-400">Separate key skills with a comma (e.g. C++, Java, AWS).</span>
          </div>

          <div class="flex justify-end pt-4">
            <button 
              type="submit" 
              disabled={isUpdating}
              class="px-6 py-3 bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white rounded-xl font-bold text-sm transition-all shadow-md shadow-brand-500/10 active:scale-[0.98] disabled:opacity-50 cursor-pointer">
              {#if isUpdating}
                Saving Changes...
              {:else}
                Save Profile
              {/if}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</div>
