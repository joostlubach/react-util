import { isFunction, isPlainObject } from 'lodash'
import React from 'react'

export function childrenOfType<P>(children: React.ReactNode, ...types: React.ComponentType<P>[]): Array<React.ReactElement<P>> {
  const allChildren = React.Children.toArray(children) as Array<React.ReactElement<any>>

  return allChildren.filter(child => {
    if (!React.isValidElement(child)) { return false }
    return types.includes((child as any).type)
  })
}

export function childrenNotOfType(children: React.ReactNode, types: React.ComponentType<any>[]): Array<React.ReactElement<any>> {
  const allChildren = React.Children.toArray(children) as Array<React.ReactElement<any>>

  return allChildren.filter(child => {
    if (!React.isValidElement(child)) { return true }
    return !types.includes((child as any).type)
  })
}

export function isReactText(children: React.ReactNode): children is React.ReactText {
  return typeof children === 'string' || typeof children === 'number'
}

export function isReactComponent<P>(arg: any): arg is React.ComponentType<P> {
  if (isPlainObject(arg) && arg.$$typeof != null) {
    return true
  }
  if (isFunction(arg)) {
    return true
  }

  return false
}

export function renderComponentOrElement(componentOrElement: React.ComponentType<Record<string, never>> | React.ReactNode): React.ReactNode
export function renderComponentOrElement<P>(componentOrElement: React.ComponentType<P> | React.ReactNode, propsForComponent: P): React.ReactNode
export function renderComponentOrElement(componentOrElement: React.ComponentType<any> | React.ReactNode, propsForComponent: any = {}) {
  if (componentOrElement == null) { return componentOrElement }

  if (React.isValidElement(componentOrElement)) {
    return componentOrElement
  } else if (isReactComponent(componentOrElement)) {
    return React.createElement(componentOrElement as React.ComponentType<any>, propsForComponent)
  }

  throw new Error(`${componentOrElement} is not a valid React component or element`)
}
