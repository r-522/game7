export const FIXED_DT = 1 / 60

export class GameClock {
  private accumulator = 0
  private _frame = 0
  private onTick: (dt: number, frame: number) => void
  private paused = false

  constructor(onTick: (dt: number, frame: number) => void) {
    this.onTick = onTick
  }

  tick(renderDelta: number): void {
    if (this.paused) return
    const clamped = Math.min(renderDelta, 0.1)
    this.accumulator += clamped
    while (this.accumulator >= FIXED_DT) {
      this.onTick(FIXED_DT, this._frame++)
      this.accumulator -= FIXED_DT
    }
  }

  pause(): void {
    this.paused = true
  }

  resume(): void {
    this.paused = false
  }

  get frame(): number {
    return this._frame
  }

  get alpha(): number {
    return this.accumulator / FIXED_DT
  }
}
