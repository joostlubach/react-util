export type KeyboardNavigationData<It, K extends Key = Key> = KeyboardNavigationNode<It, K>[]

export interface KeyboardNavigationNode<It, K extends Key = Key> {
  key:       K
  children?: KeyboardNavigationData<It, K>
  item?:     It

  /** Text used for typeahead. Nodes without a label are skipped by typeahead. */
  label?:    string
}

export type KeyPath<K extends Key = Key> = K[]
export type Key = string | number | boolean | null