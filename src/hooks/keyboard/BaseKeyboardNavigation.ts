import { arrayEquals } from 'ytil'
import { Key, KeyboardNavigationData, KeyboardNavigationNode, KeyPath } from './types'

export abstract class BaseKeyboardNavigation<K extends Key = Key> {

  constructor(
    protected readonly data: KeyboardNavigationData<any, K>,
  ) {}

  public abstract handle(from: KeyPath<K>, key: string): KeyPath<K> | null

  /**
   * Finds the first or last node among the nodes that `from` is navigating between.
   */
  public edge(from: KeyPath<K>, edge: 'first' | 'last'): KeyPath<K> | null {
    const candidates = this.candidates(from)
    const candidate = edge === 'first' ? candidates[0] : candidates[candidates.length - 1]
    return candidate?.[0] ?? null
  }

  /**
   * Finds the next node whose label starts with the search string, in the same way as native
   * selects and menus do: a single character moves on to the next match, while more characters
   * refine the match, starting at the current node.
   */
  public typeahead(from: KeyPath<K>, searchString: string): KeyPath<K> | null {
    const candidates = this.candidates(from)
    const count = candidates.length
    if (count === 0) { return null }

    const search = searchString.toLowerCase()
    const current = candidates.findIndex(([keyPath]) => arrayEquals(keyPath, from))
    const refining = search.length > 1
    const start = refining && current >= 0 ? current : current + 1

    for (let offset = 0; offset < count; offset++) {
      const index = (start + offset) % count
      if (!refining && index === current) { break }

      const [keyPath, node] = candidates[index]
      const label = node.label?.trim().toLowerCase()
      if (label != null && label.startsWith(search)) { return keyPath }
    }

    return null
  }

  /**
   * The nodes that first / last and typeahead work on. By default the siblings of `from`.
   */
  protected candidates(from: KeyPath<K>): Array<[KeyPath<K>, KeyboardNavigationNode<any, K>]> {
    const parentPath = from.slice(0, -1)
    const siblings = parentPath.length === 0
      ? this.data
      : this.nodeAtKeyPath(parentPath)?.children ?? []

    return siblings.map(node => [[...parentPath, node.key], node])
  }

  public nodeAtKeyPath(path: KeyPath<K>) {
    let nodes = this.data

    const head = [...path]
    const leaf = head.pop()
    for (const key of head) {
      const node = nodes.find(it => it.key === key)
      if (node?.children == null) { return null }
      nodes = node.children
    }

    return nodes.find(it => it.key === leaf)
  }

  protected isLeafNode(node: KeyboardNavigationNode<any, K>) {
    return node.children == null
  }

}