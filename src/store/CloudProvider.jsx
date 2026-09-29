import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react'
import { StoreContext } from './context.js'
import { emptyCloudState, reducer } from './reducer.js'
import { applyRemote, bulkInsert, loadAll, wipeOwner } from './remote.js'
import { createSeedState } from './seed.js'

export function CloudProvider({ ownerId, children }) {
  const [state, dispatchLocal] = useReducer(reducer, emptyCloudState)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [cloudError, setCloudError] = useState('')
  const stateRef = useRef(state)

  useEffect(() => {
    stateRef.current = state
  }, [state])

  const reload = useCallback(async () => {
    setLoading(true)
    setLoadError('')
    try {
      const data = await loadAll(ownerId)
      dispatchLocal({ type: 'state/load', state: data })
    } catch (err) {
      setLoadError(err.message || 'Не удалось загрузить данные')
    } finally {
      setLoading(false)
    }
  }, [ownerId])

  useEffect(() => {
    let active = true
    loadAll(ownerId).then(
      (data) => {
        if (!active) return
        dispatchLocal({ type: 'state/load', state: data })
        setLoading(false)
      },
      (err) => {
        if (!active) return
        setLoadError(err.message || 'Не удалось загрузить данные')
        setLoading(false)
      },
    )
    return () => {
      active = false
    }
  }, [ownerId])

  const dispatch = useCallback(
    (action) => {
      setCloudError('')
      // Оптимистично обновляем локально, затем пишем в Supabase.
      // Так интерфейс не ждёт сеть, а навигация после сохранения видит свежие данные.
      let localAction = action
      let remoteWork = () => applyRemote(ownerId, action, () => stateRef.current)
      if (action.type === 'state/import') {
        localAction = { type: 'state/load', state: action.state }
        remoteWork = async () => {
          await wipeOwner(ownerId)
          await bulkInsert(ownerId, action.state, 'insert')
        }
      } else if (action.type === 'state/reset') {
        const seed = createSeedState()
        localAction = { type: 'state/load', state: seed }
        remoteWork = async () => {
          await wipeOwner(ownerId)
          await bulkInsert(ownerId, seed, 'insert')
        }
      } else if (action.type === 'state/clear') {
        localAction = { type: 'state/load', state: emptyCloudState }
        remoteWork = () => wipeOwner(ownerId)
      }
      dispatchLocal(localAction)
      remoteWork().catch((err) => {
        setCloudError(err.message || 'Ошибка сохранения. Проверьте соединение.')
      })
    },
    [ownerId],
  )

  const value = useMemo(
    () => ({ state, dispatch, loading, loadError, cloudError, reload }),
    [state, dispatch, loading, loadError, cloudError, reload],
  )
  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}
