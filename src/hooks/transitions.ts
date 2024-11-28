import { CSSProperties, useEffect, useMemo, useState } from 'react'
import { useTimer } from 'react-timer'

export function useOverflowDuringTransition(ref: React.RefObject<HTMLElement>, overflow: CSSProperties['overflow']) {
  useEffect(() => {
    const layerControl = ref.current
    if (layerControl == null) { return }

    const onTransitionStart = () => {
      layerControl.style.overflow = overflow ?? ''
    }
    const onTransitionEnd = () => {
      layerControl.style.overflow = ''
    }

    layerControl.addEventListener('transitionstart', onTransitionStart)
    layerControl.addEventListener('transitionend', onTransitionEnd)
  
    return () => {
      layerControl.removeEventListener('transitionstart', onTransitionStart)
      layerControl.removeEventListener('transitionend', onTransitionEnd)
    }
  }, [overflow, ref])
}

export function useTransitionValue<E extends HTMLElement>(ref: React.RefObject<E>, calculate: (element: E) => number, interval: number = 50) {
  const [value, setValue] = useState<number | undefined>()
  const timer = useTimer()

  const obj = useMemo(() => ({}), [])

  useEffect(() => {
    const element = ref.current
    if (element == null) { return }
    
    const tick = () => {
      timer.requestAnimationFrame(() => {
        setValue(calculate(element))
      })
      timer.setTimeout(tick, interval)
    }

    const onTransitionStart = () => {
      timer.setTimeout(tick, 0)
    }
    const onTransitionEnd = () => {
      timer.setTimeout(() => {
        timer.clearAll()
      }, 16)
    }

    element.addEventListener('transitionstart', onTransitionStart)
    element.addEventListener('transitionend', onTransitionEnd)
  
    return () => {
      timer.clearAll()
      element.removeEventListener('transitionstart', onTransitionStart)
      element.removeEventListener('transitionend', onTransitionEnd)
    }
  }, [setValue, ref, calculate, timer, interval, obj])

  return [value, setValue] as const
}