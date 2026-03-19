import { Point } from 'ytil'

export function getClientPoint(event: MouseEvent | TouchEvent | PointerEvent): Point | null {
  if (event instanceof MouseEvent || event instanceof PointerEvent) {
    return {
      x: event.clientX,
      y: event.clientY,
    }
  } else if (event.touches.length > 0) {
    return {
      x: event.touches[0].clientX,
      y: event.touches[0].clientY,
    }
  } else {
    return null
  }
}

export function isRightMouse(event: MouseEvent | TouchEvent) {
  if (isTouchEvent(event)) { return false }
  return event.button !== 0
}

export function isTouchEvent(event: MouseEvent | TouchEvent): event is TouchEvent {
  if (!('TouchEvent' in window)) { return false }
  return event instanceof TouchEvent
}