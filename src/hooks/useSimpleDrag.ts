import { CSSProperties, RefObject, useCallback, useEffect, useRef } from 'react'
import { useTimer } from 'react-timer'
import { Point, Size } from 'ytil'
import { getClientPoint } from '../dom'
import { useContinuousRef } from './refs'

export function useSimpleDrag<S>(ref: RefObject<Element | null>, config: SimpleDragConfig<S>) {
  const {
    enabled = true,
    threshold = 2,
  } = config

  const timer = useTimer()

  const stateRef = useRef<S | undefined>(undefined)
  const anchorRef = useRef<Point | undefined>(undefined)
  const historyRef = useRef<Array<{point: Point, time: number}>>([])
  const currentPointRef = useRef<Point | undefined>(undefined)
  const offsetRef = useRef<Point>({x: 0, y: 0})
  const sizeRef = useRef<Size>({width: 0, height: 0})
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

  const makeMetrics = useCallback((anchor: Point, extent: Point): DragMetrics => {
    const delta = {
      x: extent.x - anchor.x,
      y: extent.y - anchor.y,
    }
    const offset = offsetRef.current
    const size = sizeRef.current
    const velocity = computeVelocity(historyRef.current, {point: extent, time: performance.now()})
    return {
      anchor,
      offset,
      size,
      extent,
      delta,
      velocity,
    }
  }, [])

  const handleStart = useCallback((event: Event) => {
    if (!(event instanceof PointerEvent)) { return }
    if (!(event.target instanceof Element)) { return }
    if (!(event.currentTarget instanceof Element)) { return }
    if (configRef.current.rootOnly && event.target !== event.currentTarget) { return }
    if (pointerIdRef.current != null) { return }

    const anchor = getClientPoint(event)
    if (anchor == null) { return }

    anchorRef.current = anchor
    stateRef.current = undefined
    origTargetRef.current = event.target
    pointerIdRef.current = event.pointerId

    try {
      event.target.setPointerCapture(event.pointerId)
    } catch {}

    const rect = event.target.getBoundingClientRect()
    const offset = {
      x: anchor.x - rect.left,
      y: anchor.y - rect.top,
    }
    const size = {
      width:  rect.width,
      height: rect.height,
    }
    
    offsetRef.current = offset
    sizeRef.current = size  
  }, [configRef])

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
    if (element != null && pointerId != null) {
      try {
        element.releasePointerCapture(pointerId)
      } catch {}
    }

    resetCursor()
    anchorRef.current = undefined
    stateRef.current = undefined
    pointerIdRef.current = undefined
    currentPointRef.current = undefined
    timer.clearAll()
    historyRef.current = []
  }, [resetCursor, timer])

  const handleMove = useCallback((event: Event) => {
    if (!(event instanceof PointerEvent)) { return }
    if (!(event.target instanceof Element)) { return }
    if (configRef.current.rootOnly && event.target !== event.currentTarget) { return }

    if (anchorRef.current == null) {
      const point = getClientPoint(event)
      if (point == null) { return }

      configRef.current.move?.(makeRelative(point), event.target, event)
      return
    }

    if (event.pointerId !== pointerIdRef.current) { return }

    const point = getClientPoint(event)
    if (point == null) { return }
    
    const anchor = makeRelative(anchorRef.current)
    const extent = makeRelative(point)
    currentPointRef.current = extent

    const metrics = makeMetrics(anchor, extent)

    if (stateRef.current == null) {
      if (Math.hypot(metrics.delta.x, metrics.delta.y) <= threshold) {
        return
      }

      historyRef.current.push({point: extent, time: performance.now()})

      setDragCursor()

      const scheduleSample = () => {
        timer.setTimeout(() => {
          const p = currentPointRef.current
          if (p == null) { return }
          const history = historyRef.current
          history.push({point: p, time: performance.now()})
          const size = configRef.current.velocityHistorySize ?? 5
          if (history.length > size) {
            history.splice(0, history.length - size)
          }
          scheduleSample()
        }, configRef.current.velocitySampleInterval ?? 50)
      }
      scheduleSample()

      const state = configRef.current.start?.(metrics, event.target, event)
      stateRef.current = (state ?? {}) as S
    }

    configRef.current.drag?.(metrics, stateRef.current as S, event.target, event)
    event.preventDefault()
  }, [configRef, makeMetrics, makeRelative, setDragCursor, threshold, timer])

  const handleEnd = useCallback((event: Event) => {
    if (!(event instanceof PointerEvent)) { return }
    if (!(event.target instanceof Element)) { return }
    if (!(event.currentTarget instanceof Element)) { return }
    if (configRef.current.rootOnly && event.target !== event.currentTarget) { return }
    if (event.pointerId !== pointerIdRef.current) { return }

    const state = stateRef.current
    const point = getClientPoint(event)

    if (anchorRef.current != null && point != null) {
      const anchor = makeRelative(anchorRef.current)
      const extent = makeRelative(point)
      const metrics = makeMetrics(anchor, extent)

      if (state != null) {
        configRef.current.end?.(metrics, state as S, event.target, event)
      } else if (event.target === origTargetRef.current) {
        configRef.current.click?.(metrics, event.target, event)
        event.preventDefault()
      }
    }

    clearDragState(event.currentTarget)
  }, [clearDragState, configRef, makeMetrics, makeRelative])

  const handleLostPointerCapture = useCallback((event: Event) => {
    if (!(event instanceof PointerEvent)) { return }
    if (!(event.target instanceof Element)) { return }
    if (!(event.currentTarget instanceof Element)) { return }
    if (configRef.current.rootOnly && event.target !== event.currentTarget) { return }
    if (event.pointerId !== pointerIdRef.current) { return }

    configRef.current.cancel?.(event.target, event)
    clearDragState(event.currentTarget)
  }, [clearDragState, configRef])

  const handleCancel = useCallback((event: Event) => {
    if (!(event instanceof PointerEvent)) { return }
    if (!(event.target instanceof Element)) { return }
    if (!(event.currentTarget instanceof Element)) { return }
    if (configRef.current.rootOnly && event.target !== event.currentTarget) { return }
    if (event.pointerId !== pointerIdRef.current) { return }

    configRef.current.cancel?.(event.target, event)
    clearDragState(event.currentTarget)
  }, [clearDragState, configRef])

  useEffect(() => {
    const element = ref.current
    if (element == null) { return }
    if (!enabled) { return }

    element.addEventListener('pointerdown', handleStart)
    element.addEventListener('pointermove', handleMove)
    element.addEventListener('pointerup', handleEnd)
    element.addEventListener('pointercancel', handleCancel)
    element.addEventListener('lostpointercapture', handleLostPointerCapture)
    return () => {
      element.removeEventListener('pointerdown', handleStart)
      element.removeEventListener('pointermove', handleMove)
      element.removeEventListener('pointerup', handleEnd)
      element.removeEventListener('pointercancel', handleCancel)
      element.removeEventListener('lostpointercapture', handleLostPointerCapture)
      clearDragState(element)
    }
  }, [clearDragState, enabled, handleCancel, handleEnd, handleLostPointerCapture, handleMove, handleStart, ref])
}

