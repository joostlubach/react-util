import React from 'react'

export function useContinuousRef<T>(current: T): React.MutableRefObject<T> {
  const ref = React.useRef<T>(current)
  ref.current = current
  return ref
}

export function assignRef<T>(ref: React.Ref<T> | null | undefined, value: T) {
  if (ref == null) { return }

  if (isRefObject(ref)) {
    (ref as React.MutableRefObject<T>).current = value
  } else {
    ref(value)
  }
}

export function releaseRef<T>(ref: React.Ref<T> | null | undefined, value?: T) {
  if (ref == null) { return }

  if (value !== undefined && isRefObject(ref) && (ref as React.MutableRefObject<T>).current !== value) {
    return
  }

  assignRef(ref, null)
}

export function isRefObject<T>(ref: React.Ref<T>): ref is React.RefObject<T> {
  if (ref != null && typeof ref === 'object') {
    return 'current' in ref
  } else {
    return false
  }
}

export function useRefMap<K, V>(deps: any[] = []): RefMap<K, V> {
  return React.useMemo((): RefMap<K, V> => {
    const map = new Map<K, V>()

    return {
      for: key => current => {
        if (current == null) {
          map.delete(key)
        } else {
          map.set(key, current)
        }
      },
      set: (key, current) => {
        if (current == null) {
          map.delete(key)
        } else {
          map.set(key, current)
        }
      },
      clear: () => { map.clear() },

      size:    () => map.size,
      get:     key => map.get(key),
      getter:  key => () => map.get(key),
      getters: Array.from(map.keys()).map(key => () => map.get(key)),
      all:     () => [...map.values()],
      object:  () => Object.fromEntries(map.entries()),
      entries: () => [...map.entries()],
    }
  // There is a common use case for ref maps to be invalidated based on some dependency, so allow custom deps here.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps])
}

export interface RefMap<K, V> {
  size:    () => number
  for:     (key: K) => (current: V | null) => void
  set:     (key: K, value: V | null) => void
  clear:   () => void
  get:     (key: K) => V | undefined
  getter:  (key: K) => () => V | undefined
  getters: (() => V | undefined)[]
  all:     () => V[]
  object:  () => Record<K extends string | number ? K : string, V>
  entries: () => Array<[K, V]>
}
