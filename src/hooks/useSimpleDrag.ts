import { CSSProperties, RefObject, useCallback, useEffect, useRef } from 'react'
import { Point } from 'ytil'
import { getClientPoint } from '../dom'
import { useContinuousRef } from './refs'

export function useSimpleDrag<S, E extends Element>(ref: RefObject<E | null>, config: SimpleDragConfig<S, E>) {
  const {
    enabled = true,
    threshold = 2,
  } = config

  const stateRef = useRef<S | undefined>(undefined)
  const startPointRef = useRef<Point | undefined>(undefined)
  const configRef = useContinuousRef(config)
  const origCursorRef = useRef<CSSProperties['cursor'] | undefined>(undefined)

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

    if (origCursorRef.current != null) {
      document.body.style.cursor = origCursorRef.current
      origCursorRef.current = undefined
    }

    startPointRef.current = undefined
    stateRef.current = undefined
    document.removeEventListener('mousemove', handleDrag)
    document.removeEventListener('touchmove', handleDrag)
    document.removeEventListener('mouseup', handleEnd)
    document.removeEventListener('touchend', handleEnd)
  }, [configRef, handleDrag])

  const handleStart = useCallback((event: Event) => {
    if (!(event instanceof MouseEvent) && !(event instanceof TouchEvent)) { return }
    event.preventDefault()

    const startPoint = getClientPoint(event)
    if (startPoint == null) { return }
    startPointRef.current = startPoint

    const element = event.currentTarget
    const state = configRef.current.start?.(element as E, event)
    stateRef.current = state

    if (config.cursor != null) {
      origCursorRef.current = document.body.style.cursor
      document.body.style.cursor = config.cursor
    }

    document.addEventListener('pointermove', handleDrag)
    document.addEventListener('pointerup', handleEnd)
  }, [config.cursor, configRef, handleDrag, handleEnd])

  useEffect(() => {
    const element = ref.current
    if (element == null) { return }
    if (!enabled) { return }

    element.addEventListener('pointerdown', handleStart)
    return () => {
      element.removeEventListener('pointerdown', handleStart)
    }
  }, [enabled, handleStart, ref])
}

export interface SimpleDragConfig<S, E> {
  enabled?: boolean
  threshold?: number
  cursor?: CSSProperties['cursor']

  start?: (element: E, event: MouseEvent | TouchEvent) => S,
  drag?:  (metrics: DragMetrics, state: S, element: E, event: MouseEvent | TouchEvent) => void
  end?:   (state: S, element: E, event: MouseEvent | TouchEvent) => void,
}

export interface DragMetrics {
  anchor: Point
  extent: Point
  delta: Point
}

