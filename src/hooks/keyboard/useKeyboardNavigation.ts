import { useCallback, useMemo, useRef } from 'react'
import { useContinuousRef } from '../refs'
import { GridKeyboardNavigation } from './GridKeyboardNavigation'
import { ListKeyboardNavigation } from './ListKeyboardNavigation'
import { MenuKeyboardNavigation } from './MenuKeyboardNavigation'
import { Key, KeyboardNavigationData, KeyPath } from './types'

export function useKeyboardNavigation<It, K extends Key>(
  data:       KeyboardNavigationData<It, K>,
  keyPath:    KeyPath<K>,
  setKeyPath: (keyPath: KeyPath<K>) => void,
  options:    KeyboardNavigationOptions<It>,
): UseKeyboardNavigationHook {
  const {
    mode = 'list',
    columns = 1,
    onSelect,
    selectKeys = ['Enter'],
    typeahead = false,
    homeEnd = false,
    preventDefault = true,
    stopPropagation = true,

    beforeHandle,
    afterHandle,
  } = options

  const navigation = useMemo(() => {
    switch (mode) {
    case 'list': return new ListKeyboardNavigation(data)
    case 'grid': return new GridKeyboardNavigation(data, columns)
    case 'menu': return new MenuKeyboardNavigation(data)
    }
  }, [columns, data, mode])

  const keyPathRef = useContinuousRef(keyPath)
  const navigationRef = useContinuousRef(navigation)
  const onSelectRef = useContinuousRef(onSelect)
  const beforeHandleRef = useContinuousRef(beforeHandle)
  const afterHandleRef = useContinuousRef(afterHandle)

  const typeaheadRef = useRef<{searchString: string, lastTime: number | null}>({searchString: '', lastTime: null})

  const eventHandled = useCallback((event: KeyboardEvent)=> {
    afterHandleRef.current?.(event)

    if (preventDefault) {
      event.preventDefault()
    }
    if (stopPropagation) {
      event.stopPropagation()
    }
  }, [afterHandleRef, preventDefault, stopPropagation])

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (beforeHandleRef.current?.(event) === false) { return }

    if (typeahead && isTypeaheadKey(event)) {
      const nextKeyPath = navigationRef.current.typeahead(keyPathRef.current, nextSearchString(typeaheadRef.current, event.key))
      if (nextKeyPath != null) {
        setKeyPath(nextKeyPath)
        eventHandled(event)
      }
      return
    }

    if (event.ctrlKey || event.altKey || event.shiftKey || event.metaKey) { return }

    if (homeEnd && (event.key === 'Home' || event.key === 'End')) {
      const nextKeyPath = navigationRef.current.edge(keyPathRef.current, event.key === 'Home' ? 'first' : 'last')
      if (nextKeyPath != null) {
        setKeyPath(nextKeyPath)
        eventHandled(event)
      }
    }

    if (selectKeys.includes(event.key)) {
      const node = navigationRef.current.nodeAtKeyPath(keyPathRef.current)
      if (node == null) { return }
      eventHandled(event)
      onSelectRef.current?.(node?.item ?? null)
    }

    const nextKeyPath = navigationRef.current.handle(keyPathRef.current, event.key)
    if (nextKeyPath != null) {
      setKeyPath(nextKeyPath)
      eventHandled(event)
    }
  }, [beforeHandleRef, eventHandled, homeEnd, keyPathRef, navigationRef, onSelectRef, selectKeys, setKeyPath, typeahead])

  const currentElementRef = useRef<HTMLElement | Window | null>(null)

  const bind = useCallback((element: HTMLElement | Window) => {
    (element as HTMLElement).addEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  const unbind = useCallback((element: HTMLElement | Window) => {
    (element as HTMLElement).removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  const disconnect = useCallback((element: HTMLElement | Window | null) => {
    const current = currentElementRef.current
    if (element !== current) { return }

    if (current != null) {
      unbind(current)
    }

    currentElementRef.current = null
  }, [unbind])

  const connect = useCallback((nextElement: HTMLElement | Window | null) => {
    const prevElement = currentElementRef.current
    if (prevElement === nextElement) { return }

    if (prevElement != null) {
      unbind(prevElement)
    }
    if (nextElement != null) {
      bind(nextElement)
    }

    currentElementRef.current = nextElement
    return () => { disconnect(nextElement) }
  }, [bind, disconnect, unbind])

  return useMemo(() => ({
    ref:           [connect, disconnect],
    connect:       connect,
    handleKeyDown: handleKeyDown,
  }), [connect, disconnect, handleKeyDown])
}

export interface KeyboardNavigationOptions<It> {
  mode?:       KeyboardNavigationMode
  columns?:    number
  onSelect?:   (item: It) => void
  selectKeys?: string[]

  /** Type to jump to the next node whose label starts with what was typed. Do not use with text inputs. */
  typeahead?:  boolean

  /** Home and End jump to the first and last node. Do not use with text inputs. */
  homeEnd?:    boolean

  /**
   * Set to false to prevent having the hook call .preventDefault() on a handled key event.
   */
  preventDefault?: boolean

  /**
   * Set to false to prevent having the hook call .stopPropagation() on a handled key event.
   */
  stopPropagation?: boolean

  beforeHandle?: (event: KeyboardEvent) => boolean | void
  afterHandle?: (event: KeyboardEvent) => void
}

export interface UseKeyboardNavigationHook {
  ref: UseKeyboardNavigationHookRef
  connect:       (element: HTMLElement | Window | null) => void
  handleKeyDown: (event: KeyboardEvent) => void
}
export type UseKeyboardNavigationHookRef = [
  (element: HTMLElement | Window | null) => void,
  (element: HTMLElement | Window | null) => void,
]

export type KeyboardNavigationMode =
  /** Navigate like a list: if the end of a section is reached, continues into the next. Sections
   *  can not be selected.
   **/
  | 'list'

  /**
   * Similar to a list, but up and down go back / forward <column> steps, to simulate vertical
   * navigation. Option `columns` required.
   **/
  | 'grid'

  /**
   * Navigate like a menu: if the end of a section is reached, it is cycled again from the top.
   * Left and right are used to navigate into and out of sections. Sections can be selected. When
   * a section is selected, Return behaves like ArrowRight.
   **/
  | 'menu'

const TYPEAHEAD_RESET_TIMEOUT = 500

function isTypeaheadKey(event: KeyboardEvent) {
  if (event.ctrlKey || event.altKey || event.metaKey) { return false }
  return event.key.length === 1 && event.key !== ' '
}

function nextSearchString(state: {searchString: string, lastTime: number | null}, key: string) {
  const lowerKey = key.toLowerCase()
  const now = performance.now()

  if (state.searchString.length > 0 && state.lastTime != null && now - state.lastTime > TYPEAHEAD_RESET_TIMEOUT) {
    state.searchString = lowerKey
  } else if (state.searchString.length !== 1 || lowerKey !== state.searchString) {
    // Repeating a single character cycles through its matches instead of refining the search.
    state.searchString += lowerKey
  }

  state.lastTime = now
  return state.searchString
}
