export type KeyboardNavigationData<It, K extends Key = Key> = KeyboardNavigationNode<It, K>[]

export interface KeyboardNavigationNode<It, K extends Key = Key> {
  key:       K
  children?: KeyboardNavigationData<It, K>
  item?:     It
}

export type KeyPath<K extends Key = Key> = K[]
export type Key = string | number | boolean | null