export function findElementForEvent(event: MouseEvent | TouchEvent): Element | null {
  if (event instanceof MouseEvent) {
    return event.target instanceof Element ? event.target : null
  } else if (event.touches.length > 0) {
    const touch = event.touches[0]
    return document.elementFromPoint(touch.clientX, touch.clientY)
  } else {
    return null
  }
}