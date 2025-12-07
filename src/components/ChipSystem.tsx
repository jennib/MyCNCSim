import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { InstancedMesh, Object3D, DynamicDrawUsage, Vector3 } from 'three'
import { useMachineStore } from '../store'

const MAX_CHIPS = 2000;
const GRAVITY = -9.8;
const DAMPING = 0.95;

export function ChipSystem() {
    const meshRef = useRef<InstancedMesh>(null);
    const { coords, isSpindleOn, isMoving } = useMachineStore();

    // Particle State
    // We manage this outside of React state for raw performance (no re-renders)
    const particles = useMemo(() => {
        return new Array(MAX_CHIPS).fill(0).map(() => ({
            position: new Vector3(0, -100, 0), // Hidden initially
            velocity: new Vector3(0, 0, 0),
            life: 0,
            active: false
        }));
    }, []);

    const dummy = useMemo(() => new Object3D(), []);

    useFrame((state, delta) => {
        if (!meshRef.current) return;

        // 1. Spawn Logic
        // Simple heuristic: If spindle is on, moving, and below a certain height, spawn chips.
        // Stock top is at y=0.1 (center) + 0.1 (half height) = 0.2? 
        // Wait, in Machine.tsx logic was: zRef.current.position.y = coords.z * 0.001
        // And Material is at [0,0,0] with size [0.5, 0.1, 0.5]. 
        // BoxGeometry is centered, so Top Y is 0.05.

        // Let's assume stock top is around Z=5mm (0.005) to Z=0.
        const isCutting = isSpindleOn && isMoving && coords.z < 5;

        if (isCutting) {
            // Spawn Rate: 5 per frame
            for (let i = 0; i < 5; i++) {
                const p = particles.find(p => !p.active);
                if (p) {
                    p.active = true;
                    p.life = 1.0 + Math.random(); // 1-2 seconds life

                    // Position at Tool Tip
                    // Tool tip is at machine coordinates.
                    p.position.set(
                        coords.x * 0.001 + (Math.random() - 0.5) * 0.01,
                        coords.z * 0.001, // Z is up/down in CNC, Y is up/down in ThreeJS? 
                        // Wait, in Machine.tsx:
                        // yRef.current.position.z = coords.y
                        // xRef.current.position.x = coords.x
                        // zRef.current.position.y = coords.z
                        // So ThreeJS Y is the CNC Z axis.
                        coords.y * 0.001 + (Math.random() - 0.5) * 0.01
                    );

                    // We need to map CNC (X, Y, Z) to Three (X, Z, Y) based on Machine.tsx
                    // Machine.tsx:
                    // X -> X
                    // Y -> Z
                    // Z -> Y
                    p.position.set(
                        coords.x * 0.001,
                        coords.z * 0.001, // Height
                        coords.y * 0.001
                    );

                    // Random Velocity (Explosive)
                    p.velocity.set(
                        (Math.random() - 0.5) * 2,
                        Math.random() * 2, // Upwards
                        (Math.random() - 0.5) * 2
                    );
                }
            }
        }

        // 2. Physics Update
        let activeCount = 0;
        particles.forEach((p, i) => {
            if (p.active) {
                p.life -= delta;

                // Physics
                p.velocity.y += GRAVITY * delta; // Gravity
                p.velocity.multiplyScalar(DAMPING); // Air resistance
                p.position.addScaledVector(p.velocity, delta);

                // Floor collision
                if (p.position.y < 0) {
                    p.position.y = 0;
                    p.velocity.y *= -0.5; // Bounce
                    p.velocity.x *= 0.5; // Friction
                    p.velocity.z *= 0.5;
                }

                // Kill
                if (p.life <= 0) {
                    p.active = false;
                    p.position.set(0, -100, 0);
                }

                // Update Instance
                dummy.position.copy(p.position);
                // Random rotation for realism
                dummy.rotation.x += p.velocity.z * delta * 10;
                dummy.rotation.z -= p.velocity.x * delta * 10;

                dummy.updateMatrix();
                meshRef.current?.setMatrixAt(i, dummy.matrix);
                activeCount++;
            }
        });

        if (activeCount > 0) {
            meshRef.current.instanceMatrix.needsUpdate = true;
        }
    });

    return (
        <instancedMesh
            ref={meshRef}
            args={[undefined, undefined, MAX_CHIPS]}
            frustumCulled={false}
        >
            <dodecahedronGeometry args={[0.003, 0]} />
            {/* Shiny Metal Chips */}
            <meshStandardMaterial
                color="#ffaa00" // Brass/Gold chips typical in CNC demos
                roughness={0.2}
                metalness={1.0}
            />
        </instancedMesh>
    )
}
