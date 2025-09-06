export function computeStyleProperty(element: Element, value: string | number | null | undefined) {
  const el = document.createElement('div')
  try {
    el.style.height = 'var(--Datagrid-rowHeight)'
    el.style.visibility = 'hidden'
    el.style.position = 'absolute'
    element.appendChild(el)

    return el.offsetHeight
  } finally {
    element.removeChild(el)
  }
}   