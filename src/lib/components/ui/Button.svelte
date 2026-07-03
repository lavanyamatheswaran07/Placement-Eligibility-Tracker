<script>
  let { 
    type = 'button', 
    variant = 'primary', 
    size = 'md', 
    disabled = false, 
    onclick = null, 
    class: customClass = '', 
    children 
  } = $props();

  const baseStyles = 'inline-flex items-center justify-center font-semibold rounded-xl transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed';
  
  const variants = {
    primary: 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-lg shadow-blue-500/20 focus:ring-blue-500 border border-transparent',
    secondary: 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 focus:ring-slate-500',
    danger: 'bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white shadow-lg shadow-rose-500/20 focus:ring-rose-500 border border-transparent',
    outline: 'border border-slate-700 hover:bg-slate-800 hover:text-white text-slate-300 focus:ring-slate-500',
    success: 'bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 text-white shadow-lg shadow-emerald-500/20 focus:ring-emerald-500 border border-transparent'
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-5 py-2.5 text-sm',
    lg: 'px-6 py-3 text-base'
  };
</script>

<button
  {type}
  {disabled}
  {onclick}
  class="{baseStyles} {variants[variant]} {sizes[size]} {customClass}"
>
  {#if children}
    {@render children()}
  {/if}
</button>
