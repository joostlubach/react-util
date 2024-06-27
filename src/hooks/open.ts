import React from 'react'

/**
 * Use when you want to open something like a form dialog which depends on data. There might
 * be some animation to open / close the form, which means that if you just use the data
 * directly, it might not be in sync with the animation.
 *
 * This hook allows you to specify the `open` and the `data` property separately. When the
 * `open` property is set to `true`, the `data` property will be set to the value of the
 * `value` property. When the `open` property is set to `false`, the `data` property will
 * *not* immediately be set to `null`.
 *
 * @param data  The data for the form or component.
 * @param close A callback to close the form or component.
 * @returns A tuple of `[open, current, requestClose]` where `current` is the memoized data.
 */
export function useOpen<T>(data: T | null, close: () => any): FormOpenHook<T> {
  const [open, setOpen] = React.useState<boolean>(data != null)
  const [current, setCurrent] = React.useState<T | null>(null)

  React.useEffect(() => {
    if (data == null) {
      setOpen(false)
    } else {
      setCurrent(data)
      setOpen(true)
    }
  }, [data])

  const requestClose = React.useCallback(() => {
    setOpen(false)
    close()
  }, [close])

  return [open, current, requestClose]
}

export type FormOpenHook<T> = [
  boolean, // open
  T | null, // current
  () => void, // onReuestClose
]
