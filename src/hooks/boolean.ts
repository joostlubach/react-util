import React from 'react'

export function useBoolean(initialValue: boolean = false): BooleanHook {
  const [value, setValue] = React.useState<boolean>(initialValue)
  const setTrue = React.useCallback(() => setValue(true), [])
  const setFalse = React.useCallback(() => setValue(false), [])
  const toggle = React.useCallback(() => setValue(!value), [value])
  return [value, setTrue, setFalse, toggle]
}

export type BooleanHook = [
  boolean, // current
  () => void, // setTrue
  () => void, // setFalse
  () => void, // toggle
]
