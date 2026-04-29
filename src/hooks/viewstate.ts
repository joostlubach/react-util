import { useCallback, useMemo, useState } from 'react'

const STORAGE: Storage | null = 'localStorage' in globalThis ? globalThis.localStorage : null

export function useViewState<T>(key: undefined, initialValue?: T): ViewStateHook<undefined>
export function useViewState<T>(key: string, initialValue: T): ViewStateHook<T>
export function useViewState<T>(key: string | undefined, initialValue?: T): ViewStateHook<T | undefined>
export function useViewState<T>(key: string | undefined, initialValue: T): ViewStateHook<T> {
  const [lastStoredAt, setLastStoredAt] = useState(Date.now())

  const value = useMemo<T | undefined>(() => {
    const _ = lastStoredAt

    const serialized = key !== undefined ? STORAGE?.getItem(key) : undefined
    if (serialized == null) { return initialValue }

    try {
      return JSON.parse(serialized) as T
    } catch {
      return initialValue
    }
  }, [lastStoredAt, key, initialValue])

  // When setting the value, update local storage and break cache by setting last stored at to now.
  const setValue = useCallback((value: T) => {
    if (key === undefined) { return }

    if (value === undefined) {
      STORAGE?.removeItem(key)
    } else {
      STORAGE?.setItem(key, JSON.stringify(value))
    }
    setLastStoredAt(Date.now())
  }, [key])

  // When deleting the value, update local storage and break cache by setting last stored at to now.
  const deleteValue = useCallback(() => {
    if (key === undefined) { return }
    STORAGE?.removeItem(key)
    setLastStoredAt(Date.now())
  }, [key])

  return [value as T, setValue, deleteValue]
}

export type ViewStateHook<T> = [
  T,
  (value: T) => void,
  () => void,
]
