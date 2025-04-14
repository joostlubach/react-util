export const ancestor = createFindRelated(it => it.parentElement)
export const sibling = createFindRelated(it => it.nextElementSibling)

function createFindRelated(next: (current: Element) => Element | null): FindRelatedFunction {
  return ((start: Element, predicate: FindRelatedPredicate, options: FindRelatedOptions = {}) => {
    const {
      includeStart = false,
      html = false,
      svg = false,
      until,
    } = options
    
    const matches = (node: Node): node is Element => {
      if (html) {
        if (!(node instanceof HTMLElement)) { return false }
      } else if (svg) {
        if (!(node instanceof SVGElement)) { return false }
      } else {
        if (!(node instanceof Element)) { return false }
      }

      if (typeof predicate === 'string') {
        return node.matches(predicate)
      } else {
        return predicate(node)
      }
    }
  
    for (
      let current: Node | null = includeStart ? start : next(start);
      current !== null;
      current = current instanceof Element ? next(current) : null
    ) {
      if (current === until) {
        return null
      }
      if (matches(current)) {
        return current
      }
    }
  
    return null
  }) as FindRelatedFunction
}

export interface FindRelatedFunction {
  (element: Element, predicate: FindRelatedPredicate, options: FindRelatedOptions & {html: true}): HTMLElement | null
  (element: Element, predicate: FindRelatedPredicate, options: FindRelatedOptions & {svg: true}): SVGElement | null
  (element: Element, predicate: FindRelatedPredicate, options?: FindRelatedOptions): Element | null
}

export type FindRelatedPredicate = string | ((element: Element) => boolean)

export interface FindRelatedOptions {
  includeStart?: boolean
  until?:        Element
  html?:         boolean
  svg?:          boolean
}