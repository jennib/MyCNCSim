import { BufferGeometry } from "three";

export function exportSTL(geometry: BufferGeometry) {
    const positions = geometry.attributes.position;
    const normals = geometry.attributes.normal;
    const index = geometry.getIndex();

    let stl = "solid exported\n";

    const count = index ? index.count : positions.count;

    for (let i = 0; i < count; i += 3) {
        // Get vertex indices
        const a = index ? index.getX(i) : i;
        const b = index ? index.getX(i + 1) : i + 1;
        const c = index ? index.getX(i + 2) : i + 2;

        // Get Normal (Use first vertex normal or compute face normal?)
        // Simple approach: Use normal of vertex 'a'
        const nx = normals ? normals.getX(a) : 0;
        const ny = normals ? normals.getY(a) : 0;
        const nz = normals ? normals.getZ(a) : 1;

        stl += `facet normal ${nx} ${ny} ${nz}\n`;
        stl += "  outer loop\n";

        // Vertex 1
        stl += `    vertex ${positions.getX(a)} ${positions.getY(a)} ${positions.getZ(a)}\n`;
        // Vertex 2
        stl += `    vertex ${positions.getX(b)} ${positions.getY(b)} ${positions.getZ(b)}\n`;
        // Vertex 3
        stl += `    vertex ${positions.getX(c)} ${positions.getY(c)} ${positions.getZ(c)}\n`;

        stl += "  endloop\n";
        stl += "endfacet\n";
    }

    stl += "endsolid exported\n";

    return stl;
}

export function saveString(text: string, filename: string) {
    const blob = new Blob([text], { type: 'text/plain' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
}
