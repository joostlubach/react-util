import { arrayEquals } from 'ytil'
import { BaseKeyboardNavigation } from './BaseKeyboardNavigation'
import { Key, KeyboardNavigationData, KeyboardNavigationNode, KeyPath } from './types'

export class ListKeyboardNavigation<K extends Key = Key> extends BaseKeyboardNavigation<K> {

  constructor(
    data: KeyboardNavigationData<any, K>,
  ) {
    super(data)
    this.flattened = this.flattenData(data)
  }

  public handle(from: KeyPath<K>, key: string): KeyPath<K> | null {
    switch (key) {
    case 'ArrowUp':
      return this.move(from, -1)
    case 'ArrowDown':
      return this.move(from, +1)
    }

    return null
  }

  protected move(from: KeyPath<K>, delta: number): KeyPath<K> {
    if (this.flattened.length === 0) { return [] }
    if (delta === 0) { return from }

    let start = this.flattened.findIndex(it => arrayEquals(from, it[0]))
    if (start < 0 && delta < 0) {
      start = this.flattened.length
    }

    const direction = delta > 0 ? 1 : -1
    const startParent = from.slice(0, -1)

    let index = start
    let keyPath: KeyPath<K>

    for (let i = 0; i < Math.abs(delta); i++) {
      index += direction

      // Wrap around.
      while (index >= this.flattened.length) { index -= this.flattened.length }
      while (index < 0) { index += this.flattened.length }

      keyPath = this.flattened[index][0]

      // Handle boundaries between sections. The idea is that if we cross a parent boundary, we stop.
      const parent = keyPath.slice(0, -1)
      if (!arrayEquals(parent, startParent)) {
        // We started at a parent boundary. Stop here.
        break
      }
    }

    return this.flattened[index]?.[0]
  }

  //------
  // Utility

  protected flattened: Array<[KeyPath<K>, KeyboardNavigationNode<any, K>]>

  private flattenData(data: KeyboardNavigationData<any, K>): Array<[KeyPath<K>, KeyboardNavigationNode<any, K>]> {
    const flattened: Array<[KeyPath<K>, KeyboardNavigationNode<any, K>]> = []

    const iterate = (nodes: KeyboardNavigationNode<any, K>[], prefix: KeyPath<K>) => {
      for (const node of nodes) {
        const keyPath = [...prefix, node.key]
        if (node.children != null) {
          iterate(node.children, keyPath)
        } else {
          flattened.push([keyPath, node])
        }
      }
    }
    iterate(data, [])

    return flattened
  }

  /**
   * Finds the first non-empty parent node in the data.
   *
   * @param direction The direction in which to look. 1 starts at the beginning and searches forward, -1 the other way.
   * @returns The KeyPath of the first non-empty parent node.
   */
  protected findNonEmptyParentNode(direction: 1 | -1) {
    const [keyPath] = this.findLeafNode(direction)

    // If the found key path points to nothing or to a node in the root list, there is no non-empty parent node.
    if (keyPath.length < 2) { return [] }

    // Return the parent key path of this node.
    return keyPath.slice(0, -1)
  }

  protected findLeafNode(direction: 1 | -1): [KeyPath<K>, KeyboardNavigationNode<any, K> | null] {
    const start = direction === 1 ? 0 : this.flattened.length - 1
    const end = direction === 1 ? this.flattened.length - 1 : 0

    for (let index = start; index !== end; index += direction) {
      const [keyPath, node] = this.flattened[index]
      if (this.isLeafNode(node)) { return [keyPath, node] }
    }

    return [[], null]
  }

}