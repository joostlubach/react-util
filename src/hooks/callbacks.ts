import { useCallback, useRef } from 'react'
import { useTimer } from 'react-timer'

/**
 * Creates a throttled callback that will only invoke the provided callback function at most once every specified delay.
 * Only the most recently used arguments will be passed to the callback.
 * 
 * @param callback The callback function to throttle.
 * @param delay The time in milliseconds to wait before allowing the next invocation.
 * @returns A throttled version of the callback function.
 */
export function useThrottledCallback<A extends any[]>(callback: (...args: A) => void, deps: any[], delay: number) {
  const timer = useTimer()
  const lastArgsRef = useRef<A | undefined>(undefined)
  
  return useCallback((...args: A) => {
    lastArgsRef.current = args
    
    timer.throttle(() => {
      const args = lastArgsRef.current
      if (args === undefined) { return }

      callback(...args)
    }, delay)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [callback, delay, timer, ...deps])
} 