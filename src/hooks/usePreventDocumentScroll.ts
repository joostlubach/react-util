import { useEffect } from 'react'

let lockCounter = 0
let originalStyles: {
  htmlOverflow: string
  htmlOverscrollBehavior: string
  bodyOverflow: string
  bodyOverscrollBehavior: string
} | null = null

export function usePreventDocumentScroll(enabled: boolean) {
  useEffect(() => {
    if (!enabled) { return }

    if (lockCounter === 0) {
      originalStyles = {
        htmlOverflow:           document.documentElement.style.overflow,
        htmlOverscrollBehavior: document.documentElement.style.overscrollBehavior,
        bodyOverflow:           document.body.style.overflow,
        bodyOverscrollBehavior: document.body.style.overscrollBehavior,
      }
    }

    lockCounter += 1

    document.documentElement.style.overflow = 'hidden'
    document.documentElement.style.overscrollBehavior = 'none'
    document.body.style.overflow = 'hidden'
    document.body.style.overscrollBehavior = 'none'

    return () => {
      lockCounter -= 1
      if (lockCounter <= 0) {
        lockCounter = 0

        if (originalStyles != null) {
          document.documentElement.style.overflow = originalStyles.htmlOverflow
          document.documentElement.style.overscrollBehavior = originalStyles.htmlOverscrollBehavior
          document.body.style.overflow = originalStyles.bodyOverflow
          document.body.style.overscrollBehavior = originalStyles.bodyOverscrollBehavior
        }

        originalStyles = null
      }
    }
  }, [enabled])
}