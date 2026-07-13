export function closestScrollElement(from: Element | null): HTMLElement | null {
  let element = from?.parentElement ?? null

  while (element != null) {
    const style = getComputedStyle(element)
    if (style.overflow === 'auto' || style.overflow === 'scroll') {
      return element
    }
    element = element.parentElement
  }

  return null
}