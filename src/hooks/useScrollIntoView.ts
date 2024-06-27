import React from 'react'
import scrollIntoView from 'scroll-into-view'

import { useContinuousRef } from './refs'

export function useScrollIntoView(settings?: __ScrollIntoView.Settings) {
  const settingsRef = useContinuousRef(settings)

  const connect = React.useCallback((element: HTMLElement | null) => {
    if (element != null) {
      scrollIntoView(element, settingsRef.current ?? {})
    }
  }, [settingsRef])

  return connect
}
