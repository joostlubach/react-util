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

/** Marker classes for fixed elements that should make up for the scrollbar width while the document is locked. */
export interface PreventDocumentScrollOptions {
  /** Gets the scrollbar width added to its right padding, like the body. For full-width bars (Joy's `mui-fixed`). */
  padClassName?: string | null

  /** Gets the scrollbar width added to its right margin, which keeps a right-anchored element where it was. */
  shiftClassName?: string | null
}

export function configurePreventDocumentScroll(config: PreventDocumentScrollOptions) {
  Object.assign(options, config)
}

const options: PreventDocumentScrollOptions = {
  padClassName:   null,
  shiftClassName: null,
}

let lockCounter = 0
let originalStyles: OriginalStyles | null = null

interface OriginalStyles {
  htmlOverflow:           string
  htmlOverscrollBehavior: string
  bodyOverflow:           string
  bodyOverscrollBehavior: string
  compensated:            Array<[HTMLElement, CompensatedProperty, string]>
}

type CompensatedProperty = 'paddingRight' | 'marginRight'

function lock() {
  const html = document.documentElement
  const body = document.body

  originalStyles = {
    htmlOverflow:           html.style.overflow,
    htmlOverscrollBehavior: html.style.overscrollBehavior,
    bodyOverflow:           body.style.overflow,
    bodyOverscrollBehavior: body.style.overscrollBehavior,
    compensated:            [],
  }

  // Measured before hiding the overflow, so the content doesn't shift when the scrollbar disappears.
  const scrollbarWidth = window.innerWidth - html.clientWidth
  if (scrollbarWidth > 0) {
    for (const element of [body, ...markedElements(options.padClassName)]) {
      compensate(element, 'paddingRight', scrollbarWidth)
    }
    for (const element of markedElements(options.shiftClassName)) {
      compensate(element, 'marginRight', scrollbarWidth)
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

  for (const [element, property, value] of originalStyles.compensated) {
    element.style[property] = value
  }

  originalStyles = null
}

function compensate(element: HTMLElement, property: CompensatedProperty, scrollbarWidth: number) {
  originalStyles?.compensated.push([element, property, element.style[property]])

  const current = parseFloat(getComputedStyle(element)[property]) || 0
  element.style[property] = `${current + scrollbarWidth}px`
}

function markedElements(className: string | null | undefined): HTMLElement[] {
  if (className == null) { return [] }

  const elements = document.getElementsByClassName(className)
  return Array.from(elements).filter((it): it is HTMLElement => it instanceof HTMLElement)
}
