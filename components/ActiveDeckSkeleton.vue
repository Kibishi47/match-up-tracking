<template>
  <div class="glass-panel p-6 sm:p-8 rounded-3xl border border-slate-800 shadow-2xl relative overflow-hidden animate-pulse bg-slate-900/70 min-h-[188px] flex flex-col justify-center">
    <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
      <!-- Deck info & Card stack skeleton -->
      <div class="flex items-center gap-6 sm:gap-8">
        <!-- Two overlapping cards skeleton -->
        <div class="relative w-28 h-32 flex-shrink-0">
          <div class="absolute left-0 top-2 w-20 h-28 rounded-xl bg-slate-800/80 border border-slate-700/60 shadow transform -rotate-6" />
          <div class="absolute left-8 top-0 w-20 h-28 rounded-xl bg-slate-700/80 border border-slate-600/60 shadow-lg transform rotate-6" />
        </div>

        <div class="space-y-3">
          <div class="h-4 w-28 bg-slate-800 rounded-full" />
          <div class="h-8 w-56 sm:w-72 bg-slate-700 rounded-xl" />
          <div class="h-5 w-40 bg-slate-800/80 rounded-lg" />
        </div>
      </div>

      <!-- Stats skeleton -->
      <div class="flex items-center gap-6 border-t lg:border-t-0 lg:border-l border-slate-800/80 pt-4 lg:pt-0 lg:pl-8 justify-between lg:justify-end">
        <div class="space-y-2 text-left lg:text-right">
          <div class="h-3 w-24 bg-slate-800 rounded-full lg:ml-auto" />
          <div class="h-9 w-28 bg-slate-700 rounded-xl lg:ml-auto" />
          <div class="h-3 w-20 bg-slate-800/60 rounded-full lg:ml-auto" />
        </div>
        <div class="w-16 h-16 rounded-2xl bg-slate-800/80 border border-slate-700/60 flex-shrink-0" />
      </div>
    </div>
  </div>
</template>
