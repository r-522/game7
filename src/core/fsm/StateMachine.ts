export interface FsmState<TCtx> {
  enter?(ctx: TCtx): void
  update(ctx: TCtx, dt: number): string | null
  exit?(ctx: TCtx): void
}

export class StateMachine<TCtx> {
  private states = new Map<string, FsmState<TCtx>>()
  private _currentId = ''
  private ctx: TCtx

  constructor(ctx: TCtx) {
    this.ctx = ctx
  }

  register(id: string, state: FsmState<TCtx>): this {
    this.states.set(id, state)
    return this
  }

  start(id: string): void {
    this._currentId = id
    this.states.get(id)?.enter?.(this.ctx)
  }

  update(dt: number): void {
    const state = this.states.get(this._currentId)
    if (!state) return
    const next = state.update(this.ctx, dt)
    if (next && next !== this._currentId) this.transition(next)
  }

  transition(nextId: string): void {
    this.states.get(this._currentId)?.exit?.(this.ctx)
    this._currentId = nextId
    this.states.get(nextId)?.enter?.(this.ctx)
  }

  get currentId(): string {
    return this._currentId
  }

  patchCtx(patch: Partial<TCtx>): void {
    Object.assign(this.ctx as object, patch)
  }

  getCtx(): TCtx {
    return this.ctx
  }
}
