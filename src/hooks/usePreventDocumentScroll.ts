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

let lockCounter = 0
let originalStyles: OriginalStyles | null = null

interface OriginalStyles {
  htmlOverflow:           string
  htmlOverscrollBehavior: string
  bodyOverflow:           string
  bodyOverscrollBehavior: string
  bodyPaddingRight:       string
}

function lock() {
  const html = document.documentElement
  const body = document.body

  originalStyles = {
    htmlOverflow:           html.style.overflow,
    htmlOverscrollBehavior: html.style.overscrollBehavior,
    bodyOverflow:           body.style.overflow,
    bodyOverscrollBehavior: body.style.overscrollBehavior,
    bodyPaddingRight:       body.style.paddingRight,
  }

  // Measured before hiding the overflow, so the content doesn't shift when the scrollbar disappears.
  const scrollbarWidth = window.innerWidth - html.clientWidth
  if (scrollbarWidth > 0) {
    const paddingRight = parseFloat(getComputedStyle(body).paddingRight) || 0
    body.style.paddingRight = `${paddingRight + scrollbarWidth}px`
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
  body.style.paddingRight = originalStyles.bodyPaddingRight

  originalStyles = null
}
