import { CSSProperties, RefObject, useCallback, useEffect, useRef } from 'react'
import { Point, Size } from 'ytil'
import { getClientPoint } from '../dom'
import { useContinuousRef } from './refs'

export function useSimpleDrag<S>(ref: RefObject<Element | null>, config: SimpleDragConfig<S>) {
  const {
    enabled = true,
    threshold = 2,
  } = config

  const stateRef = useRef<S | undefined>(undefined)
  const anchorRef = useRef<Point | undefined>(undefined)
  const offsetRef = useRef<Point>({x: 0, y: 0})
  const sizeRef = useRef<Size>({width: 0, height: 0})
  const didDragRef = useRef(false)
  const pointerIdRef = useRef<number | undefined>(undefined)
  const configRef = useContinuousRef(config)
  const origCursorRef = useRef<CSSProperties['cursor'] | undefined>(undefined)
  const origTargetRef = useRef<EventTarget | null>(null)

  const makeRelative = useCallback((point: Point) => {
    const element = ref.current
    if (element == null) { return point }

    const rect = element.getBoundingClientRect()
    return {
      x: point.x - rect.left,
      y: point.y - rect.top,
    }
  }, [ref])

  const makeMetrics = useCallback((anchor: Point, extent: Point) => {
    const delta = {
      x: extent.x - anchor.x,
      y: extent.y - anchor.y,
    }
    const offset = offsetRef.current
    const size = sizeRef.current  
    return {
      anchor,
      offset,
      size,
      extent,
      delta,
    }

  }, [])

  const handleStart = useCallback((event: Event) => {
    if (!(event instanceof PointerEvent)) { return }
    if (!(event.target instanceof Element)) { return }
    if (pointerIdRef.current != null) { return }

    const point = getClientPoint(event)
    if (point == null) { return }

    anchorRef.current = point
    didDragRef.current = false
    origTargetRef.current = event.target
    pointerIdRef.current = event.pointerId

    const anchor = makeRelative(point)
    const rect = event.target.getBoundingClientRect()
    const offset = {
      x: point.x - rect.left,
      y: point.y - rect.top,
    }
    const size = {
      width:  rect.width,
      height: rect.height,
    }
    
    offsetRef.current = offset
    sizeRef.current = size  

    const metrics = makeMetrics(anchor, anchor)
    stateRef.current = configRef.current.start?.(metrics, event.target, event)
  }, [configRef, makeMetrics, makeRelative])

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

  const clearDragState = useCallback((element?: Element | null) => {
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
    if (!(event.target instanceof Element)) { return }

    if (anchorRef.current == null) {
      const point = getClientPoint(event)
      if (point == null) { return }

      configRef.current.move?.(makeRelative(point), event.target, event)
      return
    }

    if (event.pointerId !== pointerIdRef.current) { return }

    const state = stateRef.current

    const point = getClientPoint(event)
    if (point == null) { return }
    
    const anchor = makeRelative(anchorRef.current)
    const extent = makeRelative(point)
    const metrics = makeMetrics(anchor, extent)
    if (!didDragRef.current && Math.hypot(metrics.delta.x, metrics.delta.y) <= threshold) {
      return
    }

    if (!didDragRef.current) {
      didDragRef.current = true
      setDragCursor()
      const pointerId = pointerIdRef.current
      if (pointerId != null) {
        event.target.setPointerCapture(pointerId)
      }
    }

    event.preventDefault()

    configRef.current.drag?.(metrics, state as S, event.target, event)
  }, [configRef, makeMetrics, makeRelative, setDragCursor, threshold])

  const handleEnd = useCallback((event: Event) => {
    if (!(event instanceof PointerEvent)) { return }
    if (!(event.target instanceof Element)) { return }
    if (event.pointerId !== pointerIdRef.current) { return }

    const state = stateRef.current
    const point = getClientPoint(event)

    if (anchorRef.current != null && point != null) {
      const anchor = makeRelative(anchorRef.current)
      const extent = makeRelative(point)
      const metrics = makeMetrics(anchor, extent)

      if (!didDragRef.current && event.target === origTargetRef.current) {
        configRef.current.click?.(metrics, state as S, event.target, event)
      } else {
        const offset = offsetRef.current
        const size = sizeRef.current  
        configRef.current.end?.(metrics, state as S, event.target, event)
        event.preventDefault()
      }
    }

    clearDragState(event.target)
  }, [clearDragState, configRef, makeMetrics, makeRelative])

  const handleLeave = useCallback((event: Event) => {
    if (!(event instanceof PointerEvent)) { return }
    if (!(event.target instanceof Element)) { return }
    if (anchorRef.current != null) { return }
    
    configRef.current.leave?.(event.target, stateRef.current as S | null, event)
  }, [configRef])

  const handleCancel = useCallback((event: Event) => {
    if (!(event instanceof PointerEvent)) { return }
    if (!(event.target instanceof Element)) { return }
    if (event.pointerId !== pointerIdRef.current) { return }

    clearDragState(event.target)
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

export interface SimpleDragConfig<S> {
  enabled?: boolean
  threshold?: number
  cursor?: CSSProperties['cursor']

  start?: (metrics: DragMetrics, element: Element, event: PointerEvent | TouchEvent) => S
  drag?:  (metrics: DragMetrics, state: S, element: Element, event: PointerEvent | TouchEvent) => void
  end?:   (metrics: DragMetrics, state: S, element: Element, event: PointerEvent | TouchEvent) => void

  click?: (metrics: DragMetrics, state: S, element: Element, event: PointerEvent | TouchEvent) => void
  leave?: (element: Element, state: S | null, event: PointerEvent | TouchEvent) => void,
  move?: (point: Point, element: Element, event: PointerEvent | TouchEvent) => void
}

export interface DragMetrics {
  anchor: Point
  offset: Point
  size: Size
  extent: Point
  delta: Point
}

