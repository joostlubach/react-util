import { useEffect } from 'react'

export function useDisposable<T>(disposable: T): T {
  useEffect(() => () => {
    if (disposable instanceof Object && 'dispose' in disposable) {
      (disposable as any).dispose()
    }
  }, [disposable])
  return disposable
}