import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { CuboidCollider, RapierRigidBody, RigidBody } from '@react-three/rapier'
import { useMachineStore } from '../store'

export function CollisionSystem() {
    const { coords, triggerAlarm, isAlarm } = useMachineStore()
    const toolBody = useRef<RapierRigidBody>(null)

    useFrame(() => {
        // Sync Kinematic Body to Tool Position
        if (toolBody.current) {
            // Map Store Coords (mm) to World (m)
            // Store: X, Y, Z (CNC) -> World: X, Z, Y (ThreeJS)
            toolBody.current.setTranslation({
                x: coords.x * 0.001,
                y: coords.z * 0.001, // Z is Up
                z: coords.y * 0.001
            }, true);
        }
    })

    return (
        <group visible={false}> {/* Invisible Colliders */}

            {/* TOOL PROXY - Kinematic (Moved by Code) */}
            <RigidBody
                ref={toolBody}
                type="kinematicPosition"
                colliders={false}
                onCollisionEnter={({ other }) => {
                    // Check what we hit
                    // If hit Table -> Alarm
                    // Stock is okay (cutting)
                    if (other.rigidBodyObject?.name === 'TABLE') {
                        if (!isAlarm) {
                            console.warn("COLLISION DETECTED: TOOL HIT TABLE");
                            triggerAlarm(true);
                        }
                    }
                }}
            >
                <CuboidCollider args={[0.02, 0.05, 0.02]} /> {/* Tool Shape */}
            </RigidBody>

            {/* TABLE PROXY - Static */}
            <RigidBody type="fixed" name="TABLE">
                {/* Table Surface is at Y=0. It is 0.2 thick. Top at -0.1 + 0.1? Wait.
             Machine.tsx: Base pos=[0, -0.1, 0], Size=[1, 0.2, 1].
             So Top is at 0.
         */}
                <CuboidCollider position={[0, -0.1, 0]} args={[0.5, 0.1, 0.5]} />
            </RigidBody>

        </group>
    )
}
