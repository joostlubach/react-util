import { Children, createElement, isValidElement, ReactNode } from 'react'

export function renderWithSeparator(elements: ReactNode, Separator: React.ComponentType<{}>) {
  const result: ReactNode[] = []

  let count = 0
  for (const [index, element] of Children.toArray(elements).entries()) {
    if (isValidElement(element)) {
      if (count++ > 0) {
        result.push(createElement(Separator, {
          key: `$separator-${index}`,
        }))
      }
    }
    result.push(element)
  }

  return result
}
