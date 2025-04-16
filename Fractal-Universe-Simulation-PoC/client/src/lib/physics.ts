import { Vector2 } from "./types";

export function calculateDisplacement(
  velocity: Vector2,
  offset: Vector2,
  distance: number,
  strength: number,
  falloff: number,
  size: number,
  lateralDisplacementFactor: number,
): Vector2 {
  if (distance == 0) return { x: 0, y: 0 };
  const safeDist = Math.max(0.2, distance);
  const falloffFactor = 1 / (1 + (Math.pow(safeDist, 2) * (falloff + 0.01)));

  const magnitude = Math.pow(strength, 2) * falloffFactor;

  const speed = Math.hypot(velocity.x, velocity.y);
  if (speed < 0.001) return { x: 0, y: 0 };

  const normVx = velocity.x / speed;
  const normVy = velocity.y / speed;

  const lateralX = -normVy;
  const lateralY = normVx;

  const offsetX = offset.x;
  const offsetY = offset.y;

  const forwardComponent = (offsetX * normVx + offsetY * normVy);
  if (forwardComponent < 0) return { x: 0, y: 0 };

  const lateralComponent = (offsetX * lateralX + offsetY * lateralY);

  // spacetime setting
  // const forwardFactor = (Math.max(0.15, Math.min(0.8, (size / 6))));
  // const sideFactor = (1 - forwardFactor) * lateralDisplacementFactor;

  // return {
  //   x:
  //     (normVx * (1 + forwardComponent) * forwardFactor - lateralX * lateralComponent * sideFactor)
  //     * magnitude * Math.pow(size, 2),
  //   y:
  //     (normVy * (1 + forwardComponent) * forwardFactor - lateralY * lateralComponent * sideFactor)
  //     * magnitude * Math.pow(size, 2),
  // };

  // biological setting
  // const forwardFactor = (Math.max(0.15, Math.min(0.8, (size / 6)))) * lateralDisplacementFactor;
  // const sideFactor = (1 - forwardFactor);

  // return {
  //   x:
  //     (normVx * forwardComponent + Math.pow(forwardFactor, 2) - lateralX * lateralComponent * sideFactor)
  //     * magnitude * Math.pow(size, 2),
  //   y:
  //     (normVy * forwardComponent + Math.pow(forwardFactor, 2) - lateralY * lateralComponent * sideFactor)
  //     * magnitude * Math.pow(size, 2),
  // };
  // const displacementSizeFactor = 1;
  // const forwardFactor = (Math.max(0.15, Math.min(0.8, (displacementSizeFactor / size))));
  // const sideFactor = (1 - forwardFactor) * lateralDisplacementFactor;

  // const distanceSquared = Math.pow(distance, 2);
  // return {
  //   x:
  //     ((normVx * forwardComponent * forwardFactor - lateralX * lateralComponent * sideFactor)
  //     * (magnitude) * Math.pow(size, 2)) / distanceSquared,
  //   y:
  //     ((normVy * forwardComponent * forwardFactor - lateralY * lateralComponent * sideFactor)
  //     * (magnitude) * Math.pow(size, 2)) / distanceSquared,
  // };
  const displacementSizeFactor = 3;
  const forwardFactor = (Math.max(0.15, Math.min(0.8, (size / (displacementSizeFactor * lateralDisplacementFactor)))));
  const sideFactor = (1 - forwardFactor) * lateralDisplacementFactor;

  // const distanceSquared = Math.pow(distance, 2);
  return {
    x:
      ((normVx * (forwardComponent) * forwardFactor - lateralX * lateralComponent * sideFactor)
      * magnitude * Math.pow(size, 2)),
    y:
      ((normVy * (forwardComponent) * forwardFactor - lateralY * lateralComponent * sideFactor)
      * magnitude * Math.pow(size, 2)),
  };
}

interface Vector2WithScale {
  vector: Vector2;
  timeScale: number;
}

export function calculateEnergyRedirection(
  velocity: Vector2,
  displacement: Vector2,
  nextCellDisplacement: Vector2,
  lateralDisplacementFactor: number = 0.0,
  steerFactor: number = 0.2,
  energySize: number = 1,
  parentFieldSkew: number = 0.0,
  timeFactor: number = 1,
): Vector2WithScale {
  const dispMag = Math.hypot(displacement.x, displacement.y);
  if (dispMag < 0.01 && parentFieldSkew === 0.0) return { vector: velocity, timeScale: 1 };

  const velMag = Math.hypot(velocity.x, velocity.y);
  if (velMag < 0.01) return { vector: velocity, timeScale: 1 };

  const normVel = {
    x: velocity.x / velMag,
    y: velocity.y / velMag,
  };



  const forwardDot = displacement.x * normVel.x + displacement.y * normVel.y;

  const forwardVec = {
    x: normVel.x * forwardDot,
    y: normVel.y * forwardDot,
  };

  const displacementRatio = Math.max(0.0001, forwardDot);

  const inverseResistance = Math.min(1, 1 / displacementRatio);
  const forwardResistance = Math.max(1, Math.pow(lateralDisplacementFactor, 2) * inverseResistance);

  const adjustedForward = {
    x: forwardVec.x * (1 - forwardResistance),
    y: forwardVec.y * (1 - forwardResistance),
  };

  // Apply skew to lateral movement
  const lateralVec = {
    x: displacement.x - forwardVec.x,
    y: displacement.y - forwardVec.y,
  };
  // Calculate base skew direction (perpendicular to velocity)
  const skewVec = {
    x: -normVel.y,
    y: normVel.x
  };
  const adjustedDisplacement = {
    x: adjustedForward.x + (lateralVec.x) + (skewVec.x * parentFieldSkew),
    y: adjustedForward.y + (lateralVec.y) + (skewVec.y * parentFieldSkew),
  };

  const redirVec = {
    x: velocity.x + (adjustedDisplacement.x * steerFactor * (1 / energySize)),
    y: velocity.y + (adjustedDisplacement.y * steerFactor * (1 / energySize)),
  };

  const redirMag = Math.hypot(redirVec.x, redirVec.y);
  let scale = velMag / redirMag;
  let timeScale = 1;

  // Calculate time scaling based on displacement difference
  if (timeFactor != 0 && dispMag > 0.01) {
    // Calculate displacement difference vector
    const dispDiff = {
      x: nextCellDisplacement.x - displacement.x,
      y: nextCellDisplacement.y - displacement.y,
    };

    const dispDiffMag = Math.hypot(dispDiff.x, dispDiff.y);
    if (dispDiffMag > 0.01) {
      // Calculate magnitude ratio using displacement difference
      const magnitudeRatio = dispDiffMag / velMag;

      // Normalize displacement difference
      const normDispDiff = {
        x: dispDiff.x / dispDiffMag,
        y: dispDiff.y / dispDiffMag,
      };

      // Calculate alignment between velocity and displacement difference via dot product
      const alignment = (normDispDiff.x * normVel.x + normDispDiff.y * normVel.y);

      // Combine alignment and magnitude for time scaling
      if (timeFactor >= 2) {
        timeScale = 1 + (Math.pow(alignment * magnitudeRatio * (timeFactor - 1), 2) * Math.sign(alignment));
      } else {
        timeScale = 1 + alignment * magnitudeRatio * timeFactor;
      }

      // Apply time factor with 0 as the neutral point
      scale *= timeScale;
    }
  }

  return {
    vector: {x: redirVec.x * scale,
    y: redirVec.y * scale},
    timeScale: Math.min(1, Math.abs(timeScale)),
  };
}