export interface SimpleDragConfig<S> {
  enabled?: boolean
  threshold?: number
  velocityHistorySize?: number
  velocitySampleInterval?: number
  cursor?: CSSProperties['cursor']
  rootOnly?: boolean

  start?: (metrics: DragMetrics, element: Element, event: PointerEvent | TouchEvent) => S
  drag?:  (metrics: DragMetrics, state: S, element: Element, event: PointerEvent | TouchEvent) => void
  end?:   (metrics: DragMetrics, state: S, element: Element, event: PointerEvent | TouchEvent) => void

  click?:  (metrics: DragMetrics, element: Element, event: PointerEvent | TouchEvent) => void
  move?:   (point: Point, element: Element, event: PointerEvent | TouchEvent) => void
  cancel?: (element: Element, event: PointerEvent | TouchEvent) => void
}

export interface DragMetrics {
  anchor: Point
  offset: Point
  extent: Point
  delta: Point
  size: Size
  velocity: Point
}

function computeVelocity(history: Array<{point: Point, time: number}>, current: {point: Point, time: number}): Point {
  const points = [...history, current]
  if (points.length < 2) { return {x: 0, y: 0} }
  const first = points[0]
  const last = points[points.length - 1]
  const dt = last.time - first.time
  if (dt === 0) { return {x: 0, y: 0} }
  return {
    x: (last.point.x - first.point.x) / dt,
    y: (last.point.y - first.point.y) / dt,
  }
}

