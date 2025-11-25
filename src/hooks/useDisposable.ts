import { useEffect } from 'react'
import { hasMethod } from 'ytil'

export function useDisposable<T>(disposable: T): T {
  useEffect(() => () => {
    if (hasMethod(disposable, 'dispose', 0)) {
      disposable.dispose()
    }
  }, [disposable])
  return disposable
}