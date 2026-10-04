<script setup lang="ts">
import AppToastContainer from '~/components/ui/AppToastContainer.vue'
import AppConfirmModal from '~/components/ui/AppConfirmModal.vue'
import BottomNav from '~/components/layout/BottomNav.vue'
import PwaInstallPrompt from '~/components/ui/PwaInstallPrompt.vue'

useSeoMeta({
  title: 'Metadex — TCG Matchup & Meta Tracker',
  description: 'Track your matches, analyze win rates (BO1 & BO3), and optimize your tournament performance with real-time TCG meta statistics.',
  ogTitle: 'Metadex — TCG Matchup & Meta Tracker',
  ogDescription: 'Track your matches, analyze win rates (BO1 & BO3), and optimize your tournament performance with real-time TCG meta statistics.',
  ogImage: '/og-image.png',
  ogImageWidth: 1200,
  ogImageHeight: 630,
  ogImageType: 'image/png',
  ogSiteName: 'Metadex',
  ogType: 'website',
  twitterCard: 'summary_large_image',
  twitterTitle: 'Metadex — TCG Matchup & Meta Tracker',
  twitterDescription: 'Track your matches, analyze win rates (BO1 & BO3), and optimize your tournament performance with real-time TCG meta statistics.',
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
