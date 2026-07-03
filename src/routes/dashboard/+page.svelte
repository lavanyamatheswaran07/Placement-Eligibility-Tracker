<script>
  import { userStore, showToast } from '$lib/stores/auth';
  import { getCompanies } from '$lib/companyService';
  import { getApplications, applyToCompany } from '$lib/studentService';
  import { checkEligibility } from '$lib/eligibilityService';
  import { onMount } from 'svelte';

  // State arrays
  let companiesList = $state([]);
  let applicationsList = $state([]);
  let isLoadingData = $state(true);
  
  // Search/Filters
  let searchQuery = $state('');
  let cgpaFilter = $state(0);

  // Load companies & applications
  async function loadDashboardData() {
    try {
      const [comps, apps] = await Promise.all([
        getCompanies(),
        getApplications()
      ]);
      companiesList = comps;
      applicationsList = apps;
    } catch (err) {
      console.error(err);
      showToast('Failed to load companies or applications.', 'error');
    } finally {
      isLoadingData = false;
    }
  }

  onMount(() => {
    loadDashboardData();

    // Listen to localstorage updates for real-time reactivity in sandbox mode
    const syncMock = () => {
      loadDashboardData();
    };
    window.addEventListener('storage', syncMock);
    return () => window.removeEventListener('storage', syncMock);
  });

  // Calculate statistics
  let student = $derived($userStore || { cgpa: 0, arrears: 0, skills: [] });
  
  let eligibleCompaniesCount = $derived(
    companiesList.filter(comp => checkEligibility(student, comp)).length
  );
  
  let appliedCompaniesIds = $derived(
    applicationsList
      .filter(app => app.studentId === student.uid)
      .map(app => app.companyId)
  );

  let filteredCompanies = $derived(
    companiesList.filter(comp => {
      const matchesSearch = comp.companyName.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            comp.location.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCGPA = comp.minimumCGPA >= cgpaFilter;
      return matchesSearch && matchesCGPA;
    })
  );

  async function handleApply(companyId) {
    if (!student.uid) return;
    try {
      await applyToCompany(student.uid, companyId);
      showToast('Application submitted successfully!');
      await loadDashboardData();
    } catch (err) {
      showToast(err.message || 'Failed to submit application.', 'error');
    }
  }
</script>

<svelte:head>
  <title>Student Dashboard - Placement Eligibility Tracker</title>
</svelte:head>

