import { RefObject, useCallback, useEffect } from 'react'
import { wrapArray } from 'ytil'
import { useContinuousRef } from './refs'

export function useClickAway(refs: RefObject<HTMLElement> | RefObject<HTMLElement>[], handler: () => void) {
  const handlerRef = useContinuousRef(handler)

  const onClickDocument = useCallback((event: TouchEvent | MouseEvent) => {
    const inside = (element: HTMLElement | null) => element?.contains(event.target as Node) ?? false
    for (const ref of wrapArray(refs)) {
      if (ref.current != null && inside(ref.current)) {
        return
      }
    }
    
    handlerRef.current()
    event.preventDefault()
  }, [handlerRef, refs])

  useEffect(() => {
    if (!open) { return }

    document.addEventListener('mousedown', onClickDocument)
    document.addEventListener('touchstart', onClickDocument)
    return () => {
      document.removeEventListener('mousedown', onClickDocument)
      document.removeEventListener('touchstart', onClickDocument)
    }
  }, [onClickDocument])
}