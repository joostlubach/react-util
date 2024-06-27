import { isEqual } from 'lodash'
import React from 'react'

export function useChangeMonitor<T>(arg: T, callback: (prev: T) => any, options: ChangeMonitorOptions<T> = {}): boolean {
  const {equals = isEqual} = options

  const prevRef = React.useRef<T>()
  const changed = prevRef.current !== undefined && !equals(arg, prevRef.current)

  if (changed) {
    callback(prevRef.current!)
  }

  React.useEffect(() => {
    prevRef.current = arg
  }, [arg])

  return changed
}

export interface ChangeMonitorOptions<T> {
  equals?: (prev: T, next: T) => boolean
}
