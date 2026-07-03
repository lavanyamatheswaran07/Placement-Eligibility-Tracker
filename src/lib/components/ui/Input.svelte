<script>
  let {
    id,
    label = '',
    type = 'text',
    value = $bindable(''),
    placeholder = '',
    required = false,
    disabled = false,
    error = '',
    min = undefined,
    max = undefined,
    step = undefined,
    class: customClass = ''
  } = $props();
</script>

<div class="flex flex-col gap-1 w-full {customClass}">
  {#if label}
    <label for={id} class="text-xs font-semibold text-slate-400 tracking-wide uppercase">
      {label}
      {#if required}<span class="text-red-500 ml-0.5">*</span>{/if}
    </label>
  {/if}
  
  <div class="relative">
    <input
      {id}
      {type}
      bind:value={value}
      {placeholder}
      {required}
      {disabled}
      {min}
      {max}
      {step}
      class="w-full px-4 py-3 bg-slate-800/80 border rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300
      {error ? 'border-red-500/60 focus:ring-red-500' : 'border-slate-700/80 hover:border-slate-600 focus:border-blue-500'}
      disabled:opacity-50 disabled:cursor-not-allowed"
    />
  </div>

  {#if error}
    <span class="text-xs text-red-400 mt-1 font-medium">{error}</span>
  {/if}
</div>
