import React from 'react'

export function component<T extends React.ComponentType<any>>(name: string, Component: T): T {
  Object.assign(Component, {displayName: name})
  return Component
}

export function memo<T extends React.ComponentType<any>>(
  name:           string,
  Component:      T,
  propsAreEqual?: (prevProps: Readonly<React.ComponentProps<T>>, nextProps: Readonly<React.ComponentProps<T>>) => boolean,
): T {
  Object.assign(Component, {displayName: name})
  return React.memo(Component, propsAreEqual) as any
}

export function forwardRef<T, P>(
  name: string,
  render: React.ForwardRefRenderFunction<T, React.PropsWithoutRef<P>>
): (props: P & React.RefAttributes<T>) => React.ReactElement | null {
  const Component = React.forwardRef<T, P>(render)
  Object.assign(Component, {displayName: name})
  return Component as any
}