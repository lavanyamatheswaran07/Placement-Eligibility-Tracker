<script>
  import { userStore, showToast } from '$lib/stores/auth';
  import { getStudents, updateStudent } from '$lib/studentService';
  import { getCompanies } from '$lib/companyService';
  import { checkEligibility } from '$lib/eligibilityService';
  import { onMount } from 'svelte';

  // Table lists
  let studentsList = $state([]);
  let companiesList = $state([]);
  let isLoading = $state(true);

  // Search & Filter
  let searchQuery = $state('');
  let filterEligibleOnly = $state(false);

  // Quick Edit Modal State
  let isEditModalOpen = $state(false);
  let editUid = $state('');
  let editName = $state('');
  let editDept = $state('');
  let editCGPA = $state(0);
  let editArrears = $state(0);
  let editSkills = $state('');

  async function loadDashboardData() {
    try {
      const [studs, comps] = await Promise.all([
        getStudents(),
        getCompanies()
      ]);
      studentsList = studs;
      companiesList = comps;
    } catch (err) {
      showToast('Error fetching dashboard statistics.', 'error');
    } finally {
      isLoading = false;
    }
  }

  onMount(() => {
    loadDashboardData();

    // Listen for mock changes across tabs
    const syncMock = () => {
      loadDashboardData();
    };
    window.addEventListener('storage', syncMock);
    return () => window.removeEventListener('storage', syncMock);
  });

  // Check if student qualifies for at least one active company drive
  function isStudentEligibleForAny(student) {
    if (companiesList.length === 0) return false;
    return companiesList.some(company => checkEligibility(student, company));
  }

  // Calculate statistics
  let totalStudents = $derived(studentsList.length);
  let totalCompanies = $derived(companiesList.length);
  
  let eligibleStudents = $derived(
    studentsList.filter(s => isStudentEligibleForAny(s))
  );
  let eligibleCount = $derived(eligibleStudents.length);
  let placementPercentage = $derived(
    totalStudents > 0 ? Math.round((eligibleCount / totalStudents) * 100) : 0
  );

  // Filtered lists
  let filteredStudents = $derived(
    studentsList.filter(s => {
      const matchesSearch = s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            s.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            s.department.toLowerCase().includes(searchQuery.toLowerCase());
      
      const isEligible = isStudentEligibleForAny(s);
      const matchesEligibility = !filterEligibleOnly || isEligible;
      
      return matchesSearch && matchesEligibility;
    })
  );

  // Open Edit Modal
  function openEditModal(student) {
    editUid = student.uid || student.id;
    editName = student.name;
    editDept = student.department;
    editCGPA = student.cgpa;
    editArrears = student.arrears;
    editSkills = Array.isArray(student.skills) ? student.skills.join(', ') : '';
    isEditModalOpen = true;
  }

  // Submit Edit Form
  async function handleUpdateStudentSubmit(e) {
    e.preventDefault();
    if (!editName) {
      showToast('Name is required', 'error');
      return;
    }
    if (editCGPA < 0 || editCGPA > 10) {
      showToast('CGPA must be between 0.0 and 10.0', 'error');
      return;
    }

    try {
      const skillsArr = editSkills
        ? editSkills.split(',').map(s => s.trim()).filter(Boolean)
        : [];

      await updateStudent(editUid, {
        name: editName,
        department: editDept,
        cgpa: parseFloat(editCGPA),
        arrears: parseInt(editArrears),
        skills: skillsArr
      });

      showToast('Student academic details updated!');
      isEditModalOpen = false;
      await loadDashboardData();
    } catch (err) {
      showToast('Failed to update student academic record.', 'error');
    }
  }
</script>

<svelte:head>
  <title>Admin Panel - Placement Eligibility Tracker</title>
</svelte:head>

