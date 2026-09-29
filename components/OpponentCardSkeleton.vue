<template>
  <div class="glass-panel p-4 rounded-2xl border border-slate-800 flex flex-col justify-between min-h-[172px] animate-pulse bg-slate-900/60">
    <div>
      <div class="flex items-center gap-2.5 mb-3">
        <!-- 2 thumbnails skeleton -->
        <div class="flex items-center gap-1.5 flex-shrink-0">
          <div class="w-12 h-16 rounded-lg bg-slate-800 border border-slate-700/60" />
          <div class="w-12 h-16 rounded-lg bg-slate-800/60 border border-slate-700/40" />
        </div>

        <div class="min-w-0 flex-1 space-y-2">
          <div class="h-4 bg-slate-700 rounded-md w-3/4" />
          <div class="flex items-center gap-1.5">
            <div class="h-4 w-14 bg-slate-800 rounded-md" />
            <div class="h-4 w-12 bg-slate-800/80 rounded-md" />
          </div>
        </div>
      </div>
    </div>

    <!-- Quick Action Buttons skeleton (3 buttons 1:1) -->
    <div class="mt-2 pt-3 border-t border-slate-800/80 grid grid-cols-3 gap-1.5">
      <div class="h-8 bg-slate-800/80 rounded-xl" />
      <div class="h-8 bg-slate-800/80 rounded-xl" />
      <div class="h-8 bg-slate-800/80 rounded-xl" />
    </div>
  </div>
</template>
