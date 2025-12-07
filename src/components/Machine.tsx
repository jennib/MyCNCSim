import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { useMachineStore } from '../store'
import { Group } from 'three'

import { MachinePart } from './MachinePart'

export function Machine() {
    const { coords, toolDiameter, toolType, machineAssets } = useMachineStore()

    // Refs for animation
    const xRef = useRef<Group>(null)
    const yRef = useRef<Group>(null)
    const zRef = useRef<Group>(null)

    // Sync mesh position with store
    useFrame(() => {
        if (yRef.current) yRef.current.position.z = coords.y * 0.001
        if (xRef.current) xRef.current.position.x = coords.x * 0.001
        if (zRef.current) zRef.current.position.y = coords.z * 0.001
    })

    // Tool visual radius in meters
    const toolRadius = (toolDiameter / 2) / 1000;

    const METAL_MATERIAL = <meshStandardMaterial color="#444" roughness={0.5} metalness={0.8} />

    return (
        <group>
            {/* BASE / TABLE */}
            {/* BASE / TABLE */}
            <mesh position={[0, -0.1, 0]}>
                <MachinePart
                    url={machineAssets.base}
                    defaultMesh={
                        <>
                            <boxGeometry args={[1, 0.2, 1]} />
                            {METAL_MATERIAL}
                        </>
                    }
                    color="#444"
                />
            </mesh>

            {/* Y-AXIS (Gantry) */}
            <group ref={yRef}>
                <group position={[0, 0.5, 0]}> {/* Pivot adjustment for STLs usually centered at bottom? We'll keep standard pivot at 0,0,0 relative to parent */}
                    <MachinePart
                        url={machineAssets.yAxis}
                        defaultMesh={
                            <group>
                                <mesh position={[-0.4, 0, 0]}>
                                    <boxGeometry args={[0.1, 1, 0.2]} />
                                    {METAL_MATERIAL}
                                </mesh>
                                <mesh position={[0.4, 0, 0]}>
                                    <boxGeometry args={[0.1, 1, 0.2]} />
                                    {METAL_MATERIAL}
                                </mesh>
                            </group>
                        }
                    />
                </group>

                {/* X-AXIS (Carriage) */}
                <group position={[0, 0.8, 0]} ref={xRef}>
                    <MachinePart
                        url={machineAssets.xAxis}
                        defaultMesh={
                            <mesh position={[0, 0, 0]}>
                                <boxGeometry args={[1, 0.1, 0.1]} />
                                {METAL_MATERIAL}
                            </mesh>
                        }
                    />

                    {/* Z-AXIS (Spindle) */}
                    <group ref={zRef}>
                        {/* Spindle Body */}
                        <group position={[0, -0.2, 0.1]}>
                            <MachinePart
                                url={machineAssets.zAxis}
                                defaultMesh={
                                    <mesh>
                                        <boxGeometry args={[0.1, 0.4, 0.1]} />
                                        <meshStandardMaterial color="#888" metalness={0.9} />
                                    </mesh>
                                }
                            />
                        </group>

                        {/* Spinning Bit (Variable Geometry) */}
                        <group position={[0, -0.4, 0.1]}>
                            {/* Default or Flat */}
                            {(toolType === 'FLAT' || !toolType) &&
                                <mesh>
                                    <cylinderGeometry args={[toolRadius, toolRadius, 0.1, 16]} />
                                    <meshStandardMaterial color="gold" metalness={1} roughness={0.2} />
                                </mesh>
                            }

                            {/* Ball Nose - Cylinder + Sphere cap */}
                            {toolType === 'BALL' &&
                                <group>
                                    <mesh position={[0, 0.005, 0]}> {/* Shift up slightly so ball is at tip? No, centering. */}
                                        <cylinderGeometry args={[toolRadius, toolRadius, 0.09, 16]} />
                                        <meshStandardMaterial color="gold" metalness={1} roughness={0.2} />
                                    </mesh>
                                    <mesh position={[0, -0.045, 0]}>
                                        <sphereGeometry args={[toolRadius, 16, 16]} />
                                        <meshStandardMaterial color="gold" metalness={1} roughness={0.2} />
                                    </mesh>
                                </group>
                            }

                            {/* V-Bit - Cone */}
                            {toolType === 'VBIT' &&
                                <mesh position={[0, 0, 0]}>
                                    <cylinderGeometry args={[toolRadius, 0.0001, 0.1, 16]} />
                                    <meshStandardMaterial color="gold" metalness={1} roughness={0.2} />
                                </mesh>
                            }
                        </group>
                    </group>
                </group>
            </group>
        </group>
    )
}
