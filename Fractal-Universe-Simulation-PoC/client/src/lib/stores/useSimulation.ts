import { create } from "zustand";
import { nanoid } from "nanoid";
import { Energy, Vector2, GridCell } from "../types";
import { calculateDisplacement, calculateEnergyRedirection } from "../physics";

interface SimulationState {
  // Configuration
  gridSize: number;
  energySpeed: number;
  energySize: number;
  energySteerFactor: number;
  displacementStrength: number;
  propagationRate: number;
  falloffRate: number;
  spacetimePressure: number;
  spacetimePressureMultiplier: number;
  showGrid: boolean;
  showVelocityVectors: boolean;
  isPaused: boolean;

  forwardDisplacementFactor: number;
  curDirectionIndex: number;
  incrementCurrentDirectionIndex: () => void;

  parentFieldSkew: number;
  setParentFieldSkew: (skew: number) => void;

  directionMode: 'cycle' | 'up' | 'down' | 'left' | 'right';
  setDirectionMode: (mode: 'cycle' | 'up' | 'down' | 'left' | 'right') => void;

  timeFactor: number;
  setTimeFactor: (factor: number) => void;

  // Data
  energies: Energy[];
  gridCells: GridCell[];

  // Actions
  setGridSize: (size: number) => void;
  setEnergySpeed: (speed: number) => void;
  setEnergySize: (size: number) => void;
  setDisplacementStrength: (strength: number) => void;
  setPropagationRate: (rate: number) => void;
  setEnergySteerFactor: (factor: number) => void;
  setFalloffRate: (rate: number) => void;
  setSpacetimePressure: (rate: number) => void;
  setSpacetimePressureMultiplier: (multiplier: number) => void;
  setShowGrid: (show: boolean) => void;
  setShowVelocityVectors: (show: boolean) => void;
  setForwardDisplacementFactor: (factor: number) => void;
  togglePause: () => void;

  addEnergy: (energy: Partial<Energy>) => void;
  addRandomEnergy: () => void;
  removeEnergy: (id: string) => void;
  updateEnergies: (deltaTime: number) => void;
  clearEnergies: () => void;

  updateGridDisplacement: (deltaTime: number) => void;
  resetGrid: () => void;
  resetSimulation: () => void;
}


const directionVectors = [
  { x: 1, y: 0 },   // 0°   (E)
  { x: 1, y: 1 },   // 45°  (SE)
  { x: 0, y: 1 },   // 90°  (S)
  { x: -1, y: 1 },  // 135° (SW)
  { x: -1, y: 0 },  // 180° (W)
  { x: -1, y: -1 }, // 225° (NW)
  { x: 0, y: -1 },  // 270° (N)
  { x: 1, y: -1 }   // 315° (NE)
]

function normalize(v: Vector2): Vector2 {
  const mag = Math.hypot(v.x, v.y)
  return mag === 0 ? { x: 0, y: 0 } : { x: v.x / mag, y: v.y / mag }
}

