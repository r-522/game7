import type { Vec3 } from '@/types'

export interface CameraState {
  position: Vec3
  target: Vec3
  yaw: number
  pitch: number
}

const CAM_DIST = 6
const CAM_HEIGHT = 2.5
const CAM_MIN_PITCH = -0.3
const CAM_MAX_PITCH = 0.8
const LERP_SPEED = 8

export class ThirdPersonCameraClass {
  private yaw = 0
  private pitch = 0.3
  private smoothPos: Vec3 = { x: 0, y: CAM_HEIGHT, z: CAM_DIST }

  rotateYaw(delta: number): void {
    this.yaw -= delta
  }

  rotatePitch(delta: number): void {
    this.pitch = Math.max(CAM_MIN_PITCH, Math.min(CAM_MAX_PITCH, this.pitch + delta))
  }

  update(targetPos: Vec3, dt: number): CameraState {
    const desiredPos: Vec3 = {
      x: targetPos.x + -Math.sin(this.yaw) * Math.cos(this.pitch) * CAM_DIST,
      y: targetPos.y + CAM_HEIGHT + Math.sin(this.pitch) * CAM_DIST,
      z: targetPos.z + -Math.cos(this.yaw) * Math.cos(this.pitch) * CAM_DIST,
    }

    const t = Math.min(1, LERP_SPEED * dt)
    this.smoothPos = {
      x: this.smoothPos.x + (desiredPos.x - this.smoothPos.x) * t,
      y: this.smoothPos.y + (desiredPos.y - this.smoothPos.y) * t,
      z: this.smoothPos.z + (desiredPos.z - this.smoothPos.z) * t,
    }

    return {
      position: { ...this.smoothPos },
      target: { x: targetPos.x, y: targetPos.y + 1.2, z: targetPos.z },
      yaw: this.yaw,
      pitch: this.pitch,
    }
  }

  getYaw(): number {
    return this.yaw
  }

  setYaw(yaw: number): void {
    this.yaw = yaw
  }
}

export const ThirdPersonCamera = new ThirdPersonCameraClass()
