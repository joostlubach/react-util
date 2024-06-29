import React from 'react'
import { useTimer } from 'react-timer'
import { RefMap } from './refs'

export function useCompoundFocus<K extends string>(refs: RefMap<K, HTMLInputElement>, options: CompoundFocusOptions = {}): CompoundFocusHook<K> {
  const findWhich = React.useCallback((element: Element | null) => {
    return refs.entries().find(entry => entry[1] === element)?.[0] ?? null
  }, [refs])

  const [focused, setFocused] = React.useState<K | null>(findWhich(document.activeElement))

  // ------
  // Blur prevention

  const preventBlurTimer = useTimer()
  const preventBlurRef = React.useRef<boolean>(false)
  const focusTimer = useTimer()

  const preventBlur = React.useCallback(() => {
    preventBlurRef.current = true
    preventBlurTimer.debounce(() => {
      preventBlurRef.current = false
    }, 0)
  }, [preventBlurTimer])

  // ------
  // Focus / blur handler

  const focus = React.useCallback((which?: K) => {
    const key = which ?? refs.entries()[0]?.[0]
    const element = refs.get(key)
    if (element == null) { return }

    element.focus()
    if (options.selectOnFocus) {
      element.select()
      setTimeout(() => {
        element.select()
      }, 0)
    }

    preventBlur()
  }, [options.selectOnFocus, preventBlur, refs])

  const blur = React.useCallback(() => {
    if (focused == null) { return }

    refs.all().forEach(el => el.blur())
  }, [focused, refs])

  const handleFocus = React.useCallback((event: React.FocusEvent<HTMLInputElement>) => {
    focusTimer.clearAll()
    if (options.selectOnFocus) {
      event.currentTarget.select()
    }

    const which = findWhich(event.target)
    if (focused === which) { return }

    const wasFocused = focused != null
    setFocused(which)

    options.onComponentFocus?.(event)
    if (!wasFocused) {
      options.onFocus?.(event)
    }
  }, [findWhich, focusTimer, focused, options])

  const handleBlur = React.useCallback((event: React.FocusEvent<HTMLInputElement>) => {
    if (preventBlurRef.current) {
      event.target.focus()
    } else {
      options.onComponentBlur?.(event)

      event.persist()
      focusTimer.debounce(() => {
        setFocused(null)
        options.onBlur?.(event)
      }, 0)
    }
  }, [focusTimer, options])

  return {
    focused,
    focus,
    blur,
    preventBlur,
    handlers: {
      onFocus: handleFocus,
      onBlur:  handleBlur,
    },
  }
}

export interface CompoundFocusOptions {
  selectOnFocus?: boolean

  onFocus?: (event: React.FocusEvent<HTMLInputElement>) => any
  onBlur?:  (event: React.FocusEvent<HTMLInputElement>) => any

  onComponentFocus?: (event: React.FocusEvent<HTMLInputElement>) => any
  onComponentBlur?:  (event: React.FocusEvent<HTMLInputElement>) => any
}

export interface CompoundFocusHook<K> {
  focused: K | null

  focus:       (which?: K) => any
  blur:        (which?: K) => any
  preventBlur: (which?: K) => any

  handlers: {
    onFocus: (event: React.FocusEvent<HTMLInputElement>) => any
    onBlur:  (event: React.FocusEvent<HTMLInputElement>) => any
  }
}
