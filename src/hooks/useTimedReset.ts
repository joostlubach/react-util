import { useCallback, useState } from 'react'
import { useTimer } from 'react-timer'

export function useTimedReset<T>(set: () => T, reset: () => T, timeout: number): [T, () => void] {
  const [value, setValue] = useState(reset())

  const timer = useTimer()
  const start = useCallback(() => {
    timer.clearAll()
    setValue(set())
    timer.setTimeout(() => {
      setValue(reset())
    }, timeout)
  }, [reset, set, timeout, timer])

  return [value, start]
}
