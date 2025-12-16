import { RefObject, useCallback, useEffect, useRef } from 'react'
import { useContinuousRef } from 'react-util/hooks'
import { Point } from 'ytil'
import { getClientPoint } from '../dom'

export function useSimpleDrag<S, E extends Element>(ref: RefObject<E | null>, config: SimpleDragConfig<S, E>) {
  const {
    enabled,
    threshold = 2,
  } = config

  const stateRef = useRef<S | undefined>(undefined)
  const startPointRef = useRef<Point | undefined>(undefined)
  const configRef = useContinuousRef(config)

  const handleDrag = useCallback((event: Event) => {
    if (!(event instanceof MouseEvent) && !(event instanceof TouchEvent)) { return }
    event.preventDefault()

    const state = stateRef.current
    const startPoint = startPointRef.current
    const element = event.currentTarget
    if (startPoint == null) { return }

    const point = getClientPoint(event)
    if (point == null) { return }

    const delta = {
      x: point.x - startPoint.x,
      y: point.y - startPoint.y,
    }
    if (Math.abs(delta.x) < threshold && Math.abs(delta.y) < threshold) {
      return
    }

    const metrics: DragMetrics = {
      anchor: startPoint,
      extent: point,
      delta,
    }

    configRef.current.drag?.(metrics, state as S, element as E, event)
  }, [configRef, threshold])

  const handleEnd = useCallback((event: Event) => {
    if (!(event instanceof MouseEvent) && !(event instanceof TouchEvent)) { return }
    event.preventDefault()

    const state = stateRef.current
    const element = event.currentTarget
    configRef.current.end?.(state as S, element as E, event)

    startPointRef.current = undefined
    stateRef.current = undefined
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
    const state = configRef.current.start?.(element as E, event)
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
  threshold?: number

  start?: (element: E, event: MouseEvent | TouchEvent) => S,
  drag?:  (metrics: DragMetrics, state: S, element: E, event: MouseEvent | TouchEvent) => void
  end?:   (state: S, element: E, event: MouseEvent | TouchEvent) => void,
}

export interface DragMetrics {
  anchor: Point
  extent: Point
  delta: Point
}

