import type { InputSnapshot, Vec3 } from '@/types'
import { useKeyBindStore } from '@/state/useKeyBindStore'

const ZERO_VEC: Vec3 = { x: 0, y: 0, z: 0 }

// Pitch clamp bounds (radians)
const PITCH_MIN = -0.4
const PITCH_MAX = 0.7

class InputSystemClass {
  private keys = new Set<string>()
  private pressed = new Set<string>()       // keys pressed THIS frame (single-frame)
  private released = new Set<string>()      // keys released THIS frame (not consumed)

  private mouseButtons = new Set<number>()
  private mousePressed = new Set<number>()  // mouse buttons pressed THIS frame (single-frame)

  private yaw = 0    // horizontal camera angle (radians)
  private pitch = 0  // vertical camera angle (radians, clamped)
  private bound = false

  private snapshot: InputSnapshot = {
    move: { ...ZERO_VEC },
    attackLight: false,
    attackHeavy: false,
    special: false,
    dodge: false,
    block: false,
    lock: false,
    throwAttack: false,
    interact: false,
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
      this.released.add(e.code)
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
        this.pitch -= e.movementY * 0.0015
        if (this.pitch < PITCH_MIN) this.pitch = PITCH_MIN
        if (this.pitch > PITCH_MAX) this.pitch = PITCH_MAX
      }
    }

    const onContextMenu = (e: MouseEvent) => {
      e.preventDefault()
    }

    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)
    window.addEventListener('mousedown', onMouseDown)
    window.addEventListener('mouseup', onMouseUp)
    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('contextmenu', onContextMenu)
  }

  setYaw(yaw: number): void {
    this.yaw = yaw
  }

  getYaw(): number {
    return this.yaw
  }

  getPitch(): number {
    return this.pitch
  }

  /**
   * Called once per simulation tick. Builds the snapshot from current input
   * state, then clears the single-frame pressed/released sets.
   */
  sample(): InputSnapshot {
    const binds = useKeyBindStore.getState().binds

    const fwd   = { x: -Math.sin(this.yaw), y: 0, z: -Math.cos(this.yaw) }
    const right = { x:  Math.cos(this.yaw), y: 0, z: -Math.sin(this.yaw) }

    let mx = 0
    let mz = 0
    if (this.keys.has(binds.moveUp))    { mx += fwd.x;   mz += fwd.z }
    if (this.keys.has(binds.moveDown))  { mx -= fwd.x;   mz -= fwd.z }
    if (this.keys.has(binds.moveLeft))  { mx -= right.x; mz -= right.z }
    if (this.keys.has(binds.moveRight)) { mx += right.x; mz += right.z }

    const len = Math.sqrt(mx * mx + mz * mz)
    if (len > 0) { mx /= len; mz /= len }

    const shiftHeld =
      this.keys.has('ShiftLeft') || this.keys.has('ShiftRight')

    // attackLight and attackHeavy are always Mouse0 / Mouse2
    const attackLight = this.mousePressed.has(0)
    const attackHeavy = this.mousePressed.has(2)

    // Keyboard bindings read from store; mouse buttons are fixed
    const special     = this.pressed.has(binds.special) && !shiftHeld
    const dodge       = this.pressed.has(binds.dodge)
    const block       = this.keys.has(binds.block)
    const lock        = this.pressed.has(binds.lockOn)
    const throwAttack = this.pressed.has(binds.special) && shiftHeld
    const interact    = this.pressed.has(binds.interact)

    this.snapshot = {
      move: { x: mx, y: 0, z: mz },
      attackLight,
      attackHeavy,
      special,
      dodge,
      block,
      lock,
      throwAttack,
      interact,
    }

    this.pressed.clear()
    this.released.clear()
    this.mousePressed.clear()

    return this.snapshot
  }

  /**
   * Returns the most recently sampled snapshot without consuming pressed state.
   */
  getSnapshot(): InputSnapshot {
    return this.snapshot
  }
}

export const InputSystem = new InputSystemClass()
