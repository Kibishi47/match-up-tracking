import type { Game } from '~/server/db/schema'

export function useGameSession() {
  // Cookie partagé serveur/client pour éviter tout saut d'hydratation (SSR + Client)
  const gameCookie = useCookie<string | null>('tcg_active_game', {
    default: () => null,
    maxAge: 60 * 60 * 24 * 365,
    sameSite: 'lax'
  })

  const activeGameId = useState<string | null>('tcg_active_game_id', () => gameCookie.value)
  const activeDeckId = useState<string | null>('tcg_active_deck_id', () => null)
  const isSessionReady = useState<boolean>('tcg_session_ready', () => false)

  // Récupération de la liste des jeux disponibles
  const { data: games, refresh: refreshGames, status: gamesStatus } = useFetch<Game[]>('/api/games', {
    lazy: false
  })

  const isLoadingGames = computed(() => gamesStatus.value === 'pending')

  const activeGame = computed(() => {
    return games.value?.find(g => g.id === activeGameId.value) || null
  })

  // Synchronisation stable et sans clignotement
  const syncSession = () => {
    if (!games.value) return

    if (games.value.length === 0) {
      activeGameId.value = null
      activeDeckId.value = null
      gameCookie.value = null
      isSessionReady.value = true
      return
    }

    // Récupérer depuis cookie ou localStorage
    let targetGameId = activeGameId.value || gameCookie.value

    if (import.meta.client && !targetGameId) {
      try {
        targetGameId = localStorage.getItem('tcg_active_game')
      } catch (e) {
        // Ignorer si inaccessible
      }
    }

    // Si le jeu ciblé existe dans la liste
    if (targetGameId && games.value.some(g => g.id === targetGameId)) {
      activeGameId.value = targetGameId
      gameCookie.value = targetGameId
    } else {
      // Sinon prendre le premier par défaut
      const firstGameId = games.value[0].id
      activeGameId.value = firstGameId
      gameCookie.value = firstGameId
      if (import.meta.client) {
        try {
          localStorage.setItem('tcg_active_game', firstGameId)
        } catch (e) {}
      }
    }

    // Restaurer le deck mémorisé pour ce jeu
    if (import.meta.client && activeGameId.value) {
      try {
        const storedDeckId = localStorage.getItem(`tcg_deck_${activeGameId.value}`)
        if (storedDeckId) {
          activeDeckId.value = storedDeckId
        }
      } catch (e) {}
    }

    isSessionReady.value = true
  }

  // Initialisation à la réception des jeux
  watch(games, () => {
    syncSession()
  }, { immediate: true })

  // Permuter de jeu actif
  const setActiveGame = (gameId: string) => {
    if (activeGameId.value === gameId) return

    activeGameId.value = gameId
    gameCookie.value = gameId

    if (import.meta.client) {
      try {
        localStorage.setItem('tcg_active_game', gameId)
        // Restaurer le deck actif spécifique à ce jeu s'il existe
        const storedDeckId = localStorage.getItem(`tcg_deck_${gameId}`)
        activeDeckId.value = storedDeckId || null
      } catch (e) {}
    }
  }

  // Définir le deck actif pour le jeu en cours
  const setActiveDeck = (deckId: string | null) => {
    activeDeckId.value = deckId
    if (import.meta.client && activeGameId.value) {
      try {
        if (deckId) {
          localStorage.setItem(`tcg_deck_${activeGameId.value}`, deckId)
        } else {
          localStorage.removeItem(`tcg_deck_${activeGameId.value}`)
        }
      } catch (e) {}
    }
  }

  return {
    games,
    activeGame,
    activeGameId,
    activeDeckId,
    isSessionReady,
    isLoadingGames,
    refreshGames,
    setActiveGame,
    setActiveDeck
  }
}
