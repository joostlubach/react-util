import { isFunction, isPlainObject } from 'lodash'
import React from 'react'

export function childrenOfType<P>(children: React.ReactNode, ...types: React.ComponentType<P>[]): Array<React.ReactElement<P>> {
  const result: Array<React.ReactElement<P>> = []

  const isNodeOfType = (node: React.ReactNode) => {
    if (!React.isValidElement(node)) { return false }
    if (typeof node.type === 'string') { return false }
    return types.includes(node.type)
  }

  const iterate = (node: React.ReactNode) => {
    const array = React.Children.toArray(node) as Array<React.ReactElement<any>>
    for (const node of array) {
      if (isNodeOfType(node)) {
        result.push(node)
      } else if (isReactFragment(node)) {
        iterate(node.props.children)
      }
    }
  }

  iterate(children)
  return result
}

export function childrenNotOfType(children: React.ReactNode, types: React.ComponentType<any>[]): Array<React.ReactElement<any>> {
  const allChildren = React.Children.toArray(children) as Array<React.ReactElement<any>>

  return allChildren.filter(child => {
    if (!React.isValidElement(child)) { return true }
    return !types.includes((child as any).type)
  })
}

export function isReactText(children: React.ReactNode): children is string | number {
  return typeof children === 'string' || typeof children === 'number'
}

export function isReactFragment(children: React.ReactNode): children is React.ReactElement<{children?: React.ReactNode}> {
  return React.isValidElement(children) && children.type === React.Fragment
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
