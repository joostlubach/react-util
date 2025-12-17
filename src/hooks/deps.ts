import { isArray, isPlainObject } from 'lodash'
import React from 'react'
import { objectKeys } from 'ytil'
import { useContinuousRef } from './refs'

/**
 * Sometimes an argument is too complex for the regular deps algorithm to work. However, eslint will
 * complain with `react-hooks/exhaustive-deps` if the deps array does not match the used variables
 * exactly. This hook circumvents this. Use the second argument to provide a mapping from the
 * complex value to the semantically equivalent deps array.
 *
 * Make sure to canonize the deps array, e.g. sorting object keys alphabetically to avoid unnecessary
 * re-renders.
 */
export function useWithStableDeps<T>(value: T, valueToDeps: ((value: T) => unknown[]) = defaultValueToDeps) {
  const currentValueRef = useContinuousRef(value)
  const deps = valueToDeps(value)

  // eslint-disable-next-line react-hooks/exhaustive-deps
  return React.useMemo(() => currentValueRef.current, deps)
}

function defaultValueToDeps(val: any): any[] {
  if (isArray(val)) {
    return [JSON.stringify([...val].sort())]
  } else if (isPlainObject(val)) {
    const sortedKeys = objectKeys(val).sort()
    const sorted = sortedKeys.map(it => [it, val[it]])
    return [JSON.stringify(sorted)]
  } else {
    return []
  }
}