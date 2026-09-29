<template>
  <div class="glass-panel p-6 sm:p-8 rounded-3xl border border-slate-800 shadow-2xl relative overflow-hidden animate-pulse">
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-6">
      <!-- Deck info & Card stack skeleton -->
      <div class="flex items-center gap-6">
        <!-- Two overlapping cards skeleton -->
        <div class="relative w-28 h-32 flex-shrink-0">
          <div class="absolute left-0 top-2 w-20 h-28 rounded-xl bg-slate-800/80 border border-slate-700/60 shadow transform -rotate-6" />
          <div class="absolute left-7 top-0 w-20 h-28 rounded-xl bg-slate-700/80 border border-slate-600/60 shadow-lg transform rotate-6" />
        </div>

        <div class="space-y-3">
          <div class="h-4 w-28 bg-slate-800 rounded-full" />
          <div class="h-8 w-56 bg-slate-700 rounded-xl" />
          <div class="h-4 w-40 bg-slate-800/60 rounded-full" />
        </div>
      </div>

      <!-- Stats skeleton -->
      <div class="flex items-center gap-4 border-t md:border-t-0 md:border-l border-slate-800/80 pt-4 md:pt-0 md:pl-8">
        <div class="space-y-2 text-right">
          <div class="h-3 w-20 bg-slate-800 rounded-full ml-auto" />
          <div class="h-9 w-24 bg-slate-700 rounded-xl ml-auto" />
          <div class="h-3 w-16 bg-slate-800/60 rounded-full ml-auto" />
        </div>
        <div class="w-16 h-16 rounded-2xl bg-slate-800/80" />
      </div>
    </div>
  </div>
</template>
