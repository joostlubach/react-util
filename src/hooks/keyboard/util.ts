/**
 * Checks whether a keyboard event matches a keystroke description, e.g. `'short-k'` or `'shift-delete'`.
 * Uses the same vocabulary as `Keystroke` (`~/ui/components/Keystroke`), so a keystroke that is valid there
 * is valid here too. Returns false if the keystroke can't be parsed.
 */
export function eventMatchesKeystroke(event: KeyboardEvent, keystroke: string): boolean {
  const parsed = parseKeystroke(keystroke)
  if (parsed == null) { return false }

  const {modifiers, key} = parsed

  if (modifiers.has('alt') !== event.altKey) { return false }
  if (modifiers.has('shift') !== event.shiftKey) { return false }
  if (modifiers.has('meta') !== event.metaKey) { return false }
  if (modifiers.has('ctrl') !== event.ctrlKey) { return false }

  return event.key.toLowerCase() === key
}

type Modifier = 'alt' | 'meta' | 'ctrl' | 'shift'

function parseKeystroke(keystroke: string): {modifiers: Set<Modifier>, key: string} | null {
  // Not trimmed: keeps a lone space (' ') intact as a valid keystroke.
  const parts = keystroke.split(/[-+]/).map(it => it.toLowerCase()).filter(it => it.length > 0)

  const modifiers = new Set<Modifier>()
  let key: string | null = null

  for (const part of parts) {
    const modifier = modifierAliases[part]
    if (modifier != null) {
      modifiers.add(modifier)
    } else if (key == null) {
      key = keyAliases[part] ?? part
    } else {
      // A second, unrecognized part - the keystroke is ambiguous.
      return null
    }
  }

  if (key == null) { return null }
  return {modifiers, key}
}

const isMac = 'navigator' in window && navigator.userAgent.toUpperCase().includes('MAC')

const modifierAliases: Record<string, Modifier> = {
  alt:     'alt',
  opt:     'alt',
  option:  'alt',
  meta:    'meta',
  control: 'ctrl',
  shift:   'shift',
  // The platform's usual command modifier: ⌘ on Mac, Ctrl elsewhere.
  short:   isMac ? 'meta' : 'ctrl',
}

const keyAliases: Record<string, string> = {
  delete:    'backspace',
  backspace: 'backspace',
  return:    'enter',
  enter:     'enter',
  space:     ' ',
}
