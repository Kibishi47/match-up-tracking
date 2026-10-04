import type { Game } from '~/server/db/schema'

// Promesse partagée unique au niveau du module pour dédupliquer les requêtes concurrentes (Anti-spam réseau)
let userGamesPromise: Promise<Game[]> | null = null

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

  // Initialisation immédiate et synchrone depuis le localStorage dès l'instanciation (SPA pur)
  const initialGameId = getStored('tcg_active_game')
  const initialDeckId = initialGameId ? getStored(`tcg_deck_${initialGameId}`) : null

  // Singletons partagés par toute l'application via useState
  const activeGameId = useState<string | null>('tcg_active_game_id', () => initialGameId)
  const activeDeckId = useState<string | null>('tcg_active_deck_id', () => initialDeckId)
  const isSessionReady = useState<boolean>('tcg_session_ready', () => false)
  const games = useState<Game[]>('tcg_user_games_data', () => [])
  const isLoadingGames = useState<boolean>('tcg_loading_games', () => false)
  const hasLoadedGames = useState<boolean>('tcg_has_loaded_games', () => false)

  const activeGame = computed(() => {
    return games.value.find(g => g.id === activeGameId.value) || null
  })

  // Synchronisation de la session de jeu
  const syncSession = (gamesList: Game[]) => {
    if (gamesList.length === 0) {
      activeGameId.value = null
      activeDeckId.value = null
      setStored('tcg_active_game', null)
      isSessionReady.value = true
      return
    }

    const targetGameId = activeGameId.value || getStored('tcg_active_game')

    // Si le jeu ciblé existe dans la liste
    if (targetGameId && gamesList.some(g => g.id === targetGameId)) {
      if (activeGameId.value !== targetGameId) {
        activeGameId.value = targetGameId
      }
      setStored('tcg_active_game', targetGameId)
    } else {
      // Sinon prendre le premier par défaut
      const firstGameId = gamesList[0].id
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

  // Fonction de récupération dédupliquée
  const fetchGames = async (force = false): Promise<Game[]> => {
    if (hasLoadedGames.value && !force && games.value.length > 0) {
      return games.value
    }

    // Si une requête est déjà en vol, retourner la même promesse pour ne pas relancer un second fetch
    if (userGamesPromise) {
      return userGamesPromise
    }

    isLoadingGames.value = true

    userGamesPromise = $fetch<Game[]>('/api/user/games')
      .then((data) => {
        games.value = data || []
        hasLoadedGames.value = true
        syncSession(data || [])
        return games.value
      })
      .catch((err) => {
        console.error('Erreur chargement jeux utilisateur:', err)
        return []
      })
      .finally(() => {
        isLoadingGames.value = false
        userGamesPromise = null
      })

    return userGamesPromise
  }

  // Déclencher le chargement unique au montage si pas encore fait
  if (!hasLoadedGames.value && !userGamesPromise) {
    fetchGames()
  }

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

  const refreshGames = () => fetchGames(true)

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
