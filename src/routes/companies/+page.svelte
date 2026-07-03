<script>
  import { userStore, showToast } from '$lib/stores/auth';
  import { getCompanies, addCompany, updateCompany, deleteCompany } from '$lib/companyService';
  import { onMount } from 'svelte';

  // Component state
  let companiesList = $state([]);
  let isLoading = $state(true);
  
  // Search and sorting
  let searchQuery = $state('');
  let minCGPA = $state(0);
  
  // Form State
  let isFormOpen = $state(false);
  let editingId = $state(null); // null if adding, id string if editing
  
  let companyName = $state('');
  let minimumCGPA = $state(6.0);
  let maximumArrears = $state(0);
  let requiredSkills = $state('');
  let packageCTC = $state('');
  let location = $state('');

  async function loadCompanies() {
    try {
      companiesList = await getCompanies();
    } catch (err) {
      showToast('Failed to load companies database.', 'error');
    } finally {
      isLoading = false;
    }
  }

  onMount(() => {
    loadCompanies();
    
    // Sync updates in sandbox
    const syncMock = () => {
      loadCompanies();
    };
    window.addEventListener('storage', syncMock);
    return () => window.removeEventListener('storage', syncMock);
  });

  // Derived user details
  let user = $derived($userStore);
  let isAdmin = $derived(user?.role === 'admin');

  // Filtered companies
  let filteredCompanies = $derived(
    companiesList.filter(c => {
      const matchText = c.companyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        c.location.toLowerCase().includes(searchQuery.toLowerCase());
      const matchCGPA = minCGPA === 0 || c.minimumCGPA <= minCGPA;
      return matchText && matchCGPA;
    })
  );

  // Open form to ADD
  function openAddForm() {
    editingId = null;
    companyName = '';
    minimumCGPA = 6.0;
    maximumArrears = 0;
    requiredSkills = '';
    packageCTC = '';
    location = '';
    isFormOpen = true;
  }

  // Open form to EDIT
  function openEditForm(company) {
    editingId = company.id;
    companyName = company.companyName;
    minimumCGPA = company.minimumCGPA;
    maximumArrears = company.maximumArrears;
    requiredSkills = Array.isArray(company.requiredSkills) ? company.requiredSkills.join(', ') : '';
    packageCTC = company.package;
    location = company.location;
    isFormOpen = true;
  }

  // Submit Add or Edit Form
  async function handleSubmit(e) {
    e.preventDefault();
    if (!companyName || !packageCTC || !location) {
      showToast('Please fill out Name, Package, and Location.', 'error');
      return;
    }

    const payload = {
      companyName,
      minimumCGPA: parseFloat(minimumCGPA) || 0,
      maximumArrears: parseInt(maximumArrears) || 0,
      requiredSkills,
      package: packageCTC,
      location
    };

    try {
      if (editingId) {
        await updateCompany(editingId, payload);
        showToast('Company updated successfully!');
      } else {
        await addCompany(payload);
        showToast('New company drive added successfully!');
      }
      isFormOpen = false;
      await loadCompanies();
    } catch (err) {
      showToast(err.message || 'Error saving company requirements.', 'error');
    }
  }

  // Handle Delete
  async function handleDelete(id, name) {
    if (!confirm(`Are you sure you want to remove the placement drive for ${name}?`)) return;
    try {
      await deleteCompany(id);
      showToast(`${name} drive removed successfully.`);
      await loadCompanies();
    } catch (err) {
      showToast('Failed to delete company.', 'error');
    }
  }
</script>

<svelte:head>
  <title>Manage Companies - Placement Eligibility Tracker</title>
</svelte:head>

