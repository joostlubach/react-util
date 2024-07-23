import React, { useRef } from 'react'
import { Size } from 'ytil'
import { isRefObject } from './refs'

export function useMeasure(ref: React.RefObject<HTMLElement>, options?: UseMeasureOptions): Size
export function useMeasure(options?: UseMeasureOptions): [Size, React.Ref<HTMLElement>]
export function useMeasure(...args: any[]) {
  const ownRef = useRef()
  const ref = isRefObject(args[0]) ? args.shift() : ownRef
  const options = args.shift() ?? {} as UseMeasureOptions

  const [size, setSize] = React.useState<Size>({width: 0, height: 0})

  React.useEffect(() => {
    const element = ref.current
    if (element == null) { return }

    const measure = () => {
      const {width, height} = element.getBoundingClientRect()
      setSize({width, height})
    }

    const observer = new ResizeObserver(measure)
    observer.observe(element)
    measure()
    return () => observer.disconnect()
  }, [ref])

  if (ref === ownRef) {
    return [size, ref]
  } else {
    return size
  }
}

export interface UseMeasureOptions {
}