<script setup lang="ts">
const route = useRoute()
const { loggedIn } = useUserSession()

// Rediriger vers l'accueil si déjà connecté
if (loggedIn.value) {
  navigateTo('/')
}

const error = computed(() => route.query.error as string | undefined)
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-slate-950 px-4 relative overflow-hidden">
    <!-- Ambient glow background effects -->
    <div class="absolute -top-32 -left-32 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
    <div class="absolute -bottom-32 -right-32 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

    <div class="max-w-md w-full glass-panel p-8 rounded-2xl shadow-2xl relative z-10 border border-slate-800">
      <div class="text-center mb-8">
        <div class="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-500 to-indigo-600 mb-4 shadow-lg shadow-emerald-500/20">
          <svg class="w-8 h-8 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect width="18" height="18" x="3" y="3" rx="2" />
            <path d="M7 7h10" />
            <path d="M7 12h10" />
            <path d="M7 17h10" />
          </svg>
        </div>
        <h1 class="text-2xl font-bold tracking-tight text-white">TCG Matchup Tracking</h1>
        <p class="text-sm text-slate-400 mt-2">Suivez vos victoires et défaites par archétype en temps réel</p>
      </div>

      <div v-if="error" class="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
        <span class="font-medium">Échec de la connexion :</span> Une erreur est survenue lors de l'authentification avec Discord.
      </div>

      <div class="space-y-4">
        <a
          href="/auth/discord"
          class="w-full inline-flex items-center justify-center gap-3 px-6 py-3.5 rounded-xl font-medium text-white bg-[#5865F2] hover:bg-[#4752C4] active:scale-[0.98] transition shadow-lg shadow-[#5865F2]/25 cursor-pointer"
        >
          <!-- Discord Icon -->
          <svg class="w-5 h-5 fill-current" viewBox="0 0 127.14 96.36">
            <path d="M107.7,8.07A105.15,105.15,0,0,0,81.47,0a72.06,72.06,0,0,0-3.36,6.83A97.68,97.68,0,0,0,49,6.83,72.37,72.37,0,0,0,45.64,0,105.89,105.89,0,0,0,19.39,8.09C2.79,32.65-1.71,56.6.54,80.21h0A105.73,105.73,0,0,0,32.71,96.36,77.7,77.7,0,0,0,39.6,85.25a68.42,68.42,0,0,1-10.85-5.18c.91-.66,1.8-1.34,2.66-2a75.57,75.57,0,0,0,64.32,0c.87.71,1.76,1.39,2.66,2a68.68,68.68,0,0,1-10.87,5.19,77,77,0,0,0,6.89,11.1,105.25,105.25,0,0,0,32.19-16.14c2.64-27.38-4.51-51.11-18.9-72.25ZM42.45,65.69C36.18,65.69,31,60,31,53s5-12.74,11.43-12.74S54,45.91,53.89,53,48.84,65.69,42.45,65.69Zm42.24,0C78.41,65.69,73.25,60,73.25,53s5-12.74,11.44-12.74S96.23,45.91,96.12,53,91.08,65.69,84.69,65.69Z"/>
          </svg>
          <span>Se connecter avec Discord</span>
        </a>

        <p class="text-xs text-center text-slate-500 mt-4">
          Le premier utilisateur connecté se verra attribuer automatiquement le rôle Administrateur.
        </p>
      </div>
    </div>
  </div>
</template>
