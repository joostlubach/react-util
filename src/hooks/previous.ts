import React from 'react'

/**
 * Uses a ref to give you the previous version of a value.
 */
export function usePrevious<T>(value: T): T | undefined {
  const ref = React.useRef<T | undefined>(undefined)
  React.useEffect(() => {
    ref.current = value
  })
  return ref.current
}
