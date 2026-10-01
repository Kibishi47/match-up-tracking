<template>
  <div class="glass-panel p-4 sm:p-6 lg:p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl relative overflow-hidden animate-pulse bg-white/80 dark:bg-slate-900/70 flex flex-col justify-center">
    <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-4 sm:gap-6">
      <!-- Deck info & Card stack skeleton -->
      <div class="flex items-center gap-3.5 sm:gap-6">
        <!-- Two overlapping cards skeleton -->
        <div class="relative w-24 h-28 sm:w-28 sm:h-32 flex-shrink-0">
          <div class="absolute left-0 top-1 sm:top-2 w-16 h-24 sm:w-20 sm:h-28 rounded-xl bg-slate-200 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700/60 shadow transform -rotate-6" />
          <div class="absolute left-6 sm:left-8 top-0 w-16 h-24 sm:w-20 sm:h-28 rounded-xl bg-slate-300 dark:bg-slate-700/80 border border-slate-300 dark:border-slate-600/60 shadow-lg transform rotate-6" />
        </div>

        <div class="space-y-2 sm:space-y-3 flex-1 min-w-0">
          <div class="h-3.5 w-24 bg-slate-200 dark:bg-slate-800 rounded-full" />
          <div class="h-6 sm:h-8 w-44 sm:w-64 bg-slate-300 dark:bg-slate-700 rounded-xl" />
          <div class="h-3.5 w-28 bg-slate-200 dark:bg-slate-800/80 rounded-md sm:hidden" />
          <div class="h-4 w-32 bg-slate-200 dark:bg-slate-800/80 rounded-lg" />
        </div>
      </div>

      <!-- Stats skeleton -->
      <div class="flex items-center gap-4 sm:gap-6 border-t lg:border-t-0 lg:border-l border-slate-200/80 dark:border-slate-800/80 pt-2.5 lg:pt-0 lg:pl-8 justify-between lg:justify-end">
        <div class="space-y-1.5 sm:space-y-2 text-left lg:text-right">
          <div class="h-3 w-20 sm:w-24 bg-slate-200 dark:bg-slate-800 rounded-full lg:ml-auto" />
          <div class="h-7 sm:h-9 w-24 sm:w-28 bg-slate-300 dark:bg-slate-700 rounded-xl lg:ml-auto" />
          <div class="h-3 w-16 sm:w-20 bg-slate-200 dark:bg-slate-800/60 rounded-full lg:ml-auto" />
        </div>
        <div class="w-12 h-12 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl bg-slate-200 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700/60 flex-shrink-0" />
      </div>
    </div>
  </div>
</template>
