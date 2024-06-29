import React from 'react'
import { usePrevious } from './previous'

const storage: Storage | null = 'localStorage' in globalThis ? globalThis.localStorage : null

export function useViewState<T>(key: string, initialValue: T): ViewStateHook<T> {
  const prevKey = usePrevious(key)

  const getValueFromStorage = React.useCallback(() => {
    const serialized = storage?.getItem(key)
    if (serialized == null) { return initialValue }

    try {
      return JSON.parse(serialized) as T
    } catch {
      return initialValue
    }
  }, [initialValue, key])

  const [cache, setCache] = React.useState<T | undefined>(undefined)

  // The value uses the cached value if it exists, unless the key has changed. Then it uses the storage value.
  const value = React.useMemo(
    () => (prevKey === key ? cache : undefined) ?? getValueFromStorage(),
    [getValueFromStorage, key, prevKey, cache],
  )

  // Reset the cached state value if the key changes.
  React.useEffect(() => {
    if (key !== prevKey) { setCache(value) }
  }, [key, prevKey, value])

  // When setting the value, update local storage and the local cache.
  const setValue = React.useCallback((value: T) => {
    if (value === undefined) {
      storage?.removeItem(key)
    } else {
      storage?.setItem(key, JSON.stringify(value))
    }
    setCache(value)
  }, [key])

  // When setting the value, update local storage and the local cache.
  const deleteValue = React.useCallback(() => {
    storage?.removeItem(key)
    setCache(undefined)
  }, [key])

  return [value, setValue, deleteValue]
}

export type ViewStateHook<T> = [
  T,
  (value: T) => void,
  () => void,
]
