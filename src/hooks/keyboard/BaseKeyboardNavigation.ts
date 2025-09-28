import { Key, KeyboardNavigationData, KeyboardNavigationNode, KeyPath } from './types'

export abstract class BaseKeyboardNavigation<K extends Key = Key> {

  constructor(
    protected readonly data: KeyboardNavigationData<any, K>,
  ) {}

  public abstract handle(from: KeyPath<K>, key: string): KeyPath<K> | null

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