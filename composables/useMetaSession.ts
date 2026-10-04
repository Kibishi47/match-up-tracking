import type { Meta } from '~/server/db/schema'

// Promesse et identifiant de jeu partagés au niveau du module pour dédupliquer les requêtes concurrentes
let metasPromise: Promise<Meta[]> | null = null
let lastFetchedGameId: string | null = null

export function useMetaSession() {
  const { activeGameId } = useGameSession()

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

  // Initialisation immédiate et synchrone depuis le localStorage
  const initialGameId = getStored('tcg_active_game')
  const initialMetaId = initialGameId
    ? getStored(`tcg_meta_${initialGameId}`) || getStored('tcg_active_meta')
    : getStored('tcg_active_meta')

  const activeMetaId = useState<string | null>('tcg_active_meta_id', () => initialMetaId)
  const metas = useState<Meta[]>('tcg_session_metas', () => [])
  const isLoadingMetas = useState<boolean>('tcg_loading_metas', () => false)
  const isMetaSessionReady = useState<boolean>('tcg_meta_session_ready', () => false)

  const activeMeta = computed(() => {
    return metas.value.find(m => m.id === activeMetaId.value) || null
  })

  // Synchroniser la méta active lors du changement de jeu ou de métas
  const syncMeta = (list: Meta[]) => {
    if (!activeGameId.value || list.length === 0) {
      activeMetaId.value = null
      isMetaSessionReady.value = true
      return
    }

    const storedMetaId = getStored(`tcg_meta_${activeGameId.value}`) || getStored('tcg_active_meta')

    // 1. Si la méta mémorisée est valide pour ce jeu
    if (storedMetaId && list.some(m => m.id === storedMetaId)) {
      if (activeMetaId.value !== storedMetaId) {
        activeMetaId.value = storedMetaId
      }
      setStored(`tcg_meta_${activeGameId.value}`, storedMetaId)
      isMetaSessionReady.value = true
      return
    }

    // 2. Si la méta actuellement dans le state est valide
    if (activeMetaId.value && list.some(m => m.id === activeMetaId.value)) {
      setStored(`tcg_meta_${activeGameId.value}`, activeMetaId.value)
      isMetaSessionReady.value = true
      return
    }

    // 3. Sélectionner par défaut la première méta active, sinon la première
    const defaultMeta = list.find(m => m.isActive) || list[0]
    if (defaultMeta) {
      activeMetaId.value = defaultMeta.id
      setStored('tcg_active_meta', defaultMeta.id)
      setStored(`tcg_meta_${activeGameId.value}`, defaultMeta.id)
    } else {
      activeMetaId.value = null
    }

    isMetaSessionReady.value = true
  }

  // Récupération dédupliquée des métas du jeu actif
  const fetchMetas = async (force = false): Promise<Meta[]> => {
    const gameId = activeGameId.value
    if (!gameId) {
      metas.value = []
      activeMetaId.value = null
      isMetaSessionReady.value = true
      return []
    }

    // Si déjà chargé pour ce jeu et pas forcé
    if (!force && lastFetchedGameId === gameId && metas.value.length > 0) {
      return metas.value
    }

    // Si une requête est déjà en vol pour ce même jeu, retourner la même promesse
    if (metasPromise && lastFetchedGameId === gameId) {
      return metasPromise
    }

    isLoadingMetas.value = true
    lastFetchedGameId = gameId

    metasPromise = $fetch<Meta[]>('/api/metas', {
      query: { gameId }
    })
      .then((data) => {
        metas.value = data || []
        syncMeta(data || [])
        return metas.value
      })
      .catch((err) => {
        console.error('Erreur chargement métas:', err)
        return []
      })
      .finally(() => {
        isLoadingMetas.value = false
        metasPromise = null
      })

    return metasPromise
  }

  // Écouter le changement de jeu pour charger les métas correspondantes
  watch(activeGameId, (newGameId, oldGameId) => {
    if (newGameId && newGameId !== oldGameId) {
      fetchMetas(true)
    }
  })

  // Premier chargement si pas encore effectué
  if (activeGameId.value && lastFetchedGameId !== activeGameId.value && !metasPromise) {
    fetchMetas()
  }

  const setActiveMeta = (metaId: string) => {
    activeMetaId.value = metaId
    setStored('tcg_active_meta', metaId)
    if (activeGameId.value) {
      setStored(`tcg_meta_${activeGameId.value}`, metaId)
    }
  }

  const refreshMetas = () => fetchMetas(true)

  return {
    metas,
    activeMeta,
    activeMetaId,
    isLoadingMetas,
    isMetaSessionReady,
    refreshMetas,
    setActiveMeta
  }
}
