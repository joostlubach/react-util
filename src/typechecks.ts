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
import { isFunction, isPlainObject } from 'ytil'

export function childrenOfType<P>(children: ReactNode, ...types: ComponentType<P>[]): Array<ReactElement<P>> {
  return extractChildren<P>(children, element => {
    if (typeof element.type === 'string') { return false }
    return types.includes(element.type)
  })[0]
}

export function childrenNotOfType(children: ReactNode, types: ComponentType<any>[]): Array<ReactElement<any>> {
  return extractChildren(children, element => {
    if (typeof element.type === 'string') { return true }
    return !types.includes(element.type)
  })[0]
}

export function hasChildrenOfType(children: ReactNode, ...types: ComponentType[]): boolean {
  let found: boolean = false
  walkChildren(children, node => {
    if (!isValidElement(node)) { return }
    if (typeof node.type === 'string') { return }
    if (types.includes(node.type)) {
      found = true
      return false // To break the loop
    }
  })

  return found
}

export function extractChildren<P>(children: ReactNode, predicate: (element: ReactElement) => boolean, options: WalkChildrenOptions = {}): [ReactElement<P>[], ReactNode] {
  const matching: Array<ReactElement<P>> = []
  const remaining: Array<ReactNode> = []

  walkChildren(children, node => {
    if (!isValidElement(node)) {
      remaining.push(node)
    } else if (predicate(node)) {
      matching.push(node as ReactElement<P>)
    } else {
      remaining.push(node)
    }
  }, options)

  return [matching, remaining]
}

export function walkChildren(children: ReactNode, fn: (element: ReactNode) => void | false, options: WalkChildrenOptions = {}) {
  const {
    recurseFragments = true,
    recurseProviders = true,
    recurseOther = false,
  } = options

  const iterate = (node: ReactNode) => {
    const array = Children.toArray(node)
    for (const node of array) {
      if (fn(node) === false) { break }

      if (isReactFragment(node)) {
        if (recurseFragments) {
          iterate(node.props.children)
        }
      } else if (isReactProvider(node)) {
        if (recurseProviders) {
          iterate(node.props.children)
        }
      } else if (isValidElement(node) && isPlainObject(node.props) && 'children' in node.props) {
        if (recurseOther) {
          iterate(node.props.children)
        }
      }
    }
  }

  iterate(children)
}

export interface WalkChildrenOptions {
  recurseFragments?: boolean
  recurseProviders?: boolean
  recurseOther?: boolean
}

export function isReactText(children: ReactNode): children is string | number {
  return typeof children === 'string' || typeof children === 'number'
}

export function isReactFragment(children: ReactNode): children is ReactElement<{children?: ReactNode}> {
  return isValidElement(children) && children.type === Fragment
}

export function isReactElementOfType<P>(children: ReactNode, type: ComponentType<P>): children is ReactElement<P> {
  return isValidElement(children) && children.type === type
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
