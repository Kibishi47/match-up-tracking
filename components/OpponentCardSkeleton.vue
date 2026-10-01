<template>
  <div class="glass-panel p-4 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col justify-between min-h-[172px] animate-pulse bg-white dark:bg-slate-900/60 shadow-sm">
    <div>
      <div class="flex items-start gap-2.5 mb-3">
        <!-- Fan cards skeleton -->
        <div class="relative w-14 h-16 flex-shrink-0">
          <div class="absolute left-0 top-1 w-10 h-14 rounded-lg bg-slate-200 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700/60 transform -rotate-6" />
          <div class="absolute left-3.5 top-0.5 w-10 h-14 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700/40 transform rotate-6 shadow-sm" />
        </div>

        <div class="min-w-0 flex-1 space-y-1.5">
          <div class="h-4 bg-slate-300 dark:bg-slate-700 rounded-md w-3/4" />
          <div class="h-3 bg-slate-200 dark:bg-slate-800 rounded w-1/2" />
          <div class="flex items-center gap-1.5 pt-0.5">
            <div class="h-4 w-14 bg-slate-200 dark:bg-slate-800 rounded-md" />
            <div class="h-4 w-12 bg-slate-200 dark:bg-slate-800/80 rounded-md" />
          </div>
        </div>
      </div>
    </div>

    <!-- Quick Action Buttons skeleton (3 buttons 1:1, 44px min-height) -->
    <div class="mt-2 pt-3 border-t border-slate-100 dark:border-slate-800/80 grid grid-cols-3 gap-1.5">
      <div class="h-11 bg-slate-200 dark:bg-slate-800/80 rounded-xl" />
      <div class="h-11 bg-slate-200 dark:bg-slate-800/80 rounded-xl" />
      <div class="h-11 bg-slate-200 dark:bg-slate-800/80 rounded-xl" />
    </div>
  </div>
</template>
