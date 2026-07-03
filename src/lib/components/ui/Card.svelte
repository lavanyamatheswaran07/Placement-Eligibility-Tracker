<script>
  let { 
    class: customClass = '', 
    hoverable = false,
    children 
  } = $props();
</script>

<div 
  class="bg-slate-800/40 backdrop-blur-xl border border-slate-700/60 rounded-2xl p-6 shadow-xl transition-all duration-300
         {hoverable ? 'hover:-translate-y-1 hover:border-slate-600/80 hover:bg-slate-800/60 hover:shadow-blue-500/5' : ''}
         {customClass}"
>
  {#if children}
    {@render children()}
  {/if}
</div>
