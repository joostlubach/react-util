import { useEffect, useState } from 'react'

export function useElementCollection<E extends Element>(refOrElement: Element | React.RefObject<Element> | null | undefined, selector: string, options: UseElementCollectionOptions = {}): ElementCollection<E> {
  const {
    childList = true,
    subtree = true,
    attributes = false,
    attributeFilter,
    attributeOldValue,
    characterData,
    characterDataOldValue,
    root: getRoot,
  } = options

  const [collection, setCollection] = useState<ElementCollection<E>>(new ElementCollection(selector, []))

  useEffect(() => {
    const element = refOrElement instanceof Element ? refOrElement : refOrElement?.current

    const root = getRoot != null && element != null ? getRoot(element) : element
    if (root == null) { return }

    const update = () => {
      const elements = root.querySelectorAll<E>(selector)
      setCollection(new ElementCollection(selector, Array.from(elements)))
    }

    const observer = new MutationObserver(update)
    observer.observe(root, {childList, subtree, attributes, attributeFilter, attributeOldValue, characterData, characterDataOldValue})
    
    update()
    return () => { observer.disconnect() }
  }, [attributeFilter, attributeOldValue, attributes, characterData, characterDataOldValue, childList, getRoot, refOrElement, selector, subtree])

  return collection
}

export function useDescendantElement<E extends Element>(refOrElement: Element | React.RefObject<Element> | null | undefined, selector: string, options: UseElementCollectionOptions = {}): E | null {
  const [descendant, setDescendant] = useState<E | null>(null)

  useEffect(() => {
    const element = refOrElement instanceof Element ? refOrElement : refOrElement?.current
    if (element == null) { return }

    const update = () => {
      const found = element.querySelector<E>(selector)
      if (found == null) {
        if (descendant != null) { setDescendant(null) }
      } else {
        if (found !== descendant) { setDescendant(found) }
      }
    }

    const observer = new MutationObserver(update)
    observer.observe(element, {childList: true, subtree: true, attributes: false})
    
    update()
    return () => { observer.disconnect() }
  }, [descendant, refOrElement, selector])

  return descendant
}

export interface UseElementCollectionOptions extends MutationObserverInit {
  root?: (element: Element) => Element | null
}

export class ElementCollection<E extends Element> {

  constructor(
    public readonly selector: string,
    public readonly elements: E[]
  ) {}

  public filter(predicate: (element: E) => boolean): ElementCollection<E> {
    return new ElementCollection(this.selector, this.elements.filter(predicate))
  }

  public map<U>(fn: (element: E) => U): U[] {
    return this.elements.map(fn)
  }

  public reduce<U>(fn: (acc: U, element: E) => U, initialValue: U): U {
    return this.elements.reduce(fn, initialValue)
  }

}