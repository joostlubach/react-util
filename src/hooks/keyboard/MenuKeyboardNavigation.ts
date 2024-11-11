import { clamp } from 'lodash'
import { BaseKeyboardNavigation } from './BaseKeyboardNavigation'
import { Key, KeyPath } from './types'

export class MenuKeyboardNavigation<K extends Key = Key> extends BaseKeyboardNavigation<K> {

  public handle(from: KeyPath<K>, key: string): KeyPath<K> | null {
    switch (key) {
    case 'ArrowUp':
      return this.move(from, -1)
    case 'ArrowDown':
      return this.move(from, +1)
    case 'ArrowRight':
      return this.drillDown(from)
    case 'ArrowLeft':
      return this.drillUp(from)
    }

    return null
  }

  protected move(from: KeyPath<K>, delta: number): KeyPath<K> {
    const parentPath = from.slice(0, -1)
    const parent = this.nodeAtKeyPath(parentPath)
    const siblings = parent?.children ?? this.data
    const prevIndex = siblings.findIndex(it => it.key === from[from.length - 1])
    const nextIndex = clamp(prevIndex + delta, 0, siblings.length - 1)
    const nextKey = siblings[nextIndex].key

    return [...parentPath, nextKey]
  }

  protected drillUp(from: KeyPath<K>): KeyPath<K> {
    if (from.length < 2) { return from }
    return from.slice(0, -1)
  }

  protected drillDown(from: KeyPath<K>): KeyPath<K> {
    const node = this.nodeAtKeyPath(from)
    const children = node?.children ?? []
    if (children.length === 0) { return from }
    return [...from, children[0].key]
  }

}