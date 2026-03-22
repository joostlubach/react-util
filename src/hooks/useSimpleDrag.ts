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
  const anchorRef = useRef<Point | undefined>(undefined)
  const didDragRef = useRef(false)
  const pointerIdRef = useRef<number | undefined>(undefined)
  const configRef = useContinuousRef(config)
  const origCursorRef = useRef<CSSProperties['cursor'] | undefined>(undefined)

  const makeRelative = useCallback((point: Point) => {
    const element = ref.current
    if (element == null) { return point }

    const rect = element.getBoundingClientRect()
    return {
      x: point.x - rect.left,
      y: point.y - rect.top,
    }
  }, [ref])

  const resetCursor = useCallback(() => {
    if (origCursorRef.current == null) { return }

    document.body.style.cursor = origCursorRef.current
    origCursorRef.current = undefined
  }, [])

  const setDragCursor = useCallback(() => {
    if (config.cursor == null || origCursorRef.current != null) { return }

    origCursorRef.current = document.body.style.cursor
    document.body.style.cursor = config.cursor
  }, [config.cursor])

  const clearDragState = useCallback((element?: E | null) => {
    const pointerId = pointerIdRef.current
    if (element != null && pointerId != null && element.hasPointerCapture(pointerId)) {
      element.releasePointerCapture(pointerId)
    }

    resetCursor()
    anchorRef.current = undefined
    stateRef.current = undefined
    didDragRef.current = false
    pointerIdRef.current = undefined
  }, [resetCursor])

  const handleMove = useCallback((event: Event) => {
    if (!(event instanceof PointerEvent)) { return }

    const element = event.currentTarget as E
    const anchor = anchorRef.current
    if (anchor == null) {
      const point = getClientPoint(event)
      if (point == null) { return }

      configRef.current.move?.(makeRelative(point), element, event)
      return
    }

    if (event.pointerId !== pointerIdRef.current) { return }

    const state = stateRef.current
    const point = getClientPoint(event)
    if (point == null) { return }

    const delta = {
      x: point.x - anchor.x,
      y: point.y - anchor.y,
    }
    if (!didDragRef.current && Math.hypot(delta.x, delta.y) <= threshold) {
      return
    }

    if (!didDragRef.current) {
      didDragRef.current = true
      setDragCursor()
    }

    event.preventDefault()

    const extent = makeRelative(point)
    const metrics: DragMetrics = {
      anchor,
      extent,
      delta,
    }

    configRef.current.drag?.(metrics, state as S, element, event)
  }, [configRef, makeRelative, setDragCursor, threshold])

  const handleEnd = useCallback((event: Event) => {
    if (!(event instanceof PointerEvent)) { return }
    if (event.pointerId !== pointerIdRef.current) { return }

    const state = stateRef.current
    const element = event.currentTarget as E
    const point = getClientPoint(event)

    const anchor = anchorRef.current
    if (anchor != null && point != null) {
      const delta = {
        x: point.x - anchor.x,
        y: point.y - anchor.y,
      }
      const didDrag = didDragRef.current || Math.hypot(delta.x, delta.y) > threshold
      const extent = makeRelative(point)
      if (!didDrag) {
        configRef.current.click?.(extent, element, event)
      } else {
        event.preventDefault()
        configRef.current.end?.({
          anchor: makeRelative(anchor),
          extent,
          delta,
        }, state as S, element, event)
      }
    }

    clearDragState(element)
  }, [clearDragState, configRef, makeRelative, threshold])

  const handleStart = useCallback((event: Event) => {
    if (!(event instanceof PointerEvent)) { return }
    if (pointerIdRef.current != null) { return }

    const anchor = getClientPoint(event)
    if (anchor == null) { return }

    const element = event.currentTarget as E
    anchorRef.current = anchor
    didDragRef.current = false
    pointerIdRef.current = event.pointerId

    const state = configRef.current.start?.(makeRelative(anchor), element, event)
    stateRef.current = state
    element.setPointerCapture(event.pointerId)
  }, [configRef, makeRelative])

  const handleLeave = useCallback((event: Event) => {
    if (!(event instanceof PointerEvent)) { return }
    if (anchorRef.current != null) { return }

    const element = event.currentTarget as E
    configRef.current.leave?.(element, event)
  }, [configRef])

  const handleCancel = useCallback((event: Event) => {
    if (!(event instanceof PointerEvent)) { return }
    if (event.pointerId !== pointerIdRef.current) { return }

    clearDragState(event.currentTarget as E)
  }, [clearDragState])

  useEffect(() => {
    const element = ref.current
    if (element == null) { return }
    if (!enabled) { return }

    element.addEventListener('pointerdown', handleStart)
    element.addEventListener('pointermove', handleMove)
    element.addEventListener('pointerup', handleEnd)
    element.addEventListener('pointercancel', handleCancel)
    element.addEventListener('pointerleave', handleLeave)
    return () => {
      element.removeEventListener('pointerdown', handleStart)
      element.removeEventListener('pointermove', handleMove)
      element.removeEventListener('pointerup', handleEnd)
      element.removeEventListener('pointercancel', handleCancel)
      element.removeEventListener('pointerleave', handleLeave)
      clearDragState(element)
    }
  }, [clearDragState, enabled, handleCancel, handleEnd, handleLeave, handleMove, handleStart, ref])
}

export interface SimpleDragConfig<S, E> {
  enabled?: boolean
  threshold?: number
  cursor?: CSSProperties['cursor']

  start?: (point: Point, element: E, event: PointerEvent | TouchEvent) => S
  drag?:  (metrics: DragMetrics, state: S, element: E, event: PointerEvent | TouchEvent) => void
  end?:   (metrics: DragMetrics, state: S, element: E, event: PointerEvent | TouchEvent) => void

  click?: (point: Point, element: E, event: PointerEvent | TouchEvent) => void
  move?: (point: Point, element: E, event: PointerEvent | TouchEvent) => void
  leave?: (element: E, event: PointerEvent | TouchEvent) => void,
}

export interface DragMetrics {
  anchor: Point
  extent: Point
  delta: Point
}