<div class="space-y-6">
  <!-- Greeting -->
  <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-5">
    <div>
      <h1 class="text-3xl font-display font-bold bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
        Welcome Back, {student.name}!
      </h1>
      <p class="text-sm text-slate-500 dark:text-slate-400">
        Monitor your eligibility criteria, check guidelines, and apply for active campus drives.
      </p>
    </div>
  </div>

  <!-- Stat Cards -->
  <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
    <!-- Stat 1 -->
    <div class="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-5 rounded-2xl shadow-sm flex items-center gap-4 relative overflow-hidden">
      <div class="p-3.5 rounded-xl bg-brand-50 dark:bg-brand-950/40 text-brand-600 dark:text-brand-400">
        <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
        </svg>
      </div>
      <div>
        <span class="block text-xxs font-bold uppercase tracking-wider text-slate-400">Overall Status</span>
        <span class="block text-lg font-extrabold text-slate-900 dark:text-white mt-0.5">
          {student.arrears === 0 && student.cgpa >= 6.0 ? 'Eligible' : 'Check Criteria'}
        </span>
      </div>
      <div class="absolute bottom-0 right-0 w-12 h-12 bg-brand-500/5 rounded-tl-full"></div>
    </div>

    <!-- Stat 2 -->
    <div class="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-5 rounded-2xl shadow-sm flex items-center gap-4 relative overflow-hidden">
      <div class="p-3.5 rounded-xl bg-violet-50 dark:bg-violet-950/40 text-violet-600 dark:text-violet-400">
        <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/>
        </svg>
      </div>
      <div>
        <span class="block text-xxs font-bold uppercase tracking-wider text-slate-400">Eligible Drives</span>
        <span class="block text-lg font-extrabold text-slate-900 dark:text-white mt-0.5">
          {eligibleCompaniesCount} / {companiesList.length}
        </span>
      </div>
    </div>

    <!-- Stat 3 -->
    <div class="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-5 rounded-2xl shadow-sm flex items-center gap-4 relative overflow-hidden">
      <div class="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400">
        <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"/>
        </svg>
      </div>
      <div>
        <span class="block text-xxs font-bold uppercase tracking-wider text-slate-400">Applied Drives</span>
        <span class="block text-lg font-extrabold text-slate-900 dark:text-white mt-0.5">
          {appliedCompaniesIds.length} Drives
        </span>
      </div>
    </div>

    <!-- Stat 4 -->
    <div class="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-5 rounded-2xl shadow-sm flex items-center gap-4 relative overflow-hidden">
      <div class="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400">
        <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
        </svg>
      </div>
      <div>
        <span class="block text-xxs font-bold uppercase tracking-wider text-slate-400">Current Arrears</span>
        <span class="block text-lg font-extrabold text-slate-900 dark:text-white mt-0.5">
          {student.arrears} Active
        </span>
      </div>
    </div>
  </div>

  <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
    <!-- Left Column: Academic Credentials Card -->
    <div class="lg:col-span-1 space-y-6">
      <div class="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-6 rounded-2xl shadow-sm space-y-4">
        <div class="flex items-center justify-between">
          <h3 class="font-display font-bold text-base text-slate-900 dark:text-white">Academic Details</h3>
          <a href="/profile" class="text-xs font-semibold text-brand-600 hover:text-brand-500 dark:text-brand-400 hover:underline">Edit</a>
        </div>
        
        <div class="space-y-3 pt-2">
          <div class="flex justify-between text-sm">
            <span class="text-slate-400 font-medium">Department</span>
            <span class="font-bold text-slate-800 dark:text-slate-200">{student.department || 'Not Filled'}</span>
          </div>
          <div class="flex justify-between text-sm border-t border-slate-50 dark:border-slate-800/50 pt-3">
            <span class="text-slate-400 font-medium">CGPA</span>
            <span class="font-bold text-slate-850 dark:text-slate-100">{parseFloat(student.cgpa).toFixed(2)}</span>
          </div>
          <div class="flex justify-between text-sm border-t border-slate-50 dark:border-slate-800/50 pt-3">
            <span class="text-slate-400 font-medium">Active Arrears</span>
            <span class="font-bold {student.arrears > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'}">{student.arrears}</span>
          </div>
          <div class="border-t border-slate-50 dark:border-slate-800/50 pt-3">
            <span class="block text-xs text-slate-400 font-medium mb-2">Technical Skills</span>
            <div class="flex flex-wrap gap-1">
              {#if student.skills && student.skills.length > 0}
                {#each student.skills as skill}
                  <span class="text-xxs px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold">{skill}</span>
                {/each}
              {:else}
                <span class="text-xs text-slate-400 italic">No skills listed</span>
              {/if}
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Right Column: Companies List -->
    <div class="lg:col-span-2 space-y-6">
      <div class="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-sm p-6">
        <!-- Search and Filters header -->
        <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <h3 class="font-display font-bold text-base text-slate-900 dark:text-white">Active Placement Drives</h3>
          
          <div class="flex flex-wrap gap-3">
            <!-- Search -->
            <div class="relative max-w-xs">
              <span class="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 pointer-events-none">
                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
                </svg>
              </span>
              <input 
                type="text" 
                bind:value={searchQuery}
                placeholder="Search companies..."
                class="w-full pl-9 pr-4 py-2 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all text-xs font-semibold"
              />
            </div>
            
            <!-- CGPA Filter Dropdown -->
            <select 
              bind:value={cgpaFilter}
              class="px-3 py-2 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 text-xs font-semibold">
              <option value={0}>All CGPA Criteria</option>
              <option value={6}>Min 6.0+ CGPA</option>
              <option value={7}>Min 7.0+ CGPA</option>
              <option value={8}>Min 8.0+ CGPA</option>
            </select>
          </div>
        </div>

        {#if isLoadingData}
          <div class="py-12 flex items-center justify-center">
            <div class="w-8 h-8 rounded-full border-4 border-brand-500 border-t-transparent animate-spin"></div>
          </div>
        {:else if filteredCompanies.length === 0}
          <div class="py-12 text-center text-slate-500 dark:text-slate-400 border border-dashed border-slate-200 dark:border-slate-850 rounded-2xl">
            <svg class="w-8 h-8 mx-auto text-slate-300 dark:text-slate-700 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/>
            </svg>
            <p class="text-sm font-semibold">No placement drives found</p>
            <p class="text-xs text-slate-400 mt-1">Try adjusting your filters or search keywords.</p>
          </div>
        {:else}
          <!-- Companies Grid List -->
          <div class="space-y-4">
            {#each filteredCompanies as company}
              {@const isEligible = checkEligibility(student, company)}
              {@const hasApplied = appliedCompaniesIds.includes(company.id)}
              
              <div class="border border-slate-200/60 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-950/20 p-5 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all hover:border-slate-300 dark:hover:border-slate-750">
                <div class="space-y-2">
                  <div class="flex items-center gap-2.5 flex-wrap">
                    <h4 class="font-display font-bold text-base text-slate-900 dark:text-white">{company.companyName}</h4>
                    <span class="text-xxs px-2.5 py-0.5 rounded-full font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                      {company.location}
                    </span>
                    <span class="text-xxs px-2.5 py-0.5 rounded-full font-bold bg-brand-50 text-brand-700 dark:bg-brand-950/40 dark:text-brand-400">
                      {company.package}
                    </span>
                  </div>

                  <!-- Details and criteria -->
                  <div class="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500 dark:text-slate-400 font-medium">
                    <div>
                      <span class="font-semibold text-slate-400">Min CGPA:</span> {company.minimumCGPA.toFixed(1)}
                    </div>
                    <div>
                      <span class="font-semibold text-slate-400">Max Arrears:</span> {company.maximumArrears}
                    </div>
                    {#if company.requiredSkills && company.requiredSkills.length > 0}
                      <div class="flex items-center gap-1">
                        <span class="font-semibold text-slate-400">Skills:</span> 
                        <span class="text-slate-600 dark:text-slate-300">{company.requiredSkills.join(', ')}</span>
                      </div>
                    {/if}
                  </div>
                </div>

                <!-- Status and Action -->
                <div class="flex items-center gap-3 self-end md:self-center">
                  <!-- Eligibility Badge -->
                  {#if isEligible}
                    <span class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-900/50">
                      <div class="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                      Eligible
                    </span>
                  {:else}
                    <span class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-rose-50 text-rose-700 border border-rose-100 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-900/50">
                      <div class="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping"></div>
                      Not Eligible
                    </span>
                  {/if}

                  <!-- Action Button -->
                  {#if hasApplied}
                    <button 
                      disabled
                      class="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-600 rounded-xl font-bold text-xs border border-slate-200 dark:border-slate-700">
                      Applied
                    </button>
                  {:else}
                    <button 
                      disabled={!isEligible}
                      onclick={() => handleApply(company.id)}
                      class="px-4.5 py-2 rounded-xl font-bold text-xs transition-all active:scale-[0.98] cursor-pointer
                        {isEligible 
                          ? 'bg-brand-600 hover:bg-brand-500 text-white shadow-md shadow-brand-500/10' 
                          : 'bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-600 cursor-not-allowed border border-transparent'
                        }">
                      Apply Now
                    </button>
                  {/if}
                </div>
              </div>
            {/each}
          </div>
        {/if}
      </div>
    </div>
  </div>
</div>
