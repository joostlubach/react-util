export function parseTransformMatrix(matrix: string) {
  const match = matrix.match(/matrix\(([^,]+), ([^,]+), ([^,]+), ([^,]+), ([^,]+), ([^,]+)\)/)
  if (match == null) { return ParsedTransformMatrix.zero() }

  const [a, b, c, d, e, f] = match.slice(1).map(parseFloat)
  const scaleX = Math.sqrt(a * a + b * b)
  const scaleY = Math.sqrt(c * c + d * d)
  const skewX = Math.atan2(b, a)
  const skewY = Math.atan2(d, c)
  const translateX = e
  const translateY = f

  return {translateX, translateY, scaleX, scaleY, skewX, skewY}
}

export interface ParsedTransformMatrix {
  translateX: number
  translateY: number
  scaleX:     number
  scaleY:     number
  skewX:      number
  skewY:      number
}

export const ParsedTransformMatrix = {
  zero: (): ParsedTransformMatrix => ({
    translateX: 0,
    translateY: 0,
    scaleX:     1,
    scaleY:     1,
    skewX:      0,
    skewY:      0,
  }),
}