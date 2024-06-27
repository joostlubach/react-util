import React from 'react'
import { useTimer } from 'react-timer'

export function useDebounced<T>(actual: T, debounce: number): T {
  const [value, setValue] = React.useState<T>(actual)
  const timer = useTimer()

  React.useEffect(() => {
    timer.clearAll()
    timer.setTimeout(() => {
      setValue(actual)
    }, debounce)
  }, [actual, debounce, timer, value])

  return value
}
