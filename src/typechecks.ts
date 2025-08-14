import { isFunction, isPlainObject } from 'lodash'
import {
  Children,
  ComponentType,
  createElement,
  Fragment,
  isValidElement,
  Provider,
  ReactElement,
  ReactNode,
} from 'react'

export function childrenOfType<P>(children: ReactNode, ...types: ComponentType<P>[]): Array<ReactElement<P>> {
  return childrenMatching<P>(children, element => {
    if (typeof element.type === 'string') { return false }
    return types.includes(element.type)
  })[0]
}

export function childrenNotOfType(children: ReactNode, types: ComponentType<any>[]): Array<ReactElement<any>> {
  return childrenMatching(children, element => {
    if (typeof element.type === 'string') { return true }
    return !types.includes(element.type)
  })[0]
}

export function childrenMatching<P>(children: ReactNode, predicate: (element: ReactElement) => boolean): [ReactElement<P>[], ReactNode] {
  const matching: Array<ReactElement<P>> = []
  const remaining: Array<ReactNode> = []

  const iterate = (node: ReactNode) => {
    const array = Children.toArray(node)
    for (const node of array) {
      if (!isValidElement(node)) {
        remaining.push(node)
        continue
      }

      if (isReactFragment(node) || isReactProvider(node)) {
        iterate(node.props.children)
      } else if (predicate(node)) {
        matching.push(node as ReactElement<P>)
      } else {
        remaining.push(node)
      }
    }
  }

  iterate(children)
  return [matching, remaining]
}

export function isReactText(children: ReactNode): children is string | number {
  return typeof children === 'string' || typeof children === 'number'
}

export function isReactFragment(children: ReactNode): children is ReactElement<{children?: ReactNode}> {
  return isValidElement(children) && children.type === Fragment
}

export function isReactProvider<T>(children: ReactNode): children is ReactElement<any, Provider<T>> {
  if (!isValidElement(children)) { return false }
  if (!isFunction(children.type)) { return false }

  return false
}

export function isReactComponent<P>(arg: any): arg is ComponentType<P> {
  if (isPlainObject(arg) && arg.$$typeof != null) {
    return true
  }
  if (isFunction(arg)) {
    return true
  }

  return false
}

export function renderComponentOrElement(componentOrElement: ComponentType<Record<string, never>> | ReactNode): ReactNode
export function renderComponentOrElement<P>(componentOrElement: ComponentType<P> | ReactNode, propsForComponent: P): ReactNode
export function renderComponentOrElement(componentOrElement: ComponentType<any> | ReactNode, propsForComponent: any = {}) {
  if (componentOrElement == null) { return componentOrElement }

  if (isValidElement(componentOrElement)) {
    return componentOrElement
  } else if (isReactComponent(componentOrElement)) {
    return createElement(componentOrElement as ComponentType<any>, propsForComponent)
  }

  throw new Error(`${componentOrElement} is not a valid React component or element`)
}
