<script setup lang="ts">
import AppToastContainer from '~/components/ui/AppToastContainer.vue'
import AppConfirmModal from '~/components/ui/AppConfirmModal.vue'
import BottomNav from '~/components/layout/BottomNav.vue'
import PwaInstallPrompt from '~/components/ui/PwaInstallPrompt.vue'

useSeoMeta({
  title: 'Metadex — TCG Matchup & Meta Tracker',
  description: 'Suivez vos parties, analysez vos win rates (BO1 & BO3) et optimisez vos performances en tournoi TCG avec des statistiques méta en temps réel.',
  ogTitle: 'Metadex — TCG Matchup & Meta Tracker',
  ogDescription: 'Suivez vos parties, analysez vos win rates (BO1 & BO3) et optimisez vos performances en tournoi TCG avec des statistiques méta en temps réel.',
  ogImage: '/og-image.png',
  ogImageWidth: 1200,
  ogImageHeight: 630,
  ogImageType: 'image/png',
  ogSiteName: 'Metadex',
  ogType: 'website',
  twitterCard: 'summary_large_image',
  twitterTitle: 'Metadex — TCG Matchup & Meta Tracker',
  twitterDescription: 'Suivez vos parties, analysez vos win rates (BO1 & BO3) et optimisez vos performances en tournoi TCG avec des statistiques méta en temps réel.',
  twitterImage: '/og-image.png'
})
</script>

<template>
  <div class="min-h-screen bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors duration-200">
    <VitePwaManifest />
    <NuxtRouteAnnouncer />
    <NuxtPage />

    <!-- Navigation mobile basse fixe -->
    <BottomNav />

    <!-- Modale de confirmation globale & Container de Toasts -->
    <AppConfirmModal />
    <AppToastContainer />

    <!-- Bannière & invite d'installation PWA -->
    <PwaInstallPrompt />
  </div>
</template>
