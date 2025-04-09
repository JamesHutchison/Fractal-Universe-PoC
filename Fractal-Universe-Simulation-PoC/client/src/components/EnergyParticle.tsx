import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { Energy } from "@/lib/types";
import { useSimulation } from "@/lib/stores/useSimulation";

interface EnergyParticleProps {
  energy: Energy;
}

export default function EnergyParticle({ energy }: EnergyParticleProps) {
  const { energySize, showVelocityVectors } = useSimulation();
  const energyRef = useRef<THREE.Mesh>(null);

  // Create a ref for the velocity arrow
  const arrowRef = useRef<THREE.ArrowHelper>(null);

  // Update the energy visualization every frame
  useFrame(() => {
    if (energyRef.current) {
      energyRef.current.position.x = energy.position.x;
      energyRef.current.position.y = energy.position.y;

      const sz = Math.pow(energy.size, 0.8);

      // Set a fixed scale for the energy without pulsing effect
      energyRef.current.scale.set(
        sz,
        sz,
        1
      );
    }

    // Update velocity arrow
    if (arrowRef.current && showVelocityVectors) {
      // Direction vector from velocity
      const dir = new THREE.Vector3(energy.velocity.x, energy.velocity.y, 0);
      dir.normalize();

      // Update arrow position and direction
      arrowRef.current.position.set(energy.position.x, energy.position.y, 0.1);
      arrowRef.current.setDirection(dir);
      arrowRef.current.setLength(energySize * 1.5); // Scale arrow with energy size

      // Make arrow visible
      arrowRef.current.visible = true;
    } else if (arrowRef.current) {
      // Hide arrow when not showing velocity vectors
      arrowRef.current.visible = false;
    }
  });

  // Calculate color based on energy velocity
  const speed = Math.sqrt(
    energy.velocity.x * energy.velocity.x +
    energy.velocity.y * energy.velocity.y
  );

  // Create color gradient from blue to red based on speed
  const hue = Math.max(0, Math.min(240 - speed * 20, 240));
  const color = new THREE.Color(`hsl(${hue}, 100%, 50%)`);

  return (
    <group>
      <mesh ref={energyRef} position={[energy.position.x, energy.position.y, 0.1]}>
        <circleGeometry args={[1, 64]} />
        <meshBasicMaterial color={color} transparent opacity={0.9} />
      </mesh>

      {/* Velocity vector visualization */}
      <primitive
        ref={arrowRef}
        object={new THREE.ArrowHelper(
          new THREE.Vector3(energy.velocity.x, energy.velocity.y, 0).normalize(),
          new THREE.Vector3(energy.position.x, energy.position.y, 0.1),
          energySize * 1.5, // Length
          0xffff00 // Color
        )}
        visible={showVelocityVectors}
      />
    </group>
  );
}
