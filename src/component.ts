import {
  ComponentProps,
  ComponentType,
  forwardRef as react_forwardRef,
  ForwardRefRenderFunction,
  memo as react_memo,
  PropsWithoutRef,
  ReactElement,
  RefAttributes,
} from 'react'

export function component<T extends ComponentType<any>>(name: string, Component: T): T {
  Object.assign(Component, {displayName: name})
  return Component
}

export function memo<T extends ComponentType<any>>(
  name:           string,
  Component:      T,
  propsAreEqual?: (prevProps: Readonly<ComponentProps<T>>, nextProps: Readonly<ComponentProps<T>>) => boolean,
): T {
  Object.assign(Component, {displayName: name})
  return react_memo(Component, propsAreEqual) as any
}

export function forwardRef<T, P>(
  name: string,
  render: ForwardRefRenderFunction<T, PropsWithoutRef<P>>,
): (props: P & RefAttributes<T>) => ReactElement | null {
  const Component = react_forwardRef<T, P>(render)
  Object.assign(Component, {displayName: name})
  return Component as any
}