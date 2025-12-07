import { useLoader } from '@react-three/fiber'
// @ts-ignore
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader'
import type { ReactNode } from 'react'
import { useMemo } from 'react'
import { BufferGeometry } from 'three'

interface MachinePartProps {
    url: string | null
    defaultMesh: ReactNode
    color?: string
}

export function MachinePart({ url, defaultMesh, color = "#888888" }: MachinePartProps) {
    // If no URL, render the default primitive
    if (!url) return <>{defaultMesh}</>

    // Load STL if URL exists
    const geom = useLoader(STLLoader, url) as BufferGeometry

    // Center geometry? Ideally the user exports with correct origin. 
    // We assume the STL is exported relative to the component's pivot.

    // Compute normals for better lighting if missing
    useMemo(() => {
        if (!geom.attributes.normal) geom.computeVertexNormals()
    }, [geom])

    return (
        <mesh geometry={geom} castShadow receiveShadow>
            <meshStandardMaterial color={color} roughness={0.5} metalness={0.8} />
        </mesh>
    )
}
