export interface Vector2 {
  x: number;
  y: number;
}

export interface Energy {
  id: string;
  position: Vector2;
  velocity: Vector2;
  speed: number;
  size: number;
  color: string;
  createdAt: number;
  steerFactor: number;
}

export interface GridCell {
  displacement: Vector2;
  velocity: Vector2;
}
