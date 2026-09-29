<template>
  <div class="glass-panel p-6 rounded-3xl border border-slate-800 shadow-xl animate-pulse">
    <div class="flex items-center justify-between mb-4">
      <div class="h-6 w-48 bg-slate-700 rounded-lg" />
      <div class="h-4 w-20 bg-slate-800 rounded-full" />
    </div>

    <div class="divide-y divide-slate-800/80">
      <div v-for="i in 5" :key="i" class="py-3.5 flex items-center justify-between gap-4">
        <div class="flex items-center gap-3">
          <div class="w-8 h-8 rounded-lg bg-slate-800" />
          <div class="space-y-1.5">
            <div class="h-4 w-44 bg-slate-700 rounded-md" />
            <div class="h-3 w-28 bg-slate-800/60 rounded-md" />
          </div>
        </div>
        <div class="flex gap-2">
          <div class="h-7 w-14 bg-slate-800 rounded-lg" />
          <div class="h-7 w-16 bg-slate-800 rounded-lg" />
        </div>
      </div>
    </div>
  </div>
</template>
