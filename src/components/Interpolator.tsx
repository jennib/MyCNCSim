import { useFrame } from '@react-three/fiber'
import { useMachineStore } from '../store'
import { Vector3 } from 'three'

export function Interpolator() {
    const {
        coords, targetCoords, setCoords,
        isRunning, isMoving, setIsMoving,
        popNextCommand, setTargetCoords, setSpindle
    } = useMachineStore()

    // We use refs for high-frequency updates to avoid re-rendering entire React tree too often
    // But we sync back to store for UI updates.

    useFrame((_state, delta) => {
        if (!isRunning && !isMoving) return;

        const currentPos = new Vector3(coords.x, coords.y, coords.z);
        const targetPos = new Vector3(targetCoords.x, targetCoords.y, targetCoords.z);

        const dist = currentPos.distanceTo(targetPos);

        // If we are effectively AT the target
        if (dist < 0.01) {
            if (isMoving) {
                setIsMoving(false);
                // Snap to exact
                setCoords(targetCoords);
            }

            if (isRunning) {
                // Fetch next command
                const cmd = popNextCommand();
                if (cmd) {
                    // Process Command
                    if (cmd.type === 'G0' || cmd.type === 'G1') {
                        setIsMoving(true);
                        setTargetCoords({
                            x: cmd.x !== undefined ? cmd.x : targetCoords.x,
                            y: cmd.y !== undefined ? cmd.y : targetCoords.y,
                            z: cmd.z !== undefined ? cmd.z : targetCoords.z,
                        });
                    } else if (cmd.type === 'M3') {
                        setSpindle(true, cmd.s);
                    } else if (cmd.type === 'M5') {
                        setSpindle(false);
                    }
                }
            }
            return;
        }

        // Interpolate
        // Speed mechanism: 1000mm/min = 1000 units / 60 sec = 16.6 units/sec
        // For simplicity, let's just move fixed speed for now.
        const speed = 50 * delta; // 50 units per second

        const dir = targetPos.clone().sub(currentPos).normalize();
        const move = dir.multiplyScalar(Math.min(dist, speed));
        const newPos = currentPos.add(move);

        setCoords({ x: newPos.x, y: newPos.y, z: newPos.z });
    })

    return null
}
