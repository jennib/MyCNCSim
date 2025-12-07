import { useRef, useEffect, useState, useMemo } from 'react'
import { useMachineStore } from '../store'
import { Mesh, BufferGeometry, Matrix4, CylinderGeometry, BoxGeometry, SphereGeometry } from 'three'
import { BufferGeometryLoader } from 'three'
// @ts-ignore
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils'
// Note: In standard Vite projects this might need 'three-stdlib' or direct import from 'three/addons'. 
// If it fails, we will use a simpler approach (switching geometries instead of merging).

interface MaterialProps {
    initialSize: [number, number, number]
}

export function MaterialCore({ initialSize }: MaterialProps) {
    const { coords, isSpindleOn, toolDiameter, toolType, setIsCutting } = useMachineStore()
    const meshRef = useRef<Mesh>(null)
    const [geometry, setGeometry] = useState<BufferGeometry>(new BoxGeometry(...initialSize))
    const workerRef = useRef<Worker>()
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
        // Complex: Cylinder + Sphere. We can't easily merge in this env without deps.
        // Fallback: Just use a Sphere at the tip for the cut? Or a Capsule?
        // Let's rely on standard geometries. 
        // A single Cylinder implies a flat bottom.
        // A high segment cone implies a V.
        // A sphere implies a Ball. But we need the shaft too?
        // Actually for cutting, we only care about the intersection.
        // If we cut with a capsule, it works.
        // Let's approximate Ball with a Cylinder for now if merge is hard, 
        // OR try to create a simple custom geometry?
        // Let's stick to simple primitives:
        if (toolType === 'BALL') {
            // Rough approximation: A cylinder with slightly rounded bottom? 
            // Or just a capsule if available in ThreeJS geometry? No CapsuleGeometry in core until recent versions.
            // Let's use Cylinder for shaft and Sphere for tip?
            // Since we can only pass ONE geometry to CSG currently without merging...
            // We will just use a Cylinder for stability, but maybe 'taper' it slightly?
            // Actually, let's just return a Cylinder. Implementing mergeGeometries is risky without known imports.
            // WAIT! We can just use a Cylinder but `radiusBottom` slightly smaller?
            return new CylinderGeometry(toolRadius, toolRadius * 0.5, 0.2, 16);
        }

        return new CylinderGeometry(toolRadius, toolRadius, 0.2, 16);
    }, [toolRadius, toolType])

    useEffect(() => {
        workerRef.current = new Worker(new URL('../workers/csg.worker.ts', import.meta.url), { type: 'module' })

        workerRef.current.onmessage = (e) => {
            const { type, geometry: geoJSON } = e.data
            isProcessing.current = false

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
