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

  const handleDrag = useCallback((event: Event) => {
    if (!(event instanceof PointerEvent)) { return }
    event.preventDefault()

    const state = stateRef.current
    const anchor = anchorRef.current
    const element = event.currentTarget
    if (anchor == null) { return }

    const point = getClientPoint(event)
    if (point == null) { return }

    const delta = {
      x: point.x - anchor.x,
      y: point.y - anchor.y,
    }
    if (Math.abs(delta.x) < threshold && Math.abs(delta.y) < threshold) {
      return
    }

    const extent = makeRelative(point)
    const metrics: DragMetrics = {
      anchor,
      extent,
      delta,
    }

    configRef.current.drag?.(metrics, state as S, element as E, event)
  }, [configRef, makeRelative, threshold])

  const handleMove = useCallback((event: Event) => {
    if (!(event instanceof PointerEvent)) { return }
    event.preventDefault()

    const anchor = anchorRef.current
    const element = event.currentTarget
    if (anchor != null) { return }

    const point = getClientPoint(event)
    if (point == null) { return }

    configRef.current.move?.(makeRelative(point), element as E, event)
  }, [configRef, makeRelative])

  const handleEnd = useCallback((event: Event) => {
    if (!(event instanceof PointerEvent)) { return }
    event.preventDefault()

    const state = stateRef.current
    const element = event.currentTarget
    const point = getClientPoint(event)
    if (point == null) { return }

    if (origCursorRef.current != null) {
      document.body.style.cursor = origCursorRef.current
      origCursorRef.current = undefined
    }

    const anchor = anchorRef.current
    if (anchor != null && point != null) {
      const delta = {
        x: point.x - anchor.x,
        y: point.y - anchor.y,
      }

      const extent = makeRelative(point)
      if (Math.abs(delta.x) < threshold && Math.abs(delta.y) < threshold) {
        configRef.current.click?.(extent, element as E, event)
      } else {
        configRef.current.end?.({
          anchor: makeRelative(anchor),
          extent,
          delta,
        }, state as S, element as E, event)
      }
    }

    anchorRef.current = undefined
    stateRef.current = undefined
    document.removeEventListener('pointermove', handleDrag)
    document.removeEventListener('pointerup', handleEnd)
  }, [configRef, handleDrag, makeRelative, threshold])

  const handleStart = useCallback((event: Event) => {
    if (!(event instanceof PointerEvent)) { return }
    event.preventDefault()

    const anchor = getClientPoint(event)
    if (anchor == null) { return }
    anchorRef.current = anchor
    
    const element = event.currentTarget
    const state = configRef.current.start?.(makeRelative(anchor), element as E, event)
    stateRef.current = state

    if (config.cursor != null) {
      origCursorRef.current = document.body.style.cursor
      document.body.style.cursor = config.cursor
    }

    document.addEventListener('pointermove', handleDrag)
    document.addEventListener('pointerup', handleEnd)
  }, [config.cursor, configRef, handleDrag, handleEnd, makeRelative])

  const handleLeave = useCallback((event: Event) => {
    if (!(event instanceof PointerEvent)) { return }
    event.preventDefault()

    const element = event.currentTarget
    configRef.current.leave?.(element as E, event)

    stateRef.current = undefined
    anchorRef.current = undefined
    if (origCursorRef.current != null) {
      document.body.style.cursor = origCursorRef.current
      origCursorRef.current = undefined
    }
    document.removeEventListener('pointermove', handleDrag)
    document.removeEventListener('pointerup', handleEnd)
  }, [configRef, handleDrag, handleEnd])

  useEffect(() => {
    const element = ref.current
    if (element == null) { return }
    if (!enabled) { return }

    element.addEventListener('pointerdown', handleStart)
    if (config.move != null) {
      element.addEventListener('pointermove', handleMove)
    }
    if (config.leave != null) {
      element.addEventListener('pointerleave', handleLeave)
    }
    return () => {
      element.removeEventListener('pointerdown', handleStart)
      if (config.move != null) {
        element.removeEventListener('pointermove', handleMove)
      }
      if (config.leave != null) {
        element.removeEventListener('pointerleave', handleLeave)
      }
    }
  }, [config.leave, config.move, configRef, enabled, handleLeave, handleMove, handleStart, ref])
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

