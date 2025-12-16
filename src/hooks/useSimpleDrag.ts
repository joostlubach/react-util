import { RefObject, useCallback, useEffect, useRef } from 'react'
import { useContinuousRef } from 'react-util/hooks'
import { Point } from 'ytil'
import { getClientPoint } from '../dom'

export function useSimpleDrag<S, E extends Element>(ref: RefObject<E | null>, config: SimpleDragConfig<S, E>) {
  const stateRef = useRef<S | null>(null)
  const startPointRef = useRef<Point | null>(null)
  const configRef = useContinuousRef(config)
  const {enabled} = config

  const handleDrag = useCallback((event: Event) => {
    if (!(event instanceof MouseEvent) && !(event instanceof TouchEvent)) { return }
    event.preventDefault()

    const state = stateRef.current
    const startPoint = startPointRef.current
    const element = event.currentTarget
    if (state == null || startPoint == null) { return }

    const point = getClientPoint(event)
    if (point == null) { return }

    const delta = {
      x: point.x - startPoint.x,
      y: point.y - startPoint.y,
    }

    configRef.current.drag(delta, state, element as E)
  }, [configRef])

  const handleEnd = useCallback((event: Event) => {
    if (!(event instanceof MouseEvent) && !(event instanceof TouchEvent)) { return }
    event.preventDefault()

    const state = stateRef.current
    const element = event.currentTarget
    if (state == null) { return }

    configRef.current.end(state, element as E)

    document.removeEventListener('mousemove', handleDrag)
    document.removeEventListener('touchmove', handleDrag)
    document.removeEventListener('mouseup', handleEnd)
    document.removeEventListener('touchend', handleEnd)
  }, [configRef, handleDrag])

  const handleStart = useCallback((event: Event) => {
    if (!(event instanceof MouseEvent) && !(event instanceof TouchEvent)) { return }

    const startPoint = getClientPoint(event)
    if (startPoint == null) { return }
    startPointRef.current = startPoint

    const element = event.currentTarget
    const state = configRef.current.start(element as E)
    stateRef.current = state

    document.addEventListener('mousemove', handleDrag)
    document.addEventListener('touchmove', handleDrag)
    document.addEventListener('mouseup', handleEnd)
    document.addEventListener('touchend', handleEnd)
  }, [configRef, handleDrag, handleEnd])

  useEffect(() => {
    const element = ref.current
    if (element == null) { return }
    if (!enabled) { return }

    element.addEventListener('mousedown', handleStart)
    element.addEventListener('touchstart', handleStart)
    return () => {
      element.removeEventListener('mousedown', handleStart)
      element.removeEventListener('touchstart', handleStart)
    }
  }, [enabled, handleStart, ref])
}

export interface SimpleDragConfig<S, E> {
  enabled?: boolean
  start: (element: E) => S,
  drag:  (delta: Point, state: S, element: E) => void
  end:   (state: S, element: E) => void,
}