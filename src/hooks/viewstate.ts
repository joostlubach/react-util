import { useCallback, useMemo } from 'react'

const STORAGE: Storage | null = 'localStorage' in globalThis ? globalThis.localStorage : null
const SYNC: Map<string, number> = new Map()

export function useViewState<T>(key: undefined, initialValue?: T): ViewStateHook<undefined>
export function useViewState<T>(key: string, initialValue: T): ViewStateHook<T>
export function useViewState<T>(key: string | undefined, initialValue?: T): ViewStateHook<T | undefined>
export function useViewState<T>(key: string | undefined, initialValue: T): ViewStateHook<T> {
  const sync = key === undefined ? null : SYNC.get(key)

  const value = useMemo(() => {
    if (key === undefined) { return undefined }

    // Make sync end up in the deps array so that all useViewState hooks with the same key are synced and
    // will update each other.
    const _ = sync

    const serialized = STORAGE?.getItem(key)
    if (serialized == null) { return initialValue }

    try {
      return JSON.parse(serialized) as T
    } catch {
      return initialValue
    }
  }, [initialValue, key, sync])

  // When setting the value, update local storage and the local cache.
  const setValue = useCallback((value: T) => {
    if (key === undefined) { return }

    if (value === undefined) {
      STORAGE?.removeItem(key)
    } else {
      STORAGE?.setItem(key, JSON.stringify(value))
    }
    SYNC.set(key, Date.now())
  }, [key])

  // When setting the value, update local storage and the local cache.
  const deleteValue = useCallback(() => {
    if (key === undefined) { return }
    STORAGE?.removeItem(key)
  }, [key])

  return [value as T, setValue, deleteValue]
}

export type ViewStateHook<T> = [
  T,
  (value: T) => void,
  () => void,
]
