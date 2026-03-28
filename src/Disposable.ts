import { IReactionDisposer, IReactionOptions, IReactionPublic, reaction } from 'mobx'

export class Disposable {

  constructor() {
    Object.defineProperty(this, 'disposers', {enumerable: false})
  }

  private disposers: DisposableCleaner[] = []

  protected disposer(...disposers: DisposableCleaner[]) {
    this.disposers.push(...disposers)
  }

  protected reaction<T, FireImmediately extends boolean = false>(expression: (r: IReactionPublic) => T, effect: (arg: T, prev: FireImmediately extends true ? T | undefined : T, r: IReactionPublic) => void, opts?: IReactionOptions<T, FireImmediately>): IReactionDisposer {
    const disposer = reaction(expression, effect, opts)
    this.disposer(disposer)
    return disposer
  }

  public dispose() {
    this.disposers.forEach(disposer => disposer())
    this.disposers = []
  }


}

export type DisposableCleaner = () => void