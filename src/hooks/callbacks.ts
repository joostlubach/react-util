import { useCallback, useRef } from 'react'
import { useTimer } from 'react-timer'

/**
 * Creates a debounced callback that will only invoke the provided callback after the specified delay.
 * @param callback 
 * @param delay 
 * @returns 
 */
export function useThrottledCallback<A extends any[]>(callback: (...args: A) => void, delay: number, deps: any[]) {
  const timer = useTimer()
  const lastArgsRef = useRef<A | undefined>(undefined)
  
  return useCallback((...args: A) => {
    lastArgsRef.current = args
    
    timer.throttle(() => {
      const args = lastArgsRef.current
      if (args === undefined) { return }

      callback(...args)
    }, delay)
  }, [callback, delay, timer, ...deps])
} 