<template>
  <div class="glass-card p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 flex flex-col justify-between animate-pulse shadow-sm min-h-[148px]">
    <div>
      <div class="flex items-start gap-3 mb-3">
        <!-- Visual cards stack skeleton -->
        <div class="relative w-14 h-16 flex-shrink-0">
          <div class="absolute left-0 top-1 w-10 h-14 rounded-lg bg-slate-200 dark:bg-slate-800 border border-slate-300 dark:border-slate-700/60 transform -rotate-6" />
          <div class="absolute left-3.5 top-0.5 w-10 h-14 rounded-lg bg-slate-300 dark:bg-slate-700/80 border border-slate-300 dark:border-slate-600/60 transform rotate-6 shadow-sm" />
        </div>

        <!-- Text placeholders -->
        <div class="min-w-0 flex-1 space-y-2 pt-0.5">
          <div class="h-4 bg-slate-300 dark:bg-slate-700 rounded-md w-3/4" />
          <div class="h-3 bg-slate-200 dark:bg-slate-800 rounded-md w-1/2" />
        </div>
      </div>
    </div>

    <!-- Action buttons skeleton at bottom -->
    <div class="pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-end gap-1.5">
      <div class="h-6 w-14 bg-slate-200 dark:bg-slate-800 rounded-lg" />
      <div class="h-6 w-16 bg-slate-200 dark:bg-slate-800 rounded-lg" />
      <div class="h-6 w-16 bg-slate-200 dark:bg-slate-800 rounded-lg" />
    </div>
  </div>
</template>
