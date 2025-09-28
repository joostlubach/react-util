import { ListKeyboardNavigation } from './ListKeyboardNavigation'
import { Key, KeyboardNavigationData, KeyPath } from './types'

export class GridKeyboardNavigation<K extends Key = Key> extends ListKeyboardNavigation<K> {

  constructor(
    data: KeyboardNavigationData<any, K>,
    private readonly columns: number,
  ) {
    super(data)
  }

  public handle(from: KeyPath<K>, key: string): KeyPath<K> | null {
    switch (key) {
    case 'ArrowLeft':
      return this.move(from, -1)
    case 'ArrowRight':
      return this.move(from, +1)
    case 'ArrowUp':
      return this.move(from, -this.columns)
    case 'ArrowDown':
      return this.move(from, +this.columns)
    }

    return null
  }

}