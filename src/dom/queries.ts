export function isScrolledElement(element: Element): element is HTMLElement {
  if (!(element instanceof HTMLElement)) { return false }

  const overflow = window.getComputedStyle(element).overflow
  if (overflow === 'hidden' || overflow === 'visible') { return false }
  if (overflow === 'scroll') { return true }

  return element.scrollHeight > element.clientHeight
}

const interactiveTags = ['input', 'select', 'textarea', 'button']

export function isInteractiveElement(target: EventTarget | null): target is HTMLElement {
  if (!(target instanceof HTMLElement)) { return false }

  const tagName = target.tagName.toLowerCase()
  if (tagName === 'a' && target.hasAttribute('href')) { return true }
  if (tagName === 'label' && target.hasAttribute('for')) { return true }
  if (tagName === 'label' && target.querySelector(interactiveTags.join(', ')) != null) { return true }
  if (target.getAttribute('role') === 'button') { return true }
  if (target.hasAttribute('tabindex')) { return true }

  return interactiveTags.includes(tagName)
}
