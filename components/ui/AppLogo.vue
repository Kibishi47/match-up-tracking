<template>
  <NuxtLink
    to="/"
    class="group inline-flex items-center gap-2.5 select-none focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 rounded-xl transition"
    aria-label="Metadex - Accueil"
  >
    <!-- Logo Icon with glow on hover -->
    <div class="relative flex items-center justify-center">
      <!-- Glow halo effect on group-hover -->
      <div
        class="absolute -inset-1 rounded-xl bg-gradient-to-r from-emerald-500/30 to-teal-500/30 blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
      />

      <svg
        class="relative w-8 h-8 sm:w-9 sm:h-9 transform group-hover:scale-105 transition-transform duration-200"
        viewBox="0 0 48 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="logoCardFront" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#34d399" />
            <stop offset="100%" stop-color="#059669" />
          </linearGradient>
          <linearGradient id="logoCardBack" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#1e293b" />
            <stop offset="100%" stop-color="#0f172a" />
          </linearGradient>
        </defs>

        <!-- Back Card (dark slate, angled +12deg) -->
        <rect
          x="18"
          y="6"
          width="22"
          height="32"
          rx="4"
          transform="rotate(12 29 22)"
          fill="url(#logoCardBack)"
          stroke="#334155"
          stroke-width="1.5"
        />

        <!-- Front Card (emerald gradient, angled -8deg) -->
        <rect
          x="8"
          y="10"
          width="22"
          height="32"
          rx="4"
          transform="rotate(-8 19 26)"
          fill="url(#logoCardFront)"
          stroke="#6ee7b7"
          stroke-width="1.2"
        />

        <!-- Victory checkmark on front card -->
        <path
          d="M13 22L17 28L23 20"
          stroke="#ffffff"
          stroke-width="2.5"
          stroke-linecap="round"
          stroke-linejoin="round"
          transform="rotate(-8 19 26)"
        />
      </svg>
    </div>

    <!-- Brand Typography -->
    <span class="text-lg sm:text-xl font-bold tracking-tight text-slate-900 dark:text-white transition-colors">
      Metadex
    </span>
  </NuxtLink>
</template>