<div class="space-y-6">
  <!-- Greeting -->
  <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-5">
    <div>
      <h1 class="text-3xl font-display font-bold bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
        Admin Dashboard
      </h1>
      <p class="text-sm text-slate-500 dark:text-slate-400">
        Review real-time college-wide statistics, check metrics, and audit student academic profile credentials.
      </p>
    </div>
  </div>

  <!-- Stat Cards -->
  <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
    <!-- Total Students -->
    <div class="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-5 rounded-2xl shadow-sm flex items-center gap-4 relative overflow-hidden">
      <div class="p-3.5 rounded-xl bg-brand-50 dark:bg-brand-950/40 text-brand-600 dark:text-brand-400">
        <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"/>
        </svg>
      </div>
      <div>
        <span class="block text-xxs font-bold uppercase tracking-wider text-slate-400">Total Students</span>
        <span class="block text-2xl font-extrabold text-slate-900 dark:text-white mt-0.5">{totalStudents}</span>
      </div>
      <div class="absolute bottom-0 right-0 w-12 h-12 bg-brand-500/5 rounded-tl-full"></div>
    </div>

    <!-- Total Companies -->
    <div class="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-5 rounded-2xl shadow-sm flex items-center gap-4 relative overflow-hidden">
      <div class="p-3.5 rounded-xl bg-violet-50 dark:bg-violet-950/40 text-violet-600 dark:text-violet-400">
        <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/>
        </svg>
      </div>
      <div>
        <span class="block text-xxs font-bold uppercase tracking-wider text-slate-400">Total Companies</span>
        <span class="block text-2xl font-extrabold text-slate-900 dark:text-white mt-0.5">{totalCompanies}</span>
      </div>
    </div>

    <!-- Eligible Students -->
    <div class="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-5 rounded-2xl shadow-sm flex items-center gap-4 relative overflow-hidden">
      <div class="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400">
        <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
        </svg>
      </div>
      <div>
        <span class="block text-xxs font-bold uppercase tracking-wider text-slate-400">Eligible Students</span>
        <span class="block text-2xl font-extrabold text-slate-900 dark:text-white mt-0.5">{eligibleCount}</span>
      </div>
    </div>

    <!-- Placement Percentage -->
    <div class="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-5 rounded-2xl shadow-sm flex items-center gap-4 relative overflow-hidden">
      <div class="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400">
        <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
        </svg>
      </div>
      <div>
        <span class="block text-xxs font-bold uppercase tracking-wider text-slate-400">Eligibility Ratio</span>
        <span class="block text-2xl font-extrabold text-slate-900 dark:text-white mt-0.5">{placementPercentage}%</span>
      </div>
    </div>
  </div>

  <!-- Student Database Table -->
  <div class="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
    
    <!-- Table Controls Header -->
    <div class="p-5 border-b border-slate-100 dark:border-slate-805 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
      <h3 class="font-display font-bold text-base text-slate-900 dark:text-white">Student Registration Roster</h3>
      
      <div class="flex flex-wrap items-center gap-3">
        <!-- Search input -->
        <div class="relative max-w-xs">
          <span class="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 pointer-events-none">
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
            </svg>
          </span>
          <input 
            type="text" 
            bind:value={searchQuery}
            placeholder="Search students..."
            class="w-full pl-9 pr-4 py-2.5 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all text-xs font-semibold"
          />
        </div>
        
        <!-- Toggle Eligible Only Checkbox Button -->
        <button 
          onclick={() => filterEligibleOnly = !filterEligibleOnly}
          class="flex items-center gap-2 px-4.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-bold transition-all cursor-pointer
            {filterEligibleOnly 
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-950/20 dark:border-emerald-900/50 dark:text-emerald-400' 
              : 'text-slate-650 hover:bg-slate-50 dark:text-slate-450 dark:hover:bg-slate-800'
            }">
          <div class="w-2 h-2 rounded-full {filterEligibleOnly ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-600'}"></div>
          Eligible Candidates
        </button>
      </div>
    </div>

    <!-- Roster Grid / Table -->
    {#if isLoading}
      <div class="py-24 flex items-center justify-center">
        <div class="w-10 h-10 rounded-full border-4 border-brand-500 border-t-transparent animate-spin"></div>
      </div>
    {:else if filteredStudents.length === 0}
      <div class="py-16 text-center text-slate-500 dark:text-slate-400">
        <svg class="w-10 h-10 mx-auto text-slate-300 dark:text-slate-700 mb-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"/>
        </svg>
        <p class="text-sm font-bold">No students matched filters</p>
        <p class="text-xs text-slate-400 mt-1">Refine your keywords or uncheck the 'Eligible Candidates' toggle.</p>
      </div>
    {:else}
      <div class="overflow-x-auto">
        <table class="w-full text-left border-collapse text-sm">
          <thead>
            <tr class="bg-slate-50 dark:bg-slate-950 text-slate-500 dark:text-slate-400 border-b border-slate-100 dark:border-slate-800 text-xxs font-bold uppercase tracking-wider">
              <th class="py-4 px-6">Student Details</th>
              <th class="py-4 px-6">Department</th>
              <th class="py-4 px-6 text-center">CGPA</th>
              <th class="py-4 px-6 text-center">Arrears</th>
              <th class="py-4 px-6">Skills</th>
              <th class="py-4 px-6 text-center">Status</th>
              <th class="py-4 px-6 text-right">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100 dark:divide-slate-800/80">
            {#each filteredStudents as student}
              {@const eligible = isStudentEligibleForAny(student)}
              <tr class="hover:bg-slate-50/50 dark:hover:bg-slate-800/10 transition-colors">
                <!-- Info -->
                <td class="py-4.5 px-6">
                  <div class="flex items-center gap-3">
                    <div class="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-bold text-slate-700 dark:text-slate-350">
                      {student.name ? student.name[0].toUpperCase() : 'S'}
                    </div>
                    <div>
                      <p class="font-bold text-slate-900 dark:text-white leading-tight">{student.name}</p>
                      <p class="text-xxs text-slate-400 mt-0.5">{student.email}</p>
                    </div>
                  </div>
                </td>
                
                <!-- Department -->
                <td class="py-4.5 px-6 font-semibold text-slate-650 dark:text-slate-350">
                  {student.department || 'Not Set'}
                </td>
                
                <!-- CGPA -->
                <td class="py-4.5 px-6 text-center font-extrabold text-slate-900 dark:text-white">
                  {parseFloat(student.cgpa).toFixed(2)}
                </td>
                
                <!-- Arrears -->
                <td class="py-4.5 px-6 text-center font-extrabold {student.arrears > 0 ? 'text-amber-500' : 'text-slate-400'}">
                  {student.arrears}
                </td>
                
                <!-- Skills -->
                <td class="py-4.5 px-6 max-w-[200px]">
                  <div class="flex flex-wrap gap-1">
                    {#if student.skills && student.skills.length > 0}
                      {#each student.skills as skill}
                        <span class="text-xxs px-2 py-0.5 rounded-md bg-slate-50 dark:bg-slate-800 border border-slate-150 dark:border-slate-750 text-slate-600 dark:text-slate-350 font-medium">
                          {skill}
                        </span>
                      {/each}
                    {:else}
                      <span class="text-xxs text-slate-400 italic">None listed</span>
                    {/if}
                  </div>
                </td>

                <!-- Status Badge -->
                <td class="py-4.5 px-6 text-center">
                  {#if eligible}
                    <span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xxs font-extrabold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400">
                      Eligible
                    </span>
                  {:else}
                    <span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xxs font-extrabold bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                      Not Eligible
                    </span>
                  {/if}
                </td>
                
                <!-- Actions -->
                <td class="py-4.5 px-6 text-right">
                  <button 
                    onclick={() => openEditModal(student)}
                    class="py-1.5 px-3 border border-slate-200 dark:border-slate-800 hover:border-brand-500/40 hover:bg-brand-50/20 dark:hover:bg-brand-950/20 rounded-lg text-xxs font-extrabold text-slate-700 dark:text-slate-300 hover:text-brand-650 transition-all cursor-pointer">
                    Edit Record
                  </button>
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    {/if}
  </div>
</div>

<!-- Edit Student Details Modal -->
{#if isEditModalOpen}
  <div class="fixed inset-0 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm z-50 animate-fadeIn">
    <div class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-lg rounded-2xl shadow-2xl p-6 relative">
      <div class="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 mb-5">
        <h3 class="font-display font-bold text-lg text-slate-900 dark:text-white">Edit Academic Record</h3>
        <button 
          onclick={() => isEditModalOpen = false}
          class="p-1.5 rounded-xl text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          aria-label="Close modal">
          <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
          </svg>
        </button>
      </div>

      <form onsubmit={handleUpdateStudentSubmit} class="space-y-4">
        <div>
          <label for="editName" class="block text-xxs font-bold uppercase tracking-wider text-slate-450 mb-2">Student Name</label>
          <input 
            id="editName"
            type="text" 
            required 
            bind:value={editName}
            class="block w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all text-xs font-semibold"
          />
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div>
            <label for="editCGPA" class="block text-xxs font-bold uppercase tracking-wider text-slate-450 mb-2">CGPA</label>
            <input 
              id="editCGPA"
              type="number" 
              step="0.01" 
              min="0" 
              max="10" 
              required 
              bind:value={editCGPA}
              class="block w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all text-xs font-semibold"
            />
          </div>
          <div>
            <label for="editArrears" class="block text-xxs font-bold uppercase tracking-wider text-slate-450 mb-2">Active Arrears</label>
            <input 
              id="editArrears"
              type="number" 
              min="0" 
              required 
              bind:value={editArrears}
              class="block w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all text-xs font-semibold"
            />
          </div>
        </div>

        <div>
          <label for="editDept" class="block text-xxs font-bold uppercase tracking-wider text-slate-450 mb-2">Department</label>
          <select 
            id="editDept"
            bind:value={editDept}
            class="block w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 text-xs font-semibold">
            <option value="Computer Science">Computer Science</option>
            <option value="Information Technology">Information Technology</option>
            <option value="Electronics & Communication">Electronics & Communication</option>
            <option value="Electrical Engineering">Electrical Engineering</option>
            <option value="Mechanical Engineering">Mechanical Engineering</option>
            <option value="Civil Engineering">Civil Engineering</option>
          </select>
        </div>

        <div>
          <label for="editSkills" class="block text-xxs font-bold uppercase tracking-wider text-slate-450 mb-2">Skills (Comma-separated)</label>
          <input 
            id="editSkills"
            type="text" 
            bind:value={editSkills}
            class="block w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all text-xs font-semibold"
            placeholder="Python, SQL, Angular" 
          />
        </div>

        <div class="flex justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
          <button 
            type="button" 
            onclick={() => isEditModalOpen = false}
            class="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-700 dark:text-slate-350 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer">
            Cancel
          </button>
          <button 
            type="submit" 
            class="px-5 py-2.5 bg-brand-600 hover:bg-brand-500 text-white rounded-xl font-extrabold text-xs shadow-md shadow-brand-500/10 active:scale-[0.98] transition-all cursor-pointer">
            Update Student
          </button>
        </div>
      </form>
    </div>
  </div>
{/if}
