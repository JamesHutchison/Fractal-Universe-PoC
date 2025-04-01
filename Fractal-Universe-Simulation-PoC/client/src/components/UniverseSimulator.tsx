import { Canvas, useThree } from "@react-three/fiber";
import { useState, Suspense, useRef, useEffect } from "react";
import { useSimulation } from "@/lib/stores/useSimulation";
import { KeyboardControls, OrthographicCamera } from "@react-three/drei";
import SimulationControls from "./SimulationControls";
import SpacetimeGrid from "./SpacetimeGrid";
import * as THREE from "three";

// Define control keys for adding energy with keyboard
const controls = [
  { name: "addEnergy", keys: ["Space"] },
  { name: "togglePause", keys: ["KeyP"] },
  { name: "clearAll", keys: ["KeyC"] },
];

export default function UniverseSimulator() {
  const {
    isPaused,
    togglePause,
    addRandomEnergy,
    clearEnergies,
    resetSimulation,
    gridSize,
  } = useSimulation();

  // Calculate camera zoom based on grid size
  // For larger grids, we want a smaller zoom factor (more zoomed out)
  const cameraZoom = 50 * (100 / gridSize);

  const [showControls, setShowControls] = useState(true);

  // Camera controller component for mouse wheel zooming
  function CameraController() {
    const { camera, gl } = useThree();
    const minZoom = 1;
    const maxZoom = 100;
    const zoomSpeed = 2.5;

    useEffect(() => {
      const handleWheel = (event: WheelEvent) => {
        // Prevent default browser behavior (page scrolling)
        event.preventDefault();

        // Get the camera as OrthographicCamera
        const orthoCam = camera as THREE.OrthographicCamera;

        // Apply zoom based on wheel direction
        const newZoom = orthoCam.zoom - event.deltaY * 0.01 * zoomSpeed;

        // Clamp zoom to reasonable limits
        orthoCam.zoom = Math.max(minZoom, Math.min(maxZoom, newZoom));

        // Update camera projections
        orthoCam.updateProjectionMatrix();
      };

      // Add event listener to the DOM element
      const domElement = gl.domElement;
      domElement.addEventListener("wheel", handleWheel);

      // Clean up
      return () => {
        domElement.removeEventListener("wheel", handleWheel);
      };
    }, [camera, gl]);

    return null;
  }

  return (
    <div className="w-full h-full relative">
      <KeyboardControls map={controls}>
        <Canvas
          orthographic
          camera={{
            position: [0, 0, 100],
            zoom: cameraZoom,
            up: [0, 0, 1],
            far: 1000,
          }}
          gl={{ antialias: true }}
          onCreated={({ gl }) => {
            gl.setClearColor("#111111");
          }}
        >
          <CameraController />
          <color attach="background" args={["#111111"]} />
          <ambientLight intensity={0.5} />
          <pointLight position={[10, 10, 100]} intensity={1} />

          <Suspense fallback={null}>
            <SpacetimeGrid />
          </Suspense>
        </Canvas>
      </KeyboardControls>

      {/* Top buttons */}
      <div className="absolute top-[8rem] left-4 flex space-x-2">
        <button
          onClick={() => setShowControls(!showControls)}
          className="px-4 py-2 bg-primary bg-slate-800 text-white rounded-md rounded-md"
        >
          {showControls ? "Hide Controls" : "Show Controls"}
        </button>
      </div>

      {/* Quick action buttons */}
      <div className="absolute bottom-4 left-4 flex space-x-2">
        <button
          onClick={addRandomEnergy}
          className="px-4 py-2 bg-blue-500 text-white rounded-md"
        >
          Add Energy
        </button>
        <button
          onClick={togglePause}
          className="px-4 py-2 bg-green-500 text-white rounded-md"
        >
          {isPaused ? "Resume" : "Pause"}
        </button>
        <button
          onClick={clearEnergies}
          className="px-4 py-2 bg-red-500 text-white rounded-md"
        >
          Clear All
        </button>
        <button
          onClick={resetSimulation}
          className="px-4 py-2 bg-purple-500 text-white rounded-md"
        >
          Reset All
        </button>
      </div>

      {/* Controls panel */}
      {showControls && (
        <div className="absolute top-16 right-4 w-80 bg-slate-800 p-4 rounded-md shadow-lg text-white">
          <h2 className="text-lg font-bold mb-4 text-white">
            Universe Simulator Controls
          </h2>
          <SimulationControls />
        </div>
      )}

      {/* Instructions */}
      <div className="absolute top-4 left-4 p-3 bg-slate-800 text-white rounded-md max-w-xs">
        <p className="text-xs">
          <strong>Controls:</strong> Click anywhere to add energy. Space to add
          random energy. P to pause/resume. C to clear all. Mouse wheel to zoom
          in/out.
        </p>
      </div>
    </div>
  );
}
