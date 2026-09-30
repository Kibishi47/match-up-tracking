import type { Meta } from '~/server/db/schema'

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

  const initialMetaId = getStored('tcg_active_meta')
  const activeMetaId = useState<string | null>('tcg_active_meta_id', () => initialMetaId)

  const { data: metas, refresh: refreshMetas, status: metasStatus } = useFetch<Meta[]>('/api/metas', {
    query: computed(() => ({
      gameId: activeGameId.value || undefined
    })),
    watch: [activeGameId]
  })

  const isLoadingMetas = computed(() => metasStatus.value === 'pending')

  const activeMeta = computed(() => {
    return metas.value?.find(m => m.id === activeMetaId.value) || null
  })

  // Synchroniser la méta active lors du changement de jeu ou de métas
  const syncMeta = () => {
    if (!activeGameId.value || !metas.value) {
      activeMetaId.value = null
      return
    }

    if (metas.value.length === 0) {
      activeMetaId.value = null
      setStored(`tcg_meta_${activeGameId.value}`, null)
      return
    }

    const storedMetaId = getStored(`tcg_meta_${activeGameId.value}`)

    // 1. Si la méta mémorisée est valide pour ce jeu
    if (storedMetaId && metas.value.some(m => m.id === storedMetaId)) {
      activeMetaId.value = storedMetaId
      return
    }

    // 2. Si la méta actuellement dans le state est valide
    if (activeMetaId.value && metas.value.some(m => m.id === activeMetaId.value)) {
      setStored(`tcg_meta_${activeGameId.value}`, activeMetaId.value)
      return
    }

    // 3. Sélectionner par défaut la première méta active, sinon la première
    const defaultMeta = metas.value.find(m => m.isActive) || metas.value[0]
    activeMetaId.value = defaultMeta.id
    setStored('tcg_active_meta', defaultMeta.id)
    setStored(`tcg_meta_${activeGameId.value}`, defaultMeta.id)
  }

  watch([activeGameId, metas], () => {
    syncMeta()
  }, { immediate: true })

  const setActiveMeta = (metaId: string) => {
    activeMetaId.value = metaId
    setStored('tcg_active_meta', metaId)
    if (activeGameId.value) {
      setStored(`tcg_meta_${activeGameId.value}`, metaId)
    }
  }

  return {
    metas,
    activeMeta,
    activeMetaId,
    isLoadingMetas,
    refreshMetas,
    setActiveMeta
  }
}
