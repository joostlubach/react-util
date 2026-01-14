import { useCallback, useState } from 'react'

const STORAGE: Storage | null = 'localStorage' in globalThis ? globalThis.localStorage : null

export function useViewState<T>(key: undefined, initialValue?: T): ViewStateHook<undefined>
export function useViewState<T>(key: string, initialValue: T): ViewStateHook<T>
export function useViewState<T>(key: string | undefined, initialValue?: T): ViewStateHook<T | undefined>
export function useViewState<T>(key: string | undefined, initialValue: T): ViewStateHook<T> {
  const [value, setValueState] = useState<T | undefined>(() => {
    if (key === undefined) { return initialValue }

    const serialized = STORAGE?.getItem(key)
    if (serialized == null) { return initialValue }

    try {
      return JSON.parse(serialized) as T
    } catch {
      return initialValue
    }
  })

  // When setting the value, update local storage and the local cache.
  const setValue = useCallback((value: T) => {
    if (key === undefined) { return }

    if (value === undefined) {
      STORAGE?.removeItem(key)
    } else {
      STORAGE?.setItem(key, JSON.stringify(value))
    }
    setValueState(value)
  }, [key])

  // When setting the value, update local storage and the local cache.
  const deleteValue = useCallback(() => {
    if (key === undefined) { return }
    STORAGE?.removeItem(key)
    setValueState(undefined)
  }, [key])

  return [value as T, setValue, deleteValue]
}

export type ViewStateHook<T> = [
  T,
  (value: T) => void,
  () => void,
]
