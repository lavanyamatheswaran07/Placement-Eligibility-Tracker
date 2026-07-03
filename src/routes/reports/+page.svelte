<script>
  import { getStudents } from '$lib/studentService';
  import { getCompanies } from '$lib/companyService';
  import { checkEligibility } from '$lib/eligibilityService';
  import { onMount } from 'svelte';
  import { showToast } from '$lib/stores/auth';

  // State
  let studentsList = $state([]);
  let companiesList = $state([]);
  let isLoading = $state(true);

  // Filters
  let cgpaCutoff = $state(6.0);
  let arrearsLimit = $state(0);
  let selectedCompanyId = $state('all'); // 'all' or specific company ID
  let selectedDept = $state('all');

  async function loadReportData() {
    try {
      const [studs, comps] = await Promise.all([
        getStudents(),
        getCompanies()
      ]);
      studentsList = studs;
      companiesList = comps;
    } catch (err) {
      showToast('Error loading report parameters.', 'error');
    } finally {
      isLoading = false;
    }
  }

  onMount(() => {
    loadReportData();
    
    // Sync sandbox changes
    const syncMock = () => {
      loadReportData();
    };
    window.addEventListener('storage', syncMock);
    return () => window.removeEventListener('storage', syncMock);
  });

  // Unique departments for filtering
  let departments = $derived(
    ['all', ...new Set(studentsList.map(s => s.department).filter(Boolean))]
  );

  // Get selected company details
  let selectedCompany = $derived(
    companiesList.find(c => c.id === selectedCompanyId) || null
  );

  // Check matching status of students
  let filteredStudents = $derived(
    studentsList.filter(student => {
      // 1. Base filters
      const matchCGPA = student.cgpa >= cgpaCutoff;
      const matchArrears = student.arrears <= arrearsLimit;
      const matchDept = selectedDept === 'all' || student.department === selectedDept;

      // 2. Company-specific criteria check
      let matchCompany = true;
      if (selectedCompanyId !== 'all' && selectedCompany) {
        matchCompany = checkEligibility(student, selectedCompany);
      }

      return matchCGPA && matchArrears && matchDept && matchCompany;
    })
  );

  // Statistics
  let avgCGPA = $derived(
    filteredStudents.length > 0
      ? (filteredStudents.reduce((acc, curr) => acc + curr.cgpa, 0) / filteredStudents.length).toFixed(2)
      : '0.00'
  );

  // Export CSV
  function exportCSV() {
    if (filteredStudents.length === 0) {
      showToast('No student records to export.', 'error');
      return;
    }

    // Build header
    const headers = ['Full Name', 'Email', 'Department', 'CGPA', 'Active Arrears', 'Skills', 'Eligible for Selected'];
    const rows = filteredStudents.map(student => {
      let eligibility = 'Yes';
      if (selectedCompanyId !== 'all' && selectedCompany) {
        eligibility = checkEligibility(student, selectedCompany) ? 'Eligible' : 'Not Eligible';
      }
      return [
        student.name,
        student.email,
        student.department || 'N/A',
        student.cgpa,
        student.arrears,
        Array.isArray(student.skills) ? student.skills.join('|') : student.skills,
        eligibility
      ];
    });

    const csvContent = [headers, ...rows]
      .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    
    // Naming of file
    const companyLabel = selectedCompany ? selectedCompany.companyName.replace(/\s+/g, '_') : 'All';
    link.setAttribute('href', url);
    link.setAttribute('download', `eligibility_report_cgpa_${cgpaCutoff}_${companyLabel}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    showToast('Student CSV exported successfully!');
  }

  // Trigger Print dialog (formatted for PDF print layouts)
  function triggerPrint() {
    window.print();
  }
</script>

<svelte:head>
  <title>Academic Eligibility Reports - Placement Eligibility Tracker</title>
</svelte:head>

<div class="space-y-6 print-container">
  <!-- Page Header -->
  <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-5 no-print">
    <div>
      <h1 class="text-3xl font-display font-bold bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
        Placement Reports
      </h1>
      <p class="text-sm text-slate-500 dark:text-slate-400">
        Generate and export customized eligibility lists based on specific CGPA thresholds, backlogs, and company criteria.
      </p>
    </div>
    
    <!-- Action buttons -->
    <div class="flex items-center gap-3">
      <button 
        onclick={exportCSV}
        class="px-4.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-bold text-slate-750 dark:text-slate-350 cursor-pointer flex items-center gap-1.5 transition-colors">
        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/>
        </svg>
        Export CSV
      </button>
      <button 
        onclick={triggerPrint}
        class="px-4.5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs shadow-md shadow-brand-500/10 active:scale-[0.98] cursor-pointer flex items-center gap-1.5 transition-all">
        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"/>
        </svg>
        Print / PDF
      </button>
    </div>
  </div>

  <!-- Print Only Header -->
  <div class="hidden print-only mb-6 border-b-2 border-slate-800 pb-4">
    <h1 class="text-2xl font-bold font-display uppercase tracking-wider text-slate-900">Placement Cell - Eligibility Report</h1>
    <p class="text-xs text-slate-500 font-semibold mt-1">Generated on: {new Date().toLocaleDateString()} | Campus Recruitment Office</p>
    
    <div class="grid grid-cols-3 gap-4 mt-4 bg-slate-50 p-4 rounded-xl text-xs">
      <div><span class="font-bold text-slate-400">Min CGPA Filter:</span> {cgpaCutoff}</div>
      <div><span class="font-bold text-slate-400">Max Arrears Filter:</span> {arrearsLimit}</div>
      <div><span class="font-bold text-slate-400">Target Company Criteria:</span> {selectedCompany ? selectedCompany.companyName : 'All Active'}</div>
    </div>
  </div>

  <!-- Filter Dashboard (no-print) -->
  <div class="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-6 rounded-2xl shadow-sm space-y-6 no-print">
    <h3 class="font-display font-bold text-base text-slate-900 dark:text-white">Report Filters</h3>
    
    <div class="grid grid-cols-1 md:grid-cols-4 gap-6">
      <!-- CGPA Threshold Slider -->
      <div class="space-y-2 md:col-span-2">
        <div class="flex justify-between text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
          <span>Minimum CGPA Cutoff</span>
          <span class="font-extrabold text-brand-600 dark:text-brand-400">{cgpaCutoff.toFixed(1)}</span>
        </div>
        <input 
          type="range" 
          min="5.0" 
          max="10.0" 
          step="0.1" 
          bind:value={cgpaCutoff}
          class="w-full h-2 bg-slate-100 dark:bg-slate-950 rounded-lg appearance-none cursor-pointer accent-brand-500" 
        />
        <div class="flex justify-between text-xxs text-slate-400">
          <span>5.0</span>
          <span>7.5</span>
          <span>10.0</span>
        </div>
      </div>

      <!-- Max Arrears allowed -->
      <div>
        <label for="arrearsLimit" class="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Max Arrears Allowed</label>
        <input 
          id="arrearsLimit"
          type="number" 
          min="0" 
          bind:value={arrearsLimit}
          class="block w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all text-xs font-semibold"
        />
      </div>

      <!-- Target Company Eligibility -->
      <div>
        <label for="selectedCompanyId" class="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Audit Target Company</label>
        <select 
          id="selectedCompanyId"
          bind:value={selectedCompanyId}
          class="block w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 text-xs font-semibold">
          <option value="all">Any Active Drive</option>
          {#each companiesList as comp}
            <option value={comp.id}>{comp.companyName} ({comp.minimumCGPA.toFixed(1)} CGPA / {comp.maximumArrears} Arr)</option>
          {/each}
        </select>
      </div>
    </div>

    <!-- Secondary Dept filter -->
    <div class="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between flex-wrap gap-3">
      <div class="flex items-center gap-2">
        <span class="text-xs font-semibold text-slate-400 uppercase tracking-wider">Department:</span>
        <div class="flex flex-wrap gap-1.5">
          {#each departments as dept}
            <button 
              onclick={() => selectedDept = dept}
              class="px-3.5 py-1.5 rounded-lg text-xxs font-bold transition-all cursor-pointer
                {selectedDept === dept
                  ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-950'
                  : 'bg-slate-50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }">
              {dept === 'all' ? 'All' : dept}
            </button>
          {/each}
        </div>
      </div>
    </div>
  </div>

  <!-- Matching Roster Table (Shows on screen AND Print) -->
  <div class="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
    
    <!-- Table Title + Mini KPI Statistics -->
    <div class="p-5 border-b border-slate-100 dark:border-slate-805 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <h3 class="font-display font-bold text-base text-slate-900 dark:text-white">Matching Applicants</h3>
        <p class="text-xxs text-slate-400 font-semibold no-print">List dynamically updates on changing parameters above.</p>
      </div>
      
      <!-- Stats indicators -->
      <div class="flex gap-4">
        <div class="px-4 py-2 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-100 dark:border-slate-850">
          <span class="block text-xxs text-slate-400 font-bold uppercase tracking-wider">Match Count</span>
          <span class="block text-sm font-extrabold text-slate-900 dark:text-white mt-0.5">{filteredStudents.length} Students</span>
        </div>
        <div class="px-4 py-2 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-100 dark:border-slate-850">
          <span class="block text-xxs text-slate-400 font-bold uppercase tracking-wider">Average CGPA</span>
          <span class="block text-sm font-extrabold text-slate-900 dark:text-white mt-0.5">{avgCGPA}</span>
        </div>
      </div>
    </div>

    <!-- Match table -->
    {#if isLoading}
      <div class="py-16 flex items-center justify-center">
        <div class="w-8 h-8 rounded-full border-4 border-brand-500 border-t-transparent animate-spin"></div>
      </div>
    {:else if filteredStudents.length === 0}
      <div class="py-16 text-center text-slate-500 dark:text-slate-400">
        <p class="text-sm font-bold">No students match current parameters</p>
        <p class="text-xs text-slate-400 mt-1">Try lowering the CGPA cutoff slider or selecting a different department.</p>
      </div>
    {:else}
      <div class="overflow-x-auto">
        <table class="w-full text-left border-collapse text-sm">
          <thead>
            <tr class="bg-slate-50 dark:bg-slate-950 text-slate-500 dark:text-slate-400 border-b border-slate-100 dark:border-slate-800 text-xxs font-bold uppercase tracking-wider">
              <th class="py-3 px-6">Candidate Name</th>
              <th class="py-3 px-6">Email</th>
              <th class="py-3 px-6">Department</th>
              <th class="py-3 px-6 text-center">CGPA</th>
              <th class="py-3 px-6 text-center">Arrears</th>
              <th class="py-3 px-6">Skills</th>
              {#if selectedCompanyId !== 'all'}
                <th class="py-3 px-6 text-right">Audit Status</th>
              {/if}
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100 dark:divide-slate-800/80">
            {#each filteredStudents as student}
              <tr class="hover:bg-slate-50/50 dark:hover:bg-slate-800/5 transition-colors">
                <td class="py-3.5 px-6 font-bold text-slate-900 dark:text-white">{student.name}</td>
                <td class="py-3.5 px-6 text-slate-500 dark:text-slate-400 text-xs">{student.email}</td>
                <td class="py-3.5 px-6 text-slate-650 dark:text-slate-350">{student.department || 'N/A'}</td>
                <td class="py-3.5 px-6 text-center font-extrabold text-slate-850 dark:text-white">{parseFloat(student.cgpa).toFixed(2)}</td>
                <td class="py-3.5 px-6 text-center font-extrabold {student.arrears > 0 ? 'text-amber-500' : 'text-slate-400'}">{student.arrears}</td>
                <td class="py-3.5 px-6 max-w-[200px] truncate text-slate-500 dark:text-slate-400 text-xs">
                  {Array.isArray(student.skills) ? student.skills.join(', ') : student.skills}
                </td>
                {#if selectedCompanyId !== 'all'}
                  {@const eligible = checkEligibility(student, selectedCompany)}
                  <td class="py-3.5 px-6 text-right">
                    <span class="inline-block text-xxs font-extrabold uppercase px-2 py-0.5 rounded
                      {eligible 
                        ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400' 
                        : 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400'
                      }">
                      {eligible ? 'Eligible' : 'Not Qualified'}
                    </span>
                  </td>
                {/if}
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    {/if}
  </div>
</div>

<style>
  /* Print-only CSS rules to strip layouts and format reports beautifully */
  @media print {
    :global(body) {
      background-color: white !important;
      color: black !important;
    }
    
    :global(aside), :global(header), .no-print {
      display: none !important;
    }
    
    .print-only {
      display: block !important;
    }
    
    .print-container {
      width: 100% !important;
      margin: 0 !important;
      padding: 0 !important;
      background: white !important;
    }

    table {
      width: 100% !important;
      border: 1px solid #cbd5e1 !important;
      border-collapse: collapse !important;
    }

    th, td {
      border: 1px solid #cbd5e1 !important;
      padding: 8px 12px !important;
    }

    th {
      background-color: #f8fafc !important;
      color: black !important;
    }
  }
</style>
