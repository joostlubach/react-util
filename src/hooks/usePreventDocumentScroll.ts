import { useEffect } from 'react'

export function usePreventDocumentScroll(enabled: boolean) {
  useEffect(() => {
    if (!enabled) { return }

    if (lockCounter === 0) {
      lock()
    }
    lockCounter += 1

    return () => {
      lockCounter -= 1
      if (lockCounter <= 0) {
        lockCounter = 0
        unlock()
      }
    }
  }, [enabled])
}

export interface PreventDocumentScrollOptions {
  /** Fixed elements with this class get the scrollbar width added to their right padding too, like Joy's `mui-fixed`. */
  fixedClassName?: string | null
}

export function configurePreventDocumentScroll(config: PreventDocumentScrollOptions) {
  Object.assign(options, config)
}

const options: PreventDocumentScrollOptions = {
  fixedClassName: null,
}

let lockCounter = 0
let originalStyles: OriginalStyles | null = null

interface OriginalStyles {
  htmlOverflow:           string
  htmlOverscrollBehavior: string
  bodyOverflow:           string
  bodyOverscrollBehavior: string
  paddingRight:           Map<HTMLElement, string>
}

function lock() {
  const html = document.documentElement
  const body = document.body

  originalStyles = {
    htmlOverflow:           html.style.overflow,
    htmlOverscrollBehavior: html.style.overscrollBehavior,
    bodyOverflow:           body.style.overflow,
    bodyOverscrollBehavior: body.style.overscrollBehavior,
    paddingRight:           new Map(),
  }

  // Measured before hiding the overflow, so the content doesn't shift when the scrollbar disappears.
  const scrollbarWidth = window.innerWidth - html.clientWidth
  if (scrollbarWidth > 0) {
    for (const element of paddedElements()) {
      originalStyles.paddingRight.set(element, element.style.paddingRight)

      const paddingRight = parseFloat(getComputedStyle(element).paddingRight) || 0
      element.style.paddingRight = `${paddingRight + scrollbarWidth}px`
    }
  }

  html.style.overflow = 'hidden'
  html.style.overscrollBehavior = 'none'
  body.style.overflow = 'hidden'
  body.style.overscrollBehavior = 'none'
}

function unlock() {
  if (originalStyles == null) { return }

  const html = document.documentElement
  const body = document.body

  html.style.overflow = originalStyles.htmlOverflow
  html.style.overscrollBehavior = originalStyles.htmlOverscrollBehavior
  body.style.overflow = originalStyles.bodyOverflow
  body.style.overscrollBehavior = originalStyles.bodyOverscrollBehavior

  for (const [element, paddingRight] of originalStyles.paddingRight) {
    element.style.paddingRight = paddingRight
  }

  originalStyles = null
}

function paddedElements(): HTMLElement[] {
  const {fixedClassName} = options
  if (fixedClassName == null) { return [document.body] }

  const fixed = document.getElementsByClassName(fixedClassName)
  return [document.body, ...Array.from(fixed).filter((it): it is HTMLElement => it instanceof HTMLElement)]
}
