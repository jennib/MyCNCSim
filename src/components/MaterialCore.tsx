import { useRef, useEffect, useState, useMemo } from 'react'
import { useMachineStore } from '../store'
import { Mesh, BufferGeometry, Matrix4, CylinderGeometry, BoxGeometry } from 'three'
import { BufferGeometryLoader } from 'three'

// Note: In standard Vite projects this might need 'three-stdlib' or direct import from 'three/addons'. 
// If it fails, we will use a simpler approach (switching geometries instead of merging).

interface MaterialProps {
    initialSize: [number, number, number]
}

export function MaterialCore({ initialSize }: MaterialProps) {
    const { coords, isSpindleOn, toolDiameter, toolType, setIsCutting } = useMachineStore()
    const meshRef = useRef<Mesh>(null)
    const [geometry, setGeometry] = useState<BufferGeometry>(new BoxGeometry(...initialSize))
    const workerRef = useRef<Worker>(undefined)
    const isProcessing = useRef(false)

    // Dynamic Tool Geo
    const toolRadius = useMemo(() => toolDiameter / 2000, [toolDiameter]);

    // Generate the brush geometry
    const toolGeo = useMemo(() => {
        // FLAT
        if (toolType === 'FLAT' || !toolType) {
            return new CylinderGeometry(toolRadius, toolRadius, 0.2, 16);
        }

        // V-BIT (Tone)
        if (toolType === 'VBIT') {
            return new CylinderGeometry(toolRadius, 0.0001, 0.2, 16);
        }

        // BALL NOSE
        if (toolType === 'BALL') {
            return new CylinderGeometry(toolRadius, toolRadius * 0.5, 0.2, 16);
        }

        return new CylinderGeometry(toolRadius, toolRadius, 0.2, 16);
    }, [toolRadius, toolType])

    useEffect(() => {
        workerRef.current = new Worker(new URL('../workers/csg.worker.ts', import.meta.url), { type: 'module' })

        workerRef.current.onmessage = (e) => {
            const { geometry: geoJSON } = e.data
            isProcessing.current = false

            const loader = new BufferGeometryLoader()
            const newGeo = loader.parse(geoJSON)
            setGeometry(newGeo)
            setIsCutting(true)
            // Reset cutting state after a short delay to simulate "cutting action"
            setTimeout(() => setIsCutting(false), 120)
        }


        return () => workerRef.current?.terminate()
    }, [])

    useEffect(() => {
        const handleExport = () => {
            // Dynamic import to avoid circular dependency issues or just use the utility
            import('../utils/stlExporter').then(({ exportSTL, saveString }) => {
                const stl = exportSTL(geometry);
                saveString(stl, "hyper-cnc-part.stl");
            });
        };

        window.addEventListener('EXPORT_STL', handleExport);
        return () => window.removeEventListener('EXPORT_STL', handleExport);
    }, [geometry]);

    useEffect(() => {
        if (!isSpindleOn) return
        if (isProcessing.current) return

        const cut = () => {
            if (!meshRef.current || isProcessing.current) return
            isProcessing.current = true

            const matrix = new Matrix4()
            matrix.setPosition(coords.x * 0.001, coords.z * 0.001, coords.y * 0.001)

            workerRef.current?.postMessage({
                type: 'subtract',
                stockGeometry: geometry.toJSON(),
                toolGeometry: toolGeo.toJSON(),
                toolMatrix: matrix.toArray()
            })
        }

        const interval = setInterval(cut, 100)
        return () => clearInterval(interval)

    }, [coords, isSpindleOn, geometry, toolGeo])

    return (
        <mesh ref={meshRef} geometry={geometry} castShadow receiveShadow position={[0, 0, 0]}>
            <meshStandardMaterial color="#888888" roughness={0.5} metalness={0.1} />
        </mesh>
    )
}
