import { useCallback } from 'react'
import { useRefMap } from 'react-util/hooks'

export function useScrollSync<K>() {
  const refs = useRefMap<K, HTMLElement>({
    onAssign:   element => element.addEventListener('scroll', handleScroll),
    onUnassign: element => element.removeEventListener('scroll', handleScroll),
  })

  const handleScroll = useCallback((event: Event) => {
    const current = event.currentTarget
    if (!(current instanceof HTMLElement)) { return }

    const elements = refs.all()
    const others = elements.filter(it => it !== event.currentTarget)
    for (const element of others) {
      element.scrollTop = current.scrollTop
      element.scrollLeft = current.scrollLeft
    }
  }, [refs])

  return useCallback((key: K) => refs.for(key), [refs])
}
