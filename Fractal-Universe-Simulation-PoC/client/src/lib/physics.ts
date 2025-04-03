import { Vector2 } from "./types";

export function calculateDisplacement(
  velocity: Vector2,
  offset: Vector2,
  distance: number,
  strength: number,
  falloff: number,
  size: number,
  forwardDisplacementFactor: number,
): Vector2 {
  const safeDist = Math.max(0.2, distance);
  const falloffFactor = 1 / (1 + (safeDist * (falloff + 0.01)));
  const magnitude = Math.pow(strength, 2) * falloffFactor;

  const speed = Math.hypot(velocity.x, velocity.y);
  if (speed < 0.001) return { x: 0, y: 0 };

  const normVx = velocity.x / speed;
  const normVy = velocity.y / speed;

  const lateralX = -normVy;
  const lateralY = normVx;

  const offsetX = offset.x;
  const offsetY = offset.y;

  const offsetMag = Math.hypot(offsetX, offsetY);
  if (offsetMag < 0.001) return { x: 0, y: 0 };

  const forwardComponent = (offsetX * normVx + offsetY * normVy) / offsetMag;
  if (forwardComponent < 0) return { x: 0, y: 0 };

  const lateralComponent = (offsetX * lateralX + offsetY * lateralY) / offsetMag;

  // const forwardFactor = Math.max(0, forwardComponent);

  // this exaggerated lateral rotation / skew to make up for no time effects but may be unneeded now that time is implemented
  // const cross = normVx * offsetY - normVy * offsetX;
  // const skewStrength = 0.314;
  // const skewX = -Math.sign(cross) * lateralX * skewStrength;
  // const skewY = -Math.sign(cross) * lateralY * skewStrength;
  const skewX = 0;
  const skewY = 0;

  const forwardFactor = (Math.min(0.15, Math.max(0.8, (size / 6))) * forwardDisplacementFactor);
  // const forwardFactor = 0.15;
  const sideFactor = (1 - forwardFactor);

  return {
    x:
      normVx * magnitude * Math.pow(size, 2) * forwardFactor * forwardFactor -
      lateralX * magnitude * Math.pow(size, 2) * lateralComponent * sideFactor +
      skewX,
    y:
      normVy * magnitude * Math.pow(size, 2) * forwardFactor * forwardFactor -
      lateralY * magnitude * Math.pow(size, 2) * lateralComponent * sideFactor +
      skewY,
  };
}


export function calculateEnergyRedirection(
  velocity: Vector2,
  displacement: Vector2,
  nextCellDisplacement: Vector2,
  forwardDisplacementFactor: number = 0.0,
  steerFactor: number = 0.2,
  energySize: number = 1,
  parentFieldSkew: number = 0.0,
  timeFactor: number = 1,
): Vector2 {
  const dispMag = Math.hypot(displacement.x, displacement.y);
  if (dispMag < 0.01) return { ...velocity };

  const velMag = Math.hypot(velocity.x, velocity.y);
  if (velMag < 0.01) return { ...velocity };

  const normVel = {
    x: velocity.x / velMag,
    y: velocity.y / velMag,
  };

  // Calculate base skew direction (perpendicular to velocity)
  const skewVec = {
    x: -normVel.y,
    y: normVel.x
  };

  const forwardDot = displacement.x * normVel.x + displacement.y * normVel.y;

  const forwardVec = {
    x: normVel.x * forwardDot,
    y: normVel.y * forwardDot,
  };

  const lateralVec = {
    x: displacement.x - forwardVec.x,
    y: displacement.y - forwardVec.y,
  };

  const baselineDisplacement = 1.0;
  const displacementRatio = dispMag / baselineDisplacement;

  const inverseResistance = Math.min(1, 1 / displacementRatio);
  const forwardResistance = Math.pow(forwardDisplacementFactor, 2) * inverseResistance;

  const adjustedForward = {
    x: forwardVec.x * (1 - forwardResistance),
    y: forwardVec.y * (1 - forwardResistance),
  };

  // Apply skew to lateral movement
  const skewAmount = parentFieldSkew;
  const adjustedDisplacement = {
    x: adjustedForward.x + (lateralVec.x) + (skewVec.x * skewAmount),
    y: adjustedForward.y + (lateralVec.y) + (skewVec.y * skewAmount),
  };

  const redirVec = {
    x: (velocity.x * 1.00) + (adjustedDisplacement.x * steerFactor * (1 / energySize)),
    y: velocity.y + (adjustedDisplacement.y * steerFactor * (1 / energySize)),
  };

  const redirMag = Math.hypot(redirVec.x, redirVec.y);
  let scale = velMag / redirMag;

  // Calculate time scaling based on displacement difference
  if (timeFactor != 0 && dispMag > 0.01) {
    // Calculate displacement difference vector
    const dispDiff = {
      x: nextCellDisplacement.x - displacement.x,
      y: nextCellDisplacement.y - displacement.y,
    };

    const dispDiffMag = Math.hypot(dispDiff.x, dispDiff.y);
    if (dispDiffMag > 0.01) {
      // Normalize displacement difference
      const normDispDiff = {
        x: dispDiff.x / dispDiffMag,
        y: dispDiff.y / dispDiffMag,
      };

      // Calculate alignment between velocity and displacement difference
      const alignment = (normDispDiff.x * normVel.x + normDispDiff.y * normVel.y);

      // Calculate magnitude ratio using displacement difference
      const magnitudeRatio = dispDiffMag / velMag;

      // Combine alignment and magnitude for time scaling
      const timeScale = alignment * magnitudeRatio;

      // Apply time factor with 0 as the neutral point
      scale *= (1 + timeScale * timeFactor);
    }
  }

  return {
    x: redirVec.x * scale,
    y: redirVec.y * scale,
  };
}
