export function computeStyleProperty(element: Element, expression: string) {
  const el = document.createElement('div')
  try {
    el.style.height = expression
    el.style.visibility = 'hidden'
    el.style.position = 'absolute'
    element.appendChild(el)

    return el.offsetHeight
  } finally {
    element.removeChild(el)
  }
}   