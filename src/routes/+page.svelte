<script>
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { userStore, authLoading } from '$lib/stores/auth';

  onMount(() => {
    // Redirection is handled reactively by +layout.svelte,
    // but we add a fallback to redirect immediately on mount if initialized.
    if (!$authLoading) {
      if ($userStore) {
        if ($userStore.role === 'admin') {
          goto('/admin');
        } else {
          goto('/dashboard');
        }
      } else {
        goto('/login');
      }
    }
  });
</script>

<div class="flex items-center justify-center min-h-[50vh]">
  <div class="animate-pulse flex flex-col items-center">
    <div class="w-12 h-12 rounded-full border-4 border-brand-500 border-t-transparent animate-spin mb-4"></div>
    <span class="text-sm text-slate-500 dark:text-slate-400 font-medium">Navigating to dashboard...</span>
  </div>
</div>
