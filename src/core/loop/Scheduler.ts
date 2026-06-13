export type SystemFn = (dt: number, frame: number) => void

export class Scheduler {
  private systems: Array<{ name: string; fn: SystemFn }> = []

  register(name: string, fn: SystemFn): this {
    this.systems.push({ name, fn })
    return this
  }

  tick(dt: number, frame: number): void {
    for (const sys of this.systems) {
      sys.fn(dt, frame)
    }
  }
}

export const scheduler = new Scheduler()
