export function closest(element: Element | EventTarget, predicate: (element: Element) => boolean, options: ClosestOptions & {html: true}): HTMLElement | null
export function closest(element: Element | EventTarget, predicate: (element: Element) => boolean, options: ClosestOptions & {svg: true}): SVGElement | null
export function closest(element: Element | EventTarget, predicate: (element: Element) => boolean, options?: ClosestOptions): Element | null
export function closest(element: Element | EventTarget, predicate: (element: Element) => boolean, options: ClosestOptions = {}): Element | null {
  if (!(element instanceof Node)) { return null }

  const {
    html = false,
    svg = false,
    until,
  } = options

  const matches = (node: Node): node is Element => {
    if (html) {
      if (!(node instanceof HTMLElement)) { return false }
    } else if (svg) {
      if (!(node instanceof SVGElement)) { return false }
    } else {
      if (!(node instanceof Element)) { return false }
    }
    return predicate(node)
  }

  for (
    let current: Node | null = element;
    current !== null;
    current = current.parentNode
  ) {
    if (current === until) {
      return null
    }
    if (matches(current)) {
      return current
    }
  }

  return null
}

export interface ClosestOptions {
  until?: Element
  html?:  boolean
  svg?:   boolean
}