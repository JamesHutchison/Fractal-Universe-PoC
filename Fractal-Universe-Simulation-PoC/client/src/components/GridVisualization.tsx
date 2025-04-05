import { useRef, useMemo } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { useSimulation } from "@/lib/stores/useSimulation";

export default function GridVisualization() {
  const { gridSize, gridCells, showGrid } = useSimulation();
  const { viewport, camera } = useThree();

  // Create refs for our meshes
  const gridMeshRef = useRef<THREE.Mesh>(null);
  const gridPointsRef = useRef<THREE.Points>(null);

  // Create a grid of points to visualize the spacetime displacement
  const { positions, indices, uvs, gridPoints } = useMemo(() => {
    // Calculate the number of cells in each dimension
    const cellsPerSide = gridSize; //* viewport.width;
    const halfSize = gridSize / 2;
    const cellSize = 1; // 1 unit per cell

    // Create vertices for the grid cells
    const positions: number[] = [];
    const indices: number[] = [];
    const uvs: number[] = [];
    const gridPoints: number[] = [];

    // Create a grid plane
    for (let y = 0; y <= cellsPerSide; y++) {
      for (let x = 0; x <= cellsPerSide; x++) {
        // Calculate grid position (centered)
        const xPos = x * cellSize - halfSize;
        const yPos = y * cellSize - halfSize;

        // Add vertex
        positions.push(xPos, yPos, 0);

        // Add UV coordinates
        uvs.push(x / cellsPerSide, y / cellsPerSide);

        // Add to grid points (for visualization)
        gridPoints.push(xPos, yPos, 0);

        // Create triangles (2 per grid cell)
        if (x < cellsPerSide && y < cellsPerSide) {
          // Calculate indices for the cell's corners
          const a = y * (cellsPerSide + 1) + x;
          const b = y * (cellsPerSide + 1) + x + 1;
          const c = (y + 1) * (cellsPerSide + 1) + x;
          const d = (y + 1) * (cellsPerSide + 1) + x + 1;

          // First triangle
          indices.push(a, b, c);

          // Second triangle
          indices.push(c, b, d);
        }
      }
    }

    return { positions, indices, uvs, gridPoints };
  }, [gridSize]);

  // Create a buffer geometry for the grid
  const gridGeometry = useMemo(() => {
    const geometry = new THREE.BufferGeometry();
    geometry.setIndex(indices);
    geometry.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(positions, 3),
    );
    geometry.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
    return geometry;
  }, [positions, indices, uvs]);

  // Create a buffer geometry for grid points
  const pointsGeometry = useMemo(() => {
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(gridPoints, 3),
    );
    return geometry;
  }, [gridPoints]);

  // Update the grid visualization every frame
  useFrame(() => {
    if (gridMeshRef.current && gridPointsRef.current) {
      // Update each vertex based on grid displacement
      const positions = gridPointsRef.current.geometry.attributes.position
        .array as Float32Array;
      const gridPositions = gridMeshRef.current.geometry.attributes.position
        .array as Float32Array;

      const cellsPerSide = gridSize;
      const halfSize = gridSize / 2;

      // Apply displacements to grid vertices
      for (let y = 0; y <= cellsPerSide; y++) {
        for (let x = 0; x <= cellsPerSide; x++) {
          const index = y * (cellsPerSide + 1) + x;
          const vertexIndex = index * 3;

          // Base grid position (undisplaced)
          const baseX = x - halfSize;
          const baseY = y - halfSize;

          // Get grid cell displacement
          let displaceX = 0;
          let displaceY = 0;

          // Find the corresponding grid cell
          const gridIndex = y * gridSize + x;
          if (gridCells[gridIndex]) {
            displaceX = gridCells[gridIndex].displacement.x;
            displaceY = gridCells[gridIndex].displacement.y;
          }

          // Apply displacement to both geometries
          positions[vertexIndex] = baseX + displaceX;
          positions[vertexIndex + 1] = baseY + displaceY;

          gridPositions[vertexIndex] = baseX + displaceX;
          gridPositions[vertexIndex + 1] = baseY + displaceY;
        }
      }

      // Update geometries
      gridPointsRef.current.geometry.attributes.position.needsUpdate = true;
      gridMeshRef.current.geometry.attributes.position.needsUpdate = true;
    }
  });

  return (
    <group>
      {/* Grid mesh (distorted plane) */}
      <mesh ref={gridMeshRef} geometry={gridGeometry}>
        <meshBasicMaterial
          color="#222244"
          wireframe={showGrid}
          side={THREE.DoubleSide}
          transparent
          opacity={0.2}
        />
      </mesh>

      {/* Grid points (with displacement) */}
      <points ref={gridPointsRef} geometry={pointsGeometry}>
        <pointsMaterial
          color="#8888ff"
          size={0.2}
          transparent
          opacity={0.7}
          sizeAttenuation={false}
        />
      </points>
    </group>
  );
}
