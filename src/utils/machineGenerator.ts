import { BufferGeometry, BoxGeometry, CylinderGeometry, Matrix4 } from 'three';
// @ts-ignore
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

export function generateMachineParts() {

    // -- UTILS --
    const createBox = (w: number, h: number, d: number, x: number, y: number, z: number) => {
        const geo = new BoxGeometry(w, h, d);
        geo.applyMatrix4(new Matrix4().makeTranslation(x, y, z));
        return geo;
    };

    const createCylinder = (r: number, h: number, x: number, y: number, z: number, rotationX = 0) => {
        const geo = new CylinderGeometry(r, r, h, 16);
        if (rotationX) geo.applyMatrix4(new Matrix4().makeRotationX(rotationX));
        geo.applyMatrix4(new Matrix4().makeTranslation(x, y, z));
        return geo;
    };

    // -- GENERATORS --

    // 1. BASE (Table + Feet + Frame)
    // A simplified 3018 style base. Aluminium profiles + black corners.
    const generateBase = () => {
        const parts: BufferGeometry[] = [];

        // Bed (Aluminum T-Slot Table) - 30cm x 18cm approx
        // Modeled as a solid slab with 'grooves' (we just do a slab for now, or multiple slats)
        // Let's do 5 slats
        for (let i = -2; i <= 2; i++) {
            parts.push(createBox(0.9, 0.02, 0.18, 0, -0.01, i * 0.2));
        }

        // Frame Sides (Bakelite/Plastic)
        // Left
        parts.push(createBox(0.02, 0.1, 1, -0.5, -0.05, 0));
        // Right
        parts.push(createBox(0.02, 0.1, 1, 0.5, -0.05, 0));

        // Front/Back Profiles
        parts.push(createBox(1, 0.04, 0.04, 0, -0.08, 0.5));
        parts.push(createBox(1, 0.04, 0.04, 0, -0.08, -0.5));

        // Feet
        parts.push(createCylinder(0.02, 0.05, -0.45, -0.12, 0.45));
        parts.push(createCylinder(0.02, 0.05, 0.45, -0.12, 0.45));
        parts.push(createCylinder(0.02, 0.05, -0.45, -0.12, -0.45));
        parts.push(createCylinder(0.02, 0.05, 0.45, -0.12, -0.45));

        return mergeGeometries(parts);
    };

    // 2. Y-AXIS (Gantry)
    // Moves back and forth? No, usually Table moves on Y in 3018, or Gantry moves.
    // In our model, Y-Axis is the GANTRY moving over the stationary bed (common in bigger machines or fixed gantry).
    // Wait, let's align with `Machine.tsx`.
    // Machine.tsx:
    // Base -> Y-Axis (Gantry) -> X-Axis (Carriage) -> Z-Axis
    // So Y moves the whole portal along the table length?
    // Actually, in `Machine.tsx`, Y-Axis is a group that translates on Z (coords.y -> z).
    // Let's look at `Machine.tsx`: `yRef.current.position.z = coords.y`.
    // So Y-Axis IS the portal moving along the length.

    const generateYAxis = () => {
        const parts: BufferGeometry[] = [];

        // Side Plates (Vertical)
        parts.push(createBox(0.05, 0.8, 0.2, -0.4, 0.4, 0)); // Left Upright
        parts.push(createBox(0.05, 0.8, 0.2, 0.4, 0.4, 0));  // Right Upright

        // X-Rails (Horizontal Bars connecting plates)
        // Top Rail
        parts.push(createCylinder(0.02, 0.8, 0, 0.7, 0, Math.PI / 2));
        // Bottom Rail
        parts.push(createCylinder(0.02, 0.8, 0, 0.5, 0, Math.PI / 2));

        // Lead Screw (Middle)
        parts.push(createCylinder(0.01, 0.8, 0, 0.6, 0, Math.PI / 2));

        // Stepper Motor (One side)
        parts.push(createBox(0.08, 0.08, 0.08, 0.45, 0.6, 0)); // Motor on Right

        return mergeGeometries(parts);
    };

    // 3. X-AXIS (Carriage)
    // Moves Left/Right on the Gantry Rails.
    const generateXAxis = () => {
        const parts: BufferGeometry[] = [];

        // Main Block
        parts.push(createBox(0.15, 0.3, 0.1, 0, 0, 0));

        // Z-Rails (Vertical for the spindle to ride on)
        parts.push(createCylinder(0.01, 0.25, -0.04, 0, 0.06));
        parts.push(createCylinder(0.01, 0.25, 0.04, 0, 0.06));

        // Servo/Stepper for Z atop
        parts.push(createBox(0.06, 0.06, 0.06, 0, 0.18, 0.06));

        return mergeGeometries(parts);
    };

    // 4. Z-AXIS (Spindle Mount + Motor)
    // Moves Up/Down on the Carriage.
    const generateZAxis = () => {
        const parts: BufferGeometry[] = [];

        // Mounting Plate
        parts.push(createBox(0.1, 0.15, 0.02, 0, 0, 0));

        // Spindle Motor Body (Cylinder)
        parts.push(createCylinder(0.05, 0.15, 0, 0, 0.06, Math.PI / 2)); // Horizontal? No Spindle is Vertical.
        // Re-do: Spindle Vertical.
        parts.push(createCylinder(0.06, 0.2, 0, 0, 0.08));

        // Cooling Fins (Rings)
        parts.push(createCylinder(0.065, 0.02, 0, 0.05, 0.08));
        parts.push(createCylinder(0.065, 0.02, 0, -0.05, 0.08));

        // Collet / Chuck
        parts.push(createCylinder(0.02, 0.05, 0, -0.12, 0.08));

        return mergeGeometries(parts);
    };

    return {
        base: generateBase(),
        yAxis: generateYAxis(),
        xAxis: generateXAxis(),
        zAxis: generateZAxis()
    };
}
