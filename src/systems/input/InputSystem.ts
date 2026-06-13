import type { InputSnapshot, Vec3 } from '@/types'

const ZERO_VEC: Vec3 = { x: 0, y: 0, z: 0 }

class InputSystemClass {
  private keys = new Set<string>()
  private pressed = new Set<string>() // keys pressed THIS frame
  private mouseButtons = new Set<number>()
  private mousePressed = new Set<number>()
  private yaw = 0 // camera yaw in radians
  private bound = false

  private snapshot: InputSnapshot = {
    move: { ...ZERO_VEC },
    attackLight: false,
    attackHeavy: false,
    dodge: false,
    block: false,
    lock: false,
  }

  bind(): void {
    if (this.bound) return
    this.bound = true

    const onKeyDown = (e: KeyboardEvent) => {
      if (!this.keys.has(e.code)) {
        this.pressed.add(e.code)
      }
      this.keys.add(e.code)
    }
    const onKeyUp = (e: KeyboardEvent) => {
      this.keys.delete(e.code)
    }
    const onMouseDown = (e: MouseEvent) => {
      if (!this.mouseButtons.has(e.button)) {
        this.mousePressed.add(e.button)
      }
      this.mouseButtons.add(e.button)
    }
    const onMouseUp = (e: MouseEvent) => {
      this.mouseButtons.delete(e.button)
    }
    const onMouseMove = (e: MouseEvent) => {
      if (document.pointerLockElement) {
        this.yaw -= e.movementX * 0.002
      }
    }

    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)
    window.addEventListener('mousedown', onMouseDown)
    window.addEventListener('mouseup', onMouseUp)
    window.addEventListener('mousemove', onMouseMove)
  }

  setYaw(yaw: number): void {
    this.yaw = yaw
  }

  getYaw(): number {
    return this.yaw
  }

  sample(): InputSnapshot {
    const fwd = { x: -Math.sin(this.yaw), y: 0, z: -Math.cos(this.yaw) }
    const right = { x: Math.cos(this.yaw), y: 0, z: -Math.sin(this.yaw) }

    let mx = 0
    let mz = 0
    if (this.keys.has('KeyW') || this.keys.has('ArrowUp')) { mx += fwd.x; mz += fwd.z }
    if (this.keys.has('KeyS') || this.keys.has('ArrowDown')) { mx -= fwd.x; mz -= fwd.z }
    if (this.keys.has('KeyA') || this.keys.has('ArrowLeft')) { mx -= right.x; mz -= right.z }
    if (this.keys.has('KeyD') || this.keys.has('ArrowRight')) { mx += right.x; mz += right.z }

    const len = Math.sqrt(mx * mx + mz * mz)
    if (len > 0) { mx /= len; mz /= len }

    this.snapshot = {
      move: { x: mx, y: 0, z: mz },
      attackLight: this.pressed.has('KeyZ') || this.mousePressed.has(0),
      attackHeavy: this.pressed.has('KeyX'),
      dodge: this.pressed.has('Space'),
      block: this.keys.has('KeyC'),
      lock: this.pressed.has('KeyQ'),
    }

    this.pressed.clear()
    this.mousePressed.clear()

    return this.snapshot
  }

  getSnapshot(): InputSnapshot {
    return this.snapshot
  }
}

export const InputSystem = new InputSystemClass()
