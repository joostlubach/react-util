import { RefObject, useCallback, useEffect, useRef } from 'react'
import { useTimer } from 'react-timer'
import { findFocusablesIn } from '../dom'
import { useContinuousRef } from './refs'

export function useCompoundFocus(containerRef: RefObject<HTMLElement | null>, options: CompoundFocusOptions = {}) {
  const {
    onFocus,
    onBlur,
    onComponentFocus,
    onComponentBlur,
  } = options
  
  const focusTimer = useTimer()
  const onFocusRef = useContinuousRef(onFocus)
  const onBlurRef = useContinuousRef(onBlur)
  const onComponentFocusRef = useContinuousRef(onComponentFocus)
  const onComponentBlurRef = useContinuousRef(onComponentBlur)

  const prevActiveElementRef = useRef<HTMLElement | null>(
    document.activeElement instanceof HTMLElement ? document.activeElement : null,
  )

  const findFocusables = useCallback(() => {
    if (containerRef.current == null) { return [] }
    return findFocusablesIn(containerRef.current)
  }, [containerRef])

  // ------
  // Focus / blur handler

  const handleFocus = useCallback((event: FocusEvent) => {
    focusTimer.clearAll()

    onComponentFocusRef.current?.(event)

    const focusables = findFocusables()
    const wasFocused = prevActiveElementRef.current != null && focusables.includes(prevActiveElementRef.current)
    if (!wasFocused) {
      onFocusRef.current?.(event)
    }
  }, [findFocusables, focusTimer, onComponentFocusRef, onFocusRef])

  const handleBlur = useCallback((event: FocusEvent) => {
    onComponentBlurRef.current?.(event)
    focusTimer.debounce(() => {
      onBlurRef.current?.(event)
    }, 0)
  }, [focusTimer, onBlurRef, onComponentBlurRef])

  useEffect(() => {
    const container = containerRef.current
    if (container == null) { return }

    container.addEventListener('focusin', handleFocus)
    container.addEventListener('focusout', handleBlur)

    return () => {
      container.removeEventListener('focusin', handleFocus)
      container.removeEventListener('focusout', handleBlur)
    }
  }, [containerRef, handleBlur, handleFocus])
}

export interface CompoundFocusOptions {
  onFocus?: (event: FocusEvent) => void
  onBlur?:  (event: FocusEvent) => void

  onComponentFocus?: (event: FocusEvent) => void
  onComponentBlur?:  (event: FocusEvent) => void
}