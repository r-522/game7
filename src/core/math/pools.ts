import * as THREE from 'three'
import type { Vec3 } from '@/types'

export const vec3A = new THREE.Vector3()
export const vec3B = new THREE.Vector3()
export const vec3C = new THREE.Vector3()
export const quatA = new THREE.Quaternion()
export const mat4A = new THREE.Matrix4()

export function toThree(v: Vec3, out: THREE.Vector3 = vec3A): THREE.Vector3 {
  return out.set(v.x, v.y, v.z)
}

export function fromThree(v: THREE.Vector3): Vec3 {
  return { x: v.x, y: v.y, z: v.z }
}

export function vec3Dist(a: Vec3, b: Vec3): number {
  const dx = a.x - b.x
  const dy = a.y - b.y
  const dz = a.z - b.z
  return Math.sqrt(dx * dx + dy * dy + dz * dz)
}

export function vec3Add(a: Vec3, b: Vec3): Vec3 {
  return { x: a.x + b.x, y: a.y + b.y, z: a.z + b.z }
}

export function vec3Scale(a: Vec3, s: number): Vec3 {
  return { x: a.x * s, y: a.y * s, z: a.z * s }
}

export function vec3Lerp(a: Vec3, b: Vec3, t: number): Vec3 {
  return {
    x: a.x + (b.x - a.x) * t,
    y: a.y + (b.y - a.y) * t,
    z: a.z + (b.z - a.z) * t,
  }
}
