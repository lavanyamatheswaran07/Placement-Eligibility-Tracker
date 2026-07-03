<script>
  import Button from './Button.svelte';

  let { 
    show = false, 
    title = '', 
    onclose = () => {},
    children 
  } = $props();

  function handleClose() {
    onclose();
  }

  function handleKeydown(e) {
    if (e.key === 'Escape' && show) {
      handleClose();
    }
  }
</script>

<svelte:window onkeydown={handleKeydown} />

{#if show}
  <div class="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
    <div class="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
      
      <!-- Backdrop -->
      <div 
        class="fixed inset-0 bg-slate-950/80 backdrop-blur-sm transition-opacity" 
        aria-hidden="true"
        onclick={handleClose}
      ></div>

      <!-- Centered content helper -->
      <span class="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

      <!-- Modal Content Card -->
      <div class="relative inline-block align-bottom bg-slate-900 border border-slate-700 rounded-3xl text-left overflow-hidden shadow-2xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
        
        <!-- Header -->
        <div class="px-6 pt-6 pb-4 flex justify-between items-center border-b border-slate-800">
          <h3 class="text-xl font-bold text-slate-100 font-display" id="modal-title">
            {title}
          </h3>
          <button 
            type="button" 
            onclick={handleClose}
            class="text-slate-400 hover:text-slate-200 focus:outline-none transition-colors p-1.5 hover:bg-slate-800 rounded-xl"
          >
            <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <!-- Body -->
        <div class="px-6 py-4 max-h-[70vh] overflow-y-auto">
          {#if children}
            {@render children()}
          {/if}
        </div>
      </div>
    </div>
  </div>
{/if}
