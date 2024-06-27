import React from 'react'

import { memo } from './component'

export function createSuperContainer<P>(...wrappers: SuperContainerWrapper<P>[]): React.ComponentType<SuperContainerProps<P>> {
  return memo('SuperContainer', (props: SuperContainerProps<P>) => {
    const {children, ...params} = props
    let current = children
    for (const wrapper of [...wrappers].reverse()) {
      current = wrapper({children: current}, params as any)
    }
    return React.createElement(React.Fragment, {}, current)
  })
}

export type SuperContainerInherentProps = {children: React.ReactNode}
export type SuperContainerProps<P> = P & SuperContainerInherentProps
export type SuperContainerWrapper<P> = (props: {children: React.ReactNode}, params: P) => React.ReactNode
