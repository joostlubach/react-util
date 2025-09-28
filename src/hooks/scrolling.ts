import { clamp } from 'lodash'
import { RefObject, useCallback, useEffect, useState } from 'react'
import { useTimer } from 'react-timer'
import { RefMap, useRefMap } from './refs'

export function useScrollInfo(ref: RefObject<HTMLElement | null>): ScrollInfo {
  const [scrollInfo, setScrollInfo] = useState<ScrollInfo>(
    ScrollInfo.fromElement(ref.current)
  )
  
  const updateScrollInfo = useCallback(() => {
    setScrollInfo(ScrollInfo.fromElement(ref.current))
  }, [ref])

  useEffect(() => {
    const element = ref.current
    if (!element) return

    element.addEventListener('scroll', updateScrollInfo)

    const observer = new ResizeObserver(updateScrollInfo)
    observer.observe(element)

    return () => {
      element.removeEventListener('scroll', updateScrollInfo)
      observer.disconnect()
    }
  }, [ref, updateScrollInfo])

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
  fromElement(element: Element | null): ScrollInfo {
    if (element == null) {
      return {
        scrollTop:  0,
        scrollLeft: 0,

        scrollHeight: 0,
        scrollWidth:  0,

        clientHeight: 0,
        clientWidth:  0,

        atTop:    true,
        atLeft:   true,
        atBottom: true,
        atRight:  true,
      }
    } else {
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
    }
  }
}

export function useScrollSync<K>() {
  const refs: RefMap<K, HTMLElement> = useRefMap<K, HTMLElement>({
    onAssign:   element => element.addEventListener('scroll', handleScroll),
    onUnassign: element => element.removeEventListener('scroll', handleScroll),
  })

  const timer = useTimer()

  const handleScroll = useCallback((event: Event) => {
    const current = event.currentTarget
    if (!(current instanceof HTMLElement)) { return }
    if (current.hasAttribute('data-sync-scroll')) { return }

    const elements = refs.all()
    const others = elements.filter(it => it !== event.currentTarget)
    for (const element of others) {
      element.setAttribute('data-sync-scroll', 'true')

      element.scrollTop = current.scrollTop
      element.scrollLeft = current.scrollLeft
    }

    timer.debounce(() => {
      for (const element of others) {
        element.removeAttribute('data-sync-scroll')
      }
    }, 200)
  }, [refs, timer])

  return useCallback((key: K) => refs.for(key), [refs])
}

export function useScrollTo(element: HTMLElement, options: UseScrollToOptions = {}) {
  const {
    easing = ScrollEasing.easeInOutCubic,
  } = options

  const timer = useTimer()

  const scrollTo = useCallback((dest: Pick<ScrollToOptions, 'left' | 'top'>) => {
    const destTop = dest.top
    const destLeft = dest.left

    let startTop = element.scrollTop
    let startLeft = element.scrollLeft
    let startTime = Date.now()

    const distance = Math.max(Math.abs((destTop ?? startTop) - startTop), Math.abs((destLeft ?? startLeft) - startLeft))
    const duration = Math.min(500, distance)

    const tick = () => {
      const time = Date.now() - startTime
      const t = clamp(time / duration, 0, 1)

      const vertical = (destTop ?? startTop) - startTop
      const horizontal = (destLeft ?? startLeft) - startLeft

      const top = vertical === 0 ? startTop : startTop + vertical * applyEasing(((destTop ?? startTop) - startTop) * t / vertical, easing)
      const left = horizontal === 0 ? startLeft : startLeft + horizontal * applyEasing(((destLeft ?? startLeft) - startLeft) * t / horizontal, easing)

      element.scrollTo({
        top,
        left,
        behavior: 'instant',
      })

      if (time < duration) {
        timer.requestAnimationFrame(tick)
      }
    }

    timer.clearAll()
    timer.requestAnimationFrame(tick)
  }, [easing, element, timer])

  return scrollTo
}

export const ScrollEasing = {
  linear:         (x: number) => x,
  easeInOutQuad:  (x: number) => x < 0.5 ? 2 * x * x : -1 + (4 - 2 * x) * x,
  easeInOutCubic: (x: number) => x < 0.5 ? 4 * x * x * x : (x - 1) * (2 * x - 2) * (2 * x - 2) + 1,
}

function applyEasing(value: number, easing: (x: number) => number): number {
  return easing(value)
}

export interface UseScrollToOptions {
  easing?: (x: number) => number
}