export const useSimulation = create<SimulationState>((set, get) => {
  const defaults = {
    // Default configuration
    gridSize: 100, // 100x100 grid
    energySpeed: 15,
    energySize: 1.0,
    energySteerFactor: -0.2,
    displacementStrength: 1.0,
    spacetimePressureMultiplier: 1.0,
    propagationRate: 2,
    falloffRate: 0.3,
    spacetimePressure: 0.0, // Rate at which grid returns to equilibrium
    showGrid: true,
    showVelocityVectors: false,
    isPaused: false,
    forwardDisplacementFactor: 1.0,
    parentFieldSkew: 0,
    directionMode: 'cycle' as const,
    timeFactor: 1.0,
  };
  // Initialize the grid cells
  const initializeGrid = (size: number): GridCell[] => {
    const cells: GridCell[] = [];
    for (let i = 0; i < size * size; i++) {
      cells.push({
        displacement: { x: 0, y: 0 },
        velocity: { x: 0, y: 0 },
      });
    }
    return cells;
  };

  return {
    ...defaults,
    // Initialize data
    energies: [],
    gridCells: initializeGrid(100),
    curDirectionIndex: 0,


    // Configuration setters
    setGridSize: (size) => {
      set({
        gridSize: size,
        gridCells: initializeGrid(size),
      });
    },
    setEnergySpeed: (speed) => set({ energySpeed: speed }),
    setEnergySize: (size) => set({ energySize: size }),
    setDisplacementStrength: (strength) =>
      set({ displacementStrength: strength }),
    setPropagationRate: (rate) => set({ propagationRate: rate }),
    setFalloffRate: (rate) => set({ falloffRate: rate }),
    setSpacetimePressure: (rate) => set({ spacetimePressure: rate }),
    setSpacetimePressureMultiplier: (multiplier) =>
      set({ spacetimePressureMultiplier: multiplier }),
    setShowGrid: (show) => set({ showGrid: show }),
    setEnergySteerFactor: (factor) => set({ energySteerFactor: factor }),
    setShowVelocityVectors: (show) => set({ showVelocityVectors: show }),
    setForwardDisplacementFactor: (factor) =>
      set({ forwardDisplacementFactor: factor }),
    togglePause: () => set((state) => ({ isPaused: !state.isPaused })),
    setParentFieldSkew: (skew) => set({ parentFieldSkew: skew }),
    setDirectionMode: (mode) => set({ directionMode: mode }),
    setTimeFactor: (factor) => set({ timeFactor: factor }),

    // Energy management
    addEnergy: (energy) => {
      const { energySpeed, energySize, energySteerFactor } = get();

      // Set default properties if not provided
      const newEnergy: Energy = {
        id: nanoid(),
        position: energy.position || { x: 0, y: 0 },
        velocity: energy.velocity || { x: 0, y: 0 },
        speed: energySpeed,
        size: energy.size || 1,
        color: energy.color || "#ffffff",
        createdAt: Date.now(),
        steerFactor: energySteerFactor,
      };

      // Normalize velocity and apply speed
      const magnitude = Math.sqrt(
        newEnergy.velocity.x * newEnergy.velocity.x +
          newEnergy.velocity.y * newEnergy.velocity.y,
      );

      if (magnitude > 0) {
        newEnergy.velocity.x = (newEnergy.velocity.x / magnitude) * energySpeed;
        newEnergy.velocity.y = (newEnergy.velocity.y / magnitude) * energySpeed;
      } else {
        // If no velocity provided, create a random direction
        const angle = Math.random() * Math.PI * 2;
        newEnergy.velocity.x = Math.cos(angle) * energySpeed;
        newEnergy.velocity.y = Math.sin(angle) * energySpeed;
      }

      newEnergy.velocity.x *= (1 / energySize);
      newEnergy.velocity.y *= (1 / energySize);

      // Add to energies array
      set((state) => ({
        energies: [...state.energies, newEnergy],
      }));
    },

    incrementCurrentDirectionIndex: () => {
      const { curDirectionIndex } = get();
      set({ curDirectionIndex: (curDirectionIndex + 1) % 4 })
    },

    addRandomEnergy: () => {
      const { gridSize, curDirectionIndex, energySize, directionMode } = get();
      const halfSize = gridSize / 2;

      const directions = [
        { x: 0, y: 1 }, // right
        { x: 0, y: -1 }, // left
        { x: -1, y: 0 }, // up
        { x: 1, y: 0 }, // down
      ];

      let direction;
      if (directionMode === 'cycle') {
        direction = directions[curDirectionIndex];
        get().incrementCurrentDirectionIndex();
      } else {
        direction = {
          up: directions[2],
          down: directions[3],
          left: directions[1],
          right: directions[0]
        }[directionMode];
      }

      const newEnergy: Partial<Energy> = {
        position: {
          x: Math.random() * gridSize - halfSize,
          y: Math.random() * gridSize - halfSize,
        },
        velocity: {
          x: direction.x,
          y: direction.y,
        },
        size: energySize,
      };

      get().addEnergy(newEnergy);
    },

    removeEnergy: (id) => {
      set((state) => ({
        energies: state.energies.filter((energy) => energy.id !== id),
      }));
    },

    clearEnergies: () => {
      set({ energies: [] });
      get().resetGrid();
    },

    updateEnergies: (deltaTime) => {
      const {
        energies,
        gridSize,
        gridCells,
        forwardDisplacementFactor,
        parentFieldSkew,
        timeFactor,
      } = get();

      // Boundary of the grid
      const halfSize = gridSize / 2;
      const boundsPadding = 2; // Allow particles to go slightly out of bounds before removing

      // Filter out energies that are too far outside the grid
      const filteredEnergies = energies.filter((energy) => {
        return (
          energy.position.x >= -(halfSize + boundsPadding) &&
          energy.position.x <= halfSize + boundsPadding &&
          energy.position.y >= -(halfSize + boundsPadding) &&
          energy.position.y <= halfSize + boundsPadding
        );
      });

      // Updated energy array
      const updatedEnergies = filteredEnergies.map((energy) => {
        // Create a copy of the energy
        const updatedEnergy = { ...energy };

        // Get grid cell influence at this position
        const gridX = Math.floor(energy.position.x + halfSize);
        const gridY = Math.floor(energy.position.y + halfSize);


        // Bounds check
        if (gridX >= 0 && gridX < gridSize && gridY >= 0 && gridY < gridSize) {
          const gridIndex = gridY * gridSize + gridX;
          const cell = gridCells[gridIndex];

          // Calculate redirection based on grid displacement
          if (cell) {

            const energyAngle = Math.atan2(energy.velocity.y, energy.velocity.x);
            const baseOctant = Math.round(8 * energyAngle / (2 * Math.PI) + 8) % 8;
            const o1 = directionVectors[baseOctant]

            const o1X = (gridX + o1.x + gridSize) % gridSize
            const o1Y = (gridY + o1.y + gridSize) % gridSize
            const o1Index = o1Y * gridSize + o1X
            const o1Cell = gridCells[o1Index]

            let stepX = o1.x
            let stepY = o1.y
            let nextCell

            if (!o1Cell || Math.abs(o1Cell.displacement.x) + Math.abs(o1Cell.displacement.y) < 0.5) {
              nextCell = o1Cell
            } else {
              const o2 = directionVectors[(baseOctant + 1) % 8]
              const o3 = directionVectors[(baseOctant + 2) % 8]

              const vx = energy.velocity.x
              const vy = energy.velocity.y
              const mag = Math.sqrt(vx * vx + vy * vy)
              const nx = vx / mag
              const ny = vy / mag

              const d1 = nx * o1.x + ny * o1.y
              const d2 = nx * o2.x + ny * o2.y
              const d3 = nx * o3.x + ny * o3.y

              const total = Math.max(0.0001, d1 + d2 + d3)

              const blendedX = (o1.x * d1 + o2.x * d2 + o3.x * d3) / total
              const blendedY = (o1.y * d1 + o2.y * d2 + o3.y * d3) / total

              stepX = Math.round(blendedX)
              stepY = Math.round(blendedY)

              const blendedXWrapped = (gridX + stepX + gridSize) % gridSize
              const blendedYWrapped = (gridY + stepY + gridSize) % gridSize
              const blendedIndex = blendedYWrapped * gridSize + blendedXWrapped
              nextCell = gridCells[blendedIndex]
            }

            const nextCellDisplacement = nextCell ? nextCell.displacement : { x: 0, y: 0 }

            const magnitude = Math.sqrt(energy.velocity.x ** 2 + energy.velocity.y ** 2)
            const normalizedVelocity = magnitude === 0 ? { x: 0, y  : 0 } : {
              x: (energy.velocity.x / magnitude) * energy.speed,
              y: (energy.velocity.y / magnitude) * energy.speed
            }

            const redirected = calculateEnergyRedirection(
              normalizedVelocity,
              cell.displacement,
              nextCellDisplacement,
              forwardDisplacementFactor,
              energy.steerFactor,
              energy.size,
              parentFieldSkew,
              timeFactor,
            );

            // Apply redirection to velocity
            updatedEnergy.velocity = redirected;
          }
        }

        // Scale based on how much the redirection changed the velocity
        const newSpeed = Math.sqrt(
          updatedEnergy.velocity.x * updatedEnergy.velocity.x +
            updatedEnergy.velocity.y * updatedEnergy.velocity.y,
        );

        // const speedScale = newSpeed / energySpeed;

        // Apply final position update, allowing the stretch/squish to affect distance
        updatedEnergy.position.x += updatedEnergy.velocity.x * deltaTime;
        updatedEnergy.position.y += updatedEnergy.velocity.y * deltaTime;

        // without this - get speed of light
        // with this - get orbits
        // Normalize velocity to maintain constant speed
        // const speed = Math.sqrt(
        //   updatedEnergy.velocity.x * updatedEnergy.velocity.x +
        //     updatedEnergy.velocity.y * updatedEnergy.velocity.y,
        // );

        // if (speed > 0) {
        //   updatedEnergy.velocity.x =
        //     (updatedEnergy.velocity.x / speed) * energySpeed;
        //   updatedEnergy.velocity.y =
        //     (updatedEnergy.velocity.y / speed) * energySpeed;
        // }

        // // Update position based on velocity
        // updatedEnergy.position.x += updatedEnergy.velocity.x * deltaTime;
        // updatedEnergy.position.y += updatedEnergy.velocity.y * deltaTime;

        // Wrap around grid boundaries
        if (updatedEnergy.position.x < -halfSize) {
          updatedEnergy.position.x *= -1;
        } else if (updatedEnergy.position.x > halfSize) {
          updatedEnergy.position.x *= -1;
        }

        if (updatedEnergy.position.y < -halfSize) {
          updatedEnergy.position.y *= -1;
        } else if (updatedEnergy.position.y > halfSize) {
          updatedEnergy.position.y *= -1;
        }

        return updatedEnergy;
      });

      // Update state with new energies
      set({ energies: updatedEnergies });
    },

    // updateGridDisplacement: (deltaTime) => {
    //   const {
    //     gridCells,
    //     gridSize,
    //     energies,
    //     displacementStrength,
    //     propagationRate,
    //     falloffRate,
    //     spacetimePressure,
    //   } = get();

    //   const updatedGrid = [...gridCells];
    //   const halfSize = gridSize / 2;

    //   energies.forEach((energy) => {
    //     const gridX = Math.floor(energy.position.x + halfSize);
    //     const gridY = Math.floor(energy.position.y + halfSize);

    //     for (
    //       let y = Math.max(0, gridY - 3);
    //       y <= Math.min(gridSize - 1, gridY + 3);
    //       y++
    //     ) {
    //       for (
    //         let x = Math.max(0, gridX - 3);
    //         x <= Math.min(gridSize - 1, gridX + 3);
    //         x++
    //       ) {
    //         const index = y * gridSize + x;
    //         const distance = Math.sqrt(
    //           Math.pow(x - gridX, 2) + Math.pow(y - gridY, 2)
    //         );

    //         if (distance > 7) continue;

    //         const displacement = calculateDisplacement(
    //           energy.velocity,
    //           distance,
    //           displacementStrength,
    //           falloffRate,
    //           energy.size
    //         );

    //         updatedGrid[index].displacement.x += displacement.x * deltaTime;
    //         updatedGrid[index].displacement.y += displacement.y * deltaTime;
    //       }
    //     }
    //   });

    //   const gridCopy = [...updatedGrid];

    //   if (propagationRate > 0) {
    //     for (let y = 1; y < gridSize - 1; y++) {
    //       for (let x = 1; x < gridSize - 1; x++) {
    //         const idx = y * gridSize + x;

    //         const above = (y - 1) * gridSize + x;
    //         const below = (y + 1) * gridSize + x;
    //         const left = y * gridSize + (x - 1);
    //         const right = y * gridSize + (x + 1);

    //         const avgDisplacementX =
    //           (gridCopy[above].displacement.x +
    //             gridCopy[below].displacement.x +
    //             gridCopy[left].displacement.x +
    //             gridCopy[right].displacement.x) /
    //           4;

    //         const avgDisplacementY =
    //           (gridCopy[above].displacement.y +
    //             gridCopy[below].displacement.y +
    //             gridCopy[left].displacement.y +
    //             gridCopy[right].displacement.y) /
    //           4;

    //         updatedGrid[idx].displacement.x +=
    //           (avgDisplacementX - gridCopy[idx].displacement.x) *
    //           propagationRate *
    //           deltaTime;

    //         updatedGrid[idx].displacement.y +=
    //           (avgDisplacementY - gridCopy[idx].displacement.y) *
    //           propagationRate *
    //           deltaTime;
    //       }
    //     }
    //   }

    //   for (let i = 0; i < updatedGrid.length; i++) {
    //     const d = updatedGrid[i].displacement;
    //     const magnitude = Math.hypot(d.x, d.y);
    //     const damping = 1 / (1 + magnitude / 1.4);
    //     d.x *= damping;
    //     d.y *= damping;
    //   }

    updateGridDisplacement: (deltaTime) => {
      const {
        gridCells,
        gridSize,
        energies,
        displacementStrength,
        propagationRate,
        falloffRate,
        spacetimePressure,
        spacetimePressureMultiplier,
        forwardDisplacementFactor,
      } = get();

      // Create a copy of the grid cells
      const updatedGrid = [...gridCells];

      // Calculate half size for grid positioning
      const halfSize = gridSize / 2;

      // Apply displacement from energy particles
      energies.forEach((energy) => {
        // Calculate grid position of energy
        const gridX = Math.floor(energy.position.x + halfSize);
        const gridY = Math.floor(energy.position.y + halfSize);
        const energyScale = (1 / energy.size)
        const maxDistance = Math.min(9, Math.floor(9 * energyScale))

        // Apply displacement to surrounding grid cells
        for (let _y = gridY - 9; _y <= gridY + 9; _y++) {
          const y = (_y + gridSize) % gridSize;
          for (let _x = gridX - 9; _x <= gridX + 9; _x++) {
            const x = (_x + gridSize) % gridSize;
            // Calculate grid cell index
            const index = y * gridSize + x;

            // Calculate distance from energy to grid cell
            const dx = Math.min(Math.abs(_x - gridX), gridSize - Math.abs(_x - gridX));
            const dy = Math.min(Math.abs(_y - gridY), gridSize - Math.abs(_y - gridY));
            const distance = Math.sqrt(dx * dx + dy * dy);

            // Skip if too far
            if (distance > maxDistance) continue;
            const offset = {
              x: gridX - _x,
              y: gridY - _y,
            };
            // Calculate displacement
            const displacement = calculateDisplacement(
              energy.velocity,
              offset,
              distance,
              displacementStrength,
              falloffRate,
              energy.size,
              forwardDisplacementFactor,
            );

            const existing = updatedGrid[index].displacement;
            const appliedX = displacement.x * deltaTime;
            const appliedY = displacement.y * deltaTime;

            const scaleX = 1;
            const scaleY = 1;

            existing.x += appliedX * scaleX;
            existing.y += appliedY * scaleY;
          }
        }
      });

      // Make a copy of the current grid to calculate propagation
      const gridCopy = [...updatedGrid];

      // Apply propagation of displacement between cells
      // Only handle propagation if the rate is greater than 0
      if (propagationRate > 0) {
        for (let y = 0; y < gridSize; y++) {
          for (let x = 0; x < gridSize; x++) {
            const idx = y * gridSize + x;

            // Check neighbors (using von Neumann neighborhood - 4 adjacent cells)
            const above = ((y - 1 + gridSize) % gridSize) * gridSize + x;
            const below = ((y + 1) % gridSize) * gridSize + x;
            const left = y * gridSize + ((x - 1 + gridSize) % gridSize);
            const right = y * gridSize + ((x + 1) % gridSize);


            // Calculate average displacement from neighbors
            const avgDisplacementX =
              (gridCopy[above].displacement.x +
                gridCopy[below].displacement.x +
                gridCopy[left].displacement.x +
                gridCopy[right].displacement.x) /
              4;

            const avgDisplacementY =
              (gridCopy[above].displacement.y +
                gridCopy[below].displacement.y +
                gridCopy[left].displacement.y +
                gridCopy[right].displacement.y) /
              4;

            // Apply propagation (blend cell's displacement with neighbors)
            updatedGrid[idx].displacement.x +=
              (avgDisplacementX - gridCopy[idx].displacement.x) *
              propagationRate *
              deltaTime;
            updatedGrid[idx].displacement.y +=
              (avgDisplacementY - gridCopy[idx].displacement.y) *
              propagationRate *
              deltaTime;
          }
        }
      }

      // Apply grid cell healing (displacement gradually returns to zero)
      if (spacetimePressure > 0) {
        const pressure = spacetimePressure * spacetimePressureMultiplier;
        for (let i = 0; i < updatedGrid.length; i++) {
          // Dampen displacement over time (exponential decay)
          // spacetimePressure = 0 means no healing (displacement never returns to equilibrium)
          updatedGrid[i].displacement.x *= 1 - pressure * deltaTime;
          updatedGrid[i].displacement.y *= 1 - pressure * deltaTime;
        }
      }

      // Update the grid
      set({ gridCells: updatedGrid });
    },

    resetGrid: () => {
      const { gridSize } = get();
      set({ gridCells: initializeGrid(gridSize) });
    },

    resetSimulation: () => {
      const { gridSize } = get();
      // Reset to default settings
      set({
        ...defaults,
        gridCells: initializeGrid(gridSize),
        energies: [],
      });
    },
  };
});
