import { isArray } from 'lodash'
import { Ref, useCallback, useState } from 'react'
import { objectEntries, objectEquals } from 'ytil'

export function useComputedStyle<E extends ComputedStyleExtract>(extract: E): UseComputedStyleHook<E> {
  const [output, setOutput] = useState<Partial<ComputedStyleOutput<E>>>({})
  
  const ref = useCallback((element: any) => {
    if (!(element instanceof Element)) { return }
      
    const output: Record<string | symbol | number, any> = {}
    if (element != null) {
      const style = window.getComputedStyle(element)
      if (isArray(extract)) {
        for (const key of extract as Array<keyof CSSStyleDeclaration>) {
          output[key] = style[key]
        }
      } else {
        for (const [key, getter] of objectEntries(extract as {[key: string]: (style: CSSStyleDeclaration) => any})) {
          output[key] = getter(style)
        }
      }
    }

    setOutput(prev => {
      if (objectEquals(prev, output)) { return prev }
      return output as Partial<ComputedStyleOutput<E>>
    })
  }, [extract])

  return [output, ref]
}

export type ComputedStyleExtract =
  | Array<keyof CSSStyleDeclaration>
  | {[key: string]: (style: CSSStyleDeclaration) => any}

export type ComputedStyleOutput<E extends ComputedStyleExtract> = 
  E extends Array<infer K extends keyof CSSStyleDeclaration> ? {
    [key in K]: CSSStyleDeclaration[key]
  } : E extends {[key: string]: (style: CSSStyleDeclaration) => any} ? {
    [key in keyof E]: ReturnType<E[key]>
  } : never

export type UseComputedStyleHook<E extends ComputedStyleExtract> = [
  Partial<ComputedStyleOutput<E>>,
  Ref<any>
]