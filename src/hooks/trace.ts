import Logger from 'logger'
import React from 'react'

export function useMountTrace(tag: string) {
  const logger = React.useMemo(
    () => new Logger(tag),
    [tag],
  )

  React.useEffect(() => {
    logger.debug("mount")
    return () => { logger.debug("unmount") }
  }, [logger])
}

export function useDepsTrace(tag: string, deps: any[]) {
  const logger = React.useMemo(
    () => new Logger(tag),
    [tag],
  )

  const prevDeps = React.useRef<any[]>([...deps])

  React.useEffect(() => {
    const prev = prevDeps.current
    if (prev.length !== deps.length) {
      logger.debug(`deps length changed from ${prev.length} to ${deps.length}`)
    } else {
      for (const [i] of deps.entries()) {
        if (deps[i] !== prevDeps.current[i]) {
          logger.debug(`deps[${i}] changed from ${JSON.stringify(prevDeps.current[i])} to ${JSON.stringify(deps[i])}`)
        }
      }
    }

    prevDeps.current = [...deps]
  }, [deps, logger])
}
