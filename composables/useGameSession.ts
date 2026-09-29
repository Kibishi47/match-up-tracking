import type { Game } from '~/server/db/schema'

export function useGameSession() {
  const getStored = (key: string): string | null => {
    try {
      return localStorage.getItem(key)
    } catch {
      return null
    }
  }

  const setStored = (key: string, value: string | null) => {
    try {
      if (value !== null) {
        localStorage.setItem(key, value)
      } else {
        localStorage.removeItem(key)
      }
    } catch {}
  }

  // Initialisation immédiate depuis le localStorage dès l'instanciation (SPA pur)
  const initialGameId = getStored('tcg_active_game')
  const initialDeckId = initialGameId ? getStored(`tcg_deck_${initialGameId}`) : null

  const activeGameId = useState<string | null>('tcg_active_game_id', () => initialGameId)
  const activeDeckId = useState<string | null>('tcg_active_deck_id', () => initialDeckId)
  const isSessionReady = useState<boolean>('tcg_session_ready', () => false)

  // Récupération de la liste des jeux disponibles
  const { data: games, refresh: refreshGames, status: gamesStatus } = useFetch<Game[]>('/api/games')

  const isLoadingGames = computed(() => gamesStatus.value === 'pending')

  const activeGame = computed(() => {
    return games.value?.find(g => g.id === activeGameId.value) || null
  })

  // Synchronisation avec la liste des jeux reçus
  const syncSession = () => {
    if (!games.value) return

    if (games.value.length === 0) {
      activeGameId.value = null
      activeDeckId.value = null
      setStored('tcg_active_game', null)
      isSessionReady.value = true
      return
    }

    let targetGameId = activeGameId.value || getStored('tcg_active_game')

    // Si le jeu ciblé existe dans la liste
    if (targetGameId && games.value.some(g => g.id === targetGameId)) {
      activeGameId.value = targetGameId
      setStored('tcg_active_game', targetGameId)
    } else {
      // Sinon prendre le premier par défaut
      const firstGameId = games.value[0].id
      activeGameId.value = firstGameId
      setStored('tcg_active_game', firstGameId)
    }

    // Restaurer le deck mémorisé pour ce jeu
    if (activeGameId.value) {
      const storedDeckId = getStored(`tcg_deck_${activeGameId.value}`)
      activeDeckId.value = storedDeckId || null
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
    setStored('tcg_active_game', gameId)

    // Restaurer le deck actif spécifique à ce jeu s'il existe
    const storedDeckId = getStored(`tcg_deck_${gameId}`)
    activeDeckId.value = storedDeckId || null
  }

  // Définir le deck actif pour le jeu en cours
  const setActiveDeck = (deckId: string | null) => {
    activeDeckId.value = deckId
    if (activeGameId.value) {
      setStored(`tcg_deck_${activeGameId.value}`, deckId)
    }
  }

  // Sélectionner par défaut le premier archétype si aucun deck n'est mémorisé
  const selectDefaultDeckIfNone = (availableDecks: { id: string }[]) => {
    if (!availableDecks || availableDecks.length === 0) {
      setActiveDeck(null)
      return
    }
    if (!activeDeckId.value || !availableDecks.some(d => d.id === activeDeckId.value)) {
      setActiveDeck(availableDecks[0].id)
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
    setActiveDeck,
    selectDefaultDeckIfNone
  }
}
