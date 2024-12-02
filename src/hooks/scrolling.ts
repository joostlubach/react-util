import { useCallback, useEffect, useState } from 'react'
import { RefMap, useRefMap } from './refs'

export function useScrollInfo(element: Element): ScrollInfo {
  const [scrollInfo, setScrollInfo] = useState<ScrollInfo>(
    ScrollInfo.fromElement(element)
  )
  
  const updateScrollInfo = useCallback(() => {
    setScrollInfo(ScrollInfo.fromElement(element))
  }, [element])

  useEffect(() => {
    element.addEventListener('scroll', updateScrollInfo)

    const observer = new ResizeObserver(updateScrollInfo)
    observer.observe(element)

    return () => {
      element.removeEventListener('scroll', updateScrollInfo)
      observer.disconnect()
    }
  }, [element, updateScrollInfo])

  return scrollInfo
}

export interface ScrollInfo {
  scrollTop:  number
  scrollLeft: number
  
  scrollHeight: number
  scrollWidth:  number
  
  clientHeight: number
  clientWidth:  number

  atTop:    boolean
  atLeft:   boolean
  atBottom: boolean
  atRight:  boolean
}

export const ScrollInfo = {
  fromElement(element: Element): ScrollInfo {
    return {
      scrollTop:  element.scrollTop,
      scrollLeft: element.scrollLeft,

      scrollHeight: element.scrollHeight,
      scrollWidth:  element.scrollWidth,

      clientHeight: element.clientHeight,
      clientWidth:  element.clientWidth,

      atTop:    element.scrollTop === 0,
      atLeft:   element.scrollLeft === 0,
      atBottom: element.scrollTop + element.clientHeight >= element.scrollHeight,
      atRight:  element.scrollLeft + element.clientWidth >= element.scrollWidth,      
    }
  },
}

export function useScrollSync<K>() {
  const refs: RefMap<K, HTMLElement> = useRefMap<K, HTMLElement>({
    onAssign:   element => element.addEventListener('scroll', handleScroll),
    onUnassign: element => element.removeEventListener('scroll', handleScroll),
  })

  const handleScroll = useCallback((event: Event) => {
    const current = event.currentTarget
    if (!(current instanceof HTMLElement)) { return }

    const elements = refs.all()
    const others = elements.filter(it => it !== event.currentTarget)
    for (const element of others) {
      element.scrollTop = current.scrollTop
      element.scrollLeft = current.scrollLeft
    }
  }, [refs])

  return useCallback((key: K) => refs.for(key), [refs])
}