<div class="space-y-6">
  <!-- Page Header -->
  <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-5">
    <div>
      <h1 class="text-3xl font-display font-bold bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
        Placement Companies
      </h1>
      <p class="text-sm text-slate-500 dark:text-slate-400">
        {isAdmin 
          ? 'Add, update, and manage academic eligibility parameters for active recruitment drives.'
          : 'Browse all company recruitment opportunities and check eligibility criteria.'}
      </p>
    </div>
    
    {#if isAdmin}
      <button 
        onclick={openAddForm}
        class="px-5 py-3 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-bold text-sm shadow-md shadow-brand-500/10 active:scale-[0.98] transition-all cursor-pointer flex items-center gap-2 self-start md:self-center">
        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
        </svg>
        Add Company
      </button>
    {/if}
  </div>

  <!-- Form Panel (Collapsible Modal look) -->
  {#if isFormOpen && isAdmin}
    <div class="bg-white dark:bg-slate-900 border border-brand-500/20 dark:border-slate-800/80 rounded-2xl shadow-lg p-6 animate-fadeIn">
      <div class="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4 mb-6">
        <h3 class="font-display font-bold text-lg text-slate-950 dark:text-white">
          {editingId ? 'Edit Placement Details' : 'Add New Placement Drive'}
        </h3>
        <button 
          onclick={() => isFormOpen = false}
          class="p-2 rounded-xl text-slate-450 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          aria-label="Close Form">
          <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
          </svg>
        </button>
      </div>

      <form onsubmit={handleSubmit} class="space-y-6">
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label for="companyName" class="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Company Name</label>
            <input 
              id="companyName"
              type="text" 
              required 
              bind:value={companyName}
              class="block w-full px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all text-sm font-medium"
              placeholder="e.g. Google India" 
            />
          </div>

          <div>
            <label for="packageCTC" class="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">CTC Package (LPA / Salary)</label>
            <input 
              id="packageCTC"
              type="text" 
              required 
              bind:value={packageCTC}
              class="block w-full px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all text-sm font-medium"
              placeholder="e.g. 14 LPA" 
            />
          </div>

          <div>
            <label for="location" class="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Office Location</label>
            <input 
              id="location"
              type="text" 
              required 
              bind:value={location}
              class="block w-full px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all text-sm font-medium"
              placeholder="e.g. Bangalore, KA" 
            />
          </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label for="minimumCGPA" class="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Minimum CGPA Requirement</label>
            <input 
              id="minimumCGPA"
              type="number" 
              step="0.1" 
              min="0" 
              max="10" 
              required 
              bind:value={minimumCGPA}
              class="block w-full px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all text-sm font-medium"
            />
          </div>

          <div>
            <label for="maximumArrears" class="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Maximum Active Arrears Allowed</label>
            <input 
              id="maximumArrears"
              type="number" 
              min="0" 
              required 
              bind:value={maximumArrears}
              class="block w-full px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all text-sm font-medium"
            />
          </div>
        </div>

        <div>
          <label for="requiredSkills" class="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Required Skills (Comma-separated)</label>
          <input 
            id="requiredSkills"
            type="text" 
            bind:value={requiredSkills}
            class="block w-full px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all text-sm font-medium"
            placeholder="Python, SQL, Algorithms" 
          />
        </div>

        <div class="flex justify-end gap-3 pt-2">
          <button 
            type="button" 
            onclick={() => isFormOpen = false}
            class="px-5 py-3 rounded-xl border border-slate-200 dark:border-slate-800 font-semibold text-xs text-slate-750 dark:text-slate-350 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer">
            Cancel
          </button>
          <button 
            type="submit" 
            class="px-5 py-3 bg-brand-600 hover:bg-brand-500 text-white rounded-xl font-bold text-xs shadow-md shadow-brand-500/10 active:scale-[0.98] transition-all cursor-pointer">
            {editingId ? 'Update Drive' : 'Save Drive'}
          </button>
        </div>
      </form>
    </div>
  {/if}

  <!-- Search & Filter Controls -->
  <div class="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-5 rounded-2xl shadow-sm flex flex-col md:flex-row md:items-center gap-4">
    <!-- Search Query -->
    <div class="flex-1 relative">
      <span class="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400 pointer-events-none">
        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
        </svg>
      </span>
      <input 
        type="text" 
        bind:value={searchQuery}
        placeholder="Filter by company name or location..."
        class="w-full pl-10 pr-4 py-3 border border-slate-200 dark:border-slate-800 rounded-2xl bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all text-xs font-semibold"
      />
    </div>

    <!-- CGPA criteria slider/selector -->
    <div class="w-full md:w-64">
      <select 
        bind:value={minCGPA}
        class="w-full px-3 py-3 border border-slate-200 dark:border-slate-800 rounded-2xl bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 text-xs font-semibold">
        <option value={0}>All CGPA requirements</option>
        <option value={6}>CGPA threshold &le; 6.0</option>
        <option value={7}>CGPA threshold &le; 7.0</option>
        <option value={8}>CGPA threshold &le; 8.0</option>
      </select>
    </div>
  </div>

  <!-- Listings -->
  {#if isLoading}
    <div class="py-24 flex items-center justify-center">
      <div class="w-10 h-10 rounded-full border-4 border-brand-500 border-t-transparent animate-spin"></div>
    </div>
  {:else if filteredCompanies.length === 0}
    <div class="py-20 text-center border border-dashed border-slate-200 dark:border-slate-850 rounded-2xl bg-white dark:bg-slate-900">
      <svg class="w-12 h-12 mx-auto text-slate-350 dark:text-slate-700 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/>
      </svg>
      <h3 class="text-sm font-bold text-slate-900 dark:text-white">No Placement Drives Found</h3>
      <p class="text-xs text-slate-400 mt-1.5">No entries found matching your query criteria.</p>
    </div>
  {:else}
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {#each filteredCompanies as company}
        <div class="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-sm p-6 space-y-4 hover:shadow-md transition-shadow relative overflow-hidden flex flex-col justify-between min-h-[220px]">
          <div class="space-y-3">
            <div class="flex items-start justify-between">
              <div>
                <h3 class="font-display font-bold text-lg text-slate-900 dark:text-white leading-tight">{company.companyName}</h3>
                <span class="inline-block mt-1 text-xxs px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">{company.location}</span>
              </div>
              <span class="text-xs font-extrabold text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-950/40 px-3 py-1.5 rounded-xl">
                {company.package}
              </span>
            </div>

            <!-- Parameters -->
            <div class="space-y-2 border-t border-b border-slate-50 dark:border-slate-800/60 py-3">
              <div class="flex justify-between text-xs font-medium">
                <span class="text-slate-450">Min CGPA Cutoff:</span>
                <span class="font-bold text-slate-800 dark:text-slate-200">{company.minimumCGPA.toFixed(2)}</span>
              </div>
              <div class="flex justify-between text-xs font-medium">
                <span class="text-slate-450">Max Active Arrears:</span>
                <span class="font-bold text-slate-800 dark:text-slate-200">{company.maximumArrears}</span>
              </div>
              
              {#if company.requiredSkills && company.requiredSkills.length > 0}
                <div class="space-y-1.5 pt-1">
                  <span class="block text-xxs font-bold uppercase tracking-wider text-slate-400">Required Skills</span>
                  <div class="flex flex-wrap gap-1">
                    {#each company.requiredSkills as skill}
                      <span class="text-xxs px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-650 dark:text-slate-350 font-semibold">{skill}</span>
                    {/each}
                  </div>
                </div>
              {/if}
            </div>
          </div>

          <!-- Admin controls -->
          {#if isAdmin}
            <div class="flex items-center justify-end gap-2 pt-2 border-t border-slate-50 dark:border-slate-800/40">
              <button 
                onclick={() => openEditForm(company)}
                class="flex items-center gap-1 py-1.5 px-3 border border-slate-200 dark:border-slate-800 hover:border-brand-500/40 hover:bg-brand-50/20 dark:hover:bg-brand-950/15 text-xxs font-bold text-slate-600 dark:text-slate-400 hover:text-brand-650 rounded-lg transition-all cursor-pointer">
                <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/>
                </svg>
                Edit Parameters
              </button>
              <button 
                onclick={() => handleDelete(company.id, company.companyName)}
                class="flex items-center gap-1 py-1.5 px-3 border border-slate-250 dark:border-slate-800 hover:border-rose-500/40 hover:bg-rose-50/20 dark:hover:bg-rose-950/15 text-xxs font-bold text-rose-500/80 hover:text-rose-600 dark:hover:text-rose-450 rounded-lg transition-all cursor-pointer">
                <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                </svg>
                Delete
              </button>
            </div>
          {/if}
        </div>
      {/each}
    </div>
  {/if}
</div>
