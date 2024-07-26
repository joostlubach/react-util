import { observer as mobx_observer } from 'mobx-react'
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

export function observer<T extends React.ComponentType<any>>(
  name:      string,
  Component: T,
) {
  Object.assign(Component, {displayName: name})
  return mobx_observer(Component)
}

export function forwardRef<T, P>(
  name: string,
  render: (props: P, ref: React.Ref<T>) => React.ReactElement | null,
): (props: P & React.RefAttributes<T>) => React.ReactElement | null {
  const Component = React.forwardRef(render)
  Object.assign(Component, {displayName: name})
  return Component as any
}
