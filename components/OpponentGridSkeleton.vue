<template>
  <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 animate-pulse">
    <div
      v-for="i in 8"
      :key="i"
      class="glass-panel p-4 rounded-2xl border border-slate-800 flex flex-col justify-between"
    >
      <div class="flex items-center gap-3 mb-3">
        <!-- 2 card skeletons -->
        <div class="flex items-center gap-1.5 flex-shrink-0">
          <div class="w-12 h-16 rounded-lg bg-slate-800 border border-slate-700/60" />
          <div class="w-12 h-16 rounded-lg bg-slate-800/60 border border-slate-700/40" />
        </div>

        <div class="flex-1 space-y-2">
          <div class="h-4 bg-slate-700 rounded-md w-3/4" />
          <div class="h-3 bg-slate-800 rounded-md w-1/2" />
        </div>
      </div>

      <!-- Action buttons skeleton -->
      <div class="mt-2 pt-3 border-t border-slate-800/80 grid grid-cols-2 gap-2">
        <div class="h-10 bg-slate-800 rounded-xl" />
        <div class="h-10 bg-slate-800 rounded-xl" />
      </div>
    </div>
  </div>
</template>
