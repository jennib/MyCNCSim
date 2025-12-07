import { SUBTRACTION, Brush, Evaluator } from 'three-bvh-csg';
import { BufferGeometryLoader, Matrix4 } from 'three';

const loader = new BufferGeometryLoader();
const evaluator = new Evaluator();

const stockBrush = new Brush();
const toolBrush = new Brush();

self.onmessage = (e) => {
    const { type, stockGeometry, toolGeometry, toolMatrix } = e.data;

    if (type === 'subtract') {
        try {
            if (stockGeometry) {
                stockBrush.geometry = loader.parse(stockGeometry);
                stockBrush.updateMatrixWorld();
            }

            // 2. Set Tool Geometry & Position
            // We now receive the specific geometry for the selected tool type from MaterialCore
            toolBrush.geometry = loader.parse(toolGeometry);

            const matrix = new Matrix4().fromArray(toolMatrix);
            toolBrush.matrix = matrix;
            toolBrush.matrixAutoUpdate = false;
            toolBrush.updateMatrixWorld();

            // 3. Perform Subtraction
            evaluator.useGroups = true;
            const result = evaluator.evaluate(stockBrush, toolBrush, SUBTRACTION);

            const json = result.geometry.toJSON();

            self.postMessage({ type: 'result', geometry: json });

        } catch (err: any) {
            console.error("CSG Worker Error:", err);
            self.postMessage({ type: 'error', message: err.message });
        }
    }
};
