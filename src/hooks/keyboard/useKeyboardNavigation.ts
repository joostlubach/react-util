import React from 'react'
import { useContinuousRef } from '../refs'
import { GridKeyboardNavigation } from './GridKeyboardNavigation'
import { ListKeyboardNavigation } from './ListKeyboardNavigation'
import { MenuKeyboardNavigation } from './MenuKeyboardNavigation'
import { Key, KeyboardNavigationData, KeyPath } from './types'

export function useKeyboardNavigation<It, K extends Key = Key>(
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
  } = options

  const navigation = React.useMemo(() => {
    switch (mode) {
    case 'list': return new ListKeyboardNavigation(data)
    case 'grid': return new GridKeyboardNavigation(data, columns)
    case 'menu': return new MenuKeyboardNavigation(data)
    }
  }, [columns, data, mode])

  const keyPathRef = useContinuousRef(keyPath)
  const navigationRef = useContinuousRef(navigation)
  const onSelectRef = useContinuousRef(onSelect)

  const handleKeyDown = React.useCallback((event: KeyboardEvent) => {
    if (event.ctrlKey || event.altKey || event.shiftKey || event.metaKey) { return }

    if (selectKeys.includes(event.key)) {
      const node = navigationRef.current.nodeAtKeyPath(keyPathRef.current)
      onSelectRef.current?.(node?.item ?? null)
    }

    const nextKeyPath = navigationRef.current.handle(keyPathRef.current, event.key)
    if (nextKeyPath != null) {
      setKeyPath(nextKeyPath)
      event.preventDefault()
    }
  }, [keyPathRef, navigationRef, onSelectRef, selectKeys, setKeyPath])

  const currentElementRef = React.useRef<HTMLElement | Window | null>(null)

  const bind = React.useCallback((element: HTMLElement | Window) => {
    (element as HTMLElement).addEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  const unbind = React.useCallback((element: HTMLElement | Window) => {
    (element as HTMLElement).removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  const connect = React.useCallback((nextElement: HTMLElement | Window | null) => {
    const prevElement = currentElementRef.current
    if (prevElement === nextElement) { return }

    if (prevElement != null) {
      unbind(prevElement)
    }
    if (nextElement != null) {
      bind(nextElement)
    }

    currentElementRef.current = nextElement
  }, [bind, unbind])

  const disconnect = React.useCallback((element: HTMLElement | Window | null) => {
    const current = currentElementRef.current
    if (element !== current) { return }

    if (current != null) {
      unbind(current)
    }

    currentElementRef.current = null
  }, [unbind])

  return [connect, disconnect]
}

export interface KeyboardNavigationOptions<It> {
  mode?:       KeyboardNavigationMode
  columns?:    number
  onSelect?:   (item: It) => void
  selectKeys?: string[]
}

export type UseKeyboardNavigationHook = [
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