interface ClosestOptions {
  until?: Element
}

export function closest(element: Element | EventTarget, predicate: (element: Element) => boolean, options: ClosestOptions = {}): Element | null {
  if (!(element instanceof Node)) { return null }

  for (
    let current: Node | null = element;
    current !== null;
    current = current.parentNode
  ) {
    if (current === options.until) {
      return null
    }
    if (current instanceof Element && predicate(current)) {
      return current
    }
  }

  return null
}
