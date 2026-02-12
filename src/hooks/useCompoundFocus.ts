import { RefObject, useCallback, useEffect } from 'react'
import { findFocusablesIn } from '../dom'
import { useContinuousRef } from './refs'

export function useCompoundFocus(containerRef: RefObject<HTMLElement | null>, options: CompoundFocusOptions = {}) {
  const {
    onFocus,
    onBlur,
    onComponentFocus,
    onComponentBlur,
  } = options
  
  const onFocusRef = useContinuousRef(onFocus)
  const onBlurRef = useContinuousRef(onBlur)
  const onComponentFocusRef = useContinuousRef(onComponentFocus)
  const onComponentBlurRef = useContinuousRef(onComponentBlur)

  const findFocusables = useCallback(() => {
    if (containerRef.current == null) { return [] }
    return findFocusablesIn(containerRef.current)
  }, [containerRef])

  // ------
  // Focus / blur handler

  const isCompoundFocusOrBlur = useCallback((event: FocusEvent) => {
    if (event.relatedTarget == null) { return true }
    
    const focusables = findFocusables()
    return !focusables.includes(event.relatedTarget as HTMLElement)    
  }, [findFocusables])

  const handleFocus = useCallback((event: FocusEvent) => {
    onComponentFocusRef.current?.(event)
    if (isCompoundFocusOrBlur(event)) {
      onFocusRef.current?.(event)
    }
  }, [isCompoundFocusOrBlur, onComponentFocusRef, onFocusRef])

  const handleBlur = useCallback((event: FocusEvent) => {
    if (event.target instanceof Element && event.relatedTarget instanceof Element) {
      if (options.isRelatedTarget?.(event.target, event.relatedTarget)) {
        return
      }
    }

    onComponentBlurRef.current?.(event)
    if (isCompoundFocusOrBlur(event)) {
      onBlurRef.current?.(event)
    }
  }, [onComponentBlurRef, isCompoundFocusOrBlur, options, onBlurRef])

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

  isRelatedTarget?: (input: Element, target: Element) => boolean
}