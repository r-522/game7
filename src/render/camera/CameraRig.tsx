import { useFrame, useThree } from '@react-three/fiber'
import { useCombatStore } from '@/state/useCombatStore'
import { ThirdPersonCamera } from '@/systems/camera/ThirdPersonCamera'
import { InputSystem } from '@/systems/input/InputSystem'

export function CameraRig(): null {
  const { camera } = useThree()

  useFrame((_state, delta) => {
    const entities = useCombatStore.getState().entities
    const player = entities['player']
    if (!player) return

    ThirdPersonCamera.setYaw(InputSystem.getYaw())
    const cam = ThirdPersonCamera.update(player.position, delta)

    camera.position.set(cam.position.x, cam.position.y, cam.position.z)
    camera.lookAt(cam.target.x, cam.target.y, cam.target.z)
  })

  return null
}
