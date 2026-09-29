import type { Game } from '~/server/db/schema'

export function useGameSession() {
  const activeGameId = useState<string | null>('tcg_active_game_id', () => null)
  const activeDeckId = useState<string | null>('tcg_active_deck_id', () => null)

  // Récupération de la liste des jeux disponibles
  const { data: games, refresh: refreshGames, status: gamesStatus } = useFetch<Game[]>('/api/games', {
    lazy: false
  })

  const isLoadingGames = computed(() => gamesStatus.value === 'pending')

  const activeGame = computed(() => {
    return games.value?.find(g => g.id === activeGameId.value) || null
  })

  // Synchronisation avec localStorage côté client
  const initSession = () => {
    if (import.meta.server) return

    try {
      const storedGameId = localStorage.getItem('tcg_active_game')
      if (storedGameId && games.value?.some(g => g.id === storedGameId)) {
        activeGameId.value = storedGameId
      } else if (games.value && games.value.length > 0 && !activeGameId.value) {
        activeGameId.value = games.value[0].id
        localStorage.setItem('tcg_active_game', games.value[0].id)
      }

      // Restaurer le deck mémorisé pour le jeu actif
      if (activeGameId.value) {
        const storedDeckId = localStorage.getItem(`tcg_deck_${activeGameId.value}`)
        if (storedDeckId) {
          activeDeckId.value = storedDeckId
        }
      }
    } catch (e) {
      console.warn('localStorage non disponible', e)
    }
  }

  // Initialisation réactive dès que les jeux sont reçus
  watch(games, () => {
    initSession()
  }, { immediate: true })

  // Permuter de jeu actif
  const setActiveGame = (gameId: string) => {
    activeGameId.value = gameId
    if (import.meta.client) {
      try {
        localStorage.setItem('tcg_active_game', gameId)
        // Restaurer le deck actif spécifique à ce jeu s'il existe
        const storedDeckId = localStorage.getItem(`tcg_deck_${gameId}`)
        activeDeckId.value = storedDeckId || null
      } catch (e) {
        console.warn('Erreur localStorage', e)
      }
    }
  }

  // Définir le deck actif
  const setActiveDeck = (deckId: string | null) => {
    activeDeckId.value = deckId
    if (import.meta.client && activeGameId.value) {
      try {
        if (deckId) {
          localStorage.setItem(`tcg_deck_${activeGameId.value}`, deckId)
        } else {
          localStorage.removeItem(`tcg_deck_${activeGameId.value}`)
        }
      } catch (e) {
        console.warn('Erreur localStorage', e)
      }
    }
  }

  return {
    games,
    activeGame,
    activeGameId,
    activeDeckId,
    isLoadingGames,
    refreshGames,
    setActiveGame,
    setActiveDeck,
    initSession
  }
}
