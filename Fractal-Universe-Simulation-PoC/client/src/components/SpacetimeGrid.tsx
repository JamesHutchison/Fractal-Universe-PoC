import { useMemo, useRef, useEffect } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { useKeyboardControls } from "@react-three/drei";
import { useSimulation } from "@/lib/stores/useSimulation";
import { calculateDisplacement } from "@/lib/physics";
import EnergyParticle from "./EnergyParticle";
import GridVisualization from "./GridVisualization";

export default function SpacetimeGrid() {
  const {
    gridSize,
    gridCells,
    energies,
    addEnergy,
    energySize,
    updateEnergies,
    updateGridDisplacement,
    isPaused,
    clearEnergies,
    togglePause,
    addRandomEnergy,
    curDirectionIndex,
    incrementCurrentDirectionIndex,
  } = useSimulation();

  const { viewport, camera } = useThree();
  const gridRef = useRef<THREE.Group>(null);

  const addEnergyPressed = useKeyboardControls((state) => state.addEnergy);
  const togglePausePressed = useKeyboardControls((state) => state.togglePause);
  const clearAllPressed = useKeyboardControls((state) => state.clearAll);

  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (addEnergyPressed) {
      addRandomEnergy();
    }
  }, [addEnergyPressed, addRandomEnergy]);

  useEffect(() => {
    if (togglePausePressed) {
      togglePause();
    }
  }, [togglePausePressed, togglePause]);

  useEffect(() => {
    if (clearAllPressed) {
      clearEnergies();
    }
  }, [clearAllPressed, clearEnergies]);

  const gridLines = useMemo(() => {
    const size = gridSize / 2;
    const step = 1;
    const lines = [];

    for (let i = -size; i <= size; i += step) {
      lines.push(
        <line key={`v-${i}`}>
          <bufferGeometry
            attach="geometry"
            args={[new Float32Array([i, -size, 0, i, size, 0]), 3]}
          />
          <lineBasicMaterial attach="material" color="#333333" />
        </line>,
      );
      lines.push(
        <line key={`h-${i}`}>
          <bufferGeometry
            attach="geometry"
            args={[new Float32Array([-size, i, 0, size, i, 0]), 3]}
          />
          <lineBasicMaterial attach="material" color="#333333" />
        </line>,
      );
    }

    return lines;
  }, [gridSize, viewport.width]);

  const addEnergyAtPoint = (point: THREE.Vector3) => {
    const directions = [
      { x: 0, y: 1 },
      { x: 0, y: -1 },
      { x: -1, y: 0 },
      { x: 1, y: 0 },
    ];
    // const randomDirection =
    //   directions[Math.floor(Math.random() * directions.length)];
    const randomDirection = directions[curDirectionIndex]

    addEnergy({
      position: { x: point.x, y: point.y },
      velocity: randomDirection,
      size: energySize,
    });
  };

  const handlePointerDown = (event: THREE.Event) => {
    if (
      (event.nativeEvent?.target as HTMLElement)?.tagName === "BUTTON" ||
      (event.nativeEvent?.target as HTMLElement)?.tagName === "INPUT"
    )
      return;

    event.stopPropagation();
    const point = event.point;

    addEnergyAtPoint(point);

    intervalRef.current = setInterval(() => {
      addEnergyAtPoint(point);
    }, 100);
  };

  const handlePointerUp = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
      incrementCurrentDirectionIndex();
    }
  };

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  useFrame((_, delta) => {
    if (!isPaused) {
      delta = Math.min(0.1, delta); // prevent hitch causing bonkers physics
      updateEnergies(delta);
      updateGridDisplacement(delta);
    }
  });

  return (
    <group
      ref={gridRef}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
    >
      <GridVisualization />
      {energies.map((energy) => (
        <EnergyParticle key={energy.id} energy={energy} />
      ))}
      {gridLines}
    </group>
  );
}
