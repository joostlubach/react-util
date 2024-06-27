import { v4 as uuidV4 } from 'uuid'

export function cloneElement(element: HTMLElement): HTMLElement {
  const clone = element.cloneNode(true) as HTMLElement
  const prefix = uuidV4().slice(0, 8)

  // Prefix all IDs and url(#) references within (this fixes SVG masks getting messed up).
  for (const element of clone.querySelectorAll('[id]')) {
    const id = element.getAttribute('id')
    if (id == null) { continue }

    element.setAttribute('id', `${prefix}-${id}`)
  }

  for (const attribute of ['style', 'mask', 'fill']) {
    const selector = `[${attribute}*="url(\\"#"]`
    for (const element of clone.querySelectorAll(selector)) {
      const value = element.getAttribute(attribute)
      if (value == null) { continue }

      element.setAttribute(attribute, value.replace(/url\("#(.*?)"\)/g, (_, id) => `url("#${prefix}-${id}")`))
    }
  }

  return clone
}
