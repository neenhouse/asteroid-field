export interface Vec2 {
  x: number;
  y: number;
}

export interface Ship {
  pos: Vec2;
  size: number;
  lives: number;
  invincibleUntil: number;
  lastShotTime: number;
}

export type AsteroidSize = 'large' | 'medium' | 'small';

export interface Asteroid {
  pos: Vec2;
  vel: Vec2;
  size: AsteroidSize;
  radius: number;
  vertices: Vec2[];
}

export interface Projectile {
  pos: Vec2;
  vel: Vec2;
}

export interface Particle {
  pos: Vec2;
  vel: Vec2;
  life: number; // 1.0 → 0.0
}

export interface ScreenShake {
  intensity: number;
  offsetX: number;
  offsetY: number;
}

export type GamePhase = 'menu' | 'playing' | 'gameOver';

export interface GameState {
  phase: GamePhase;
  ship: Ship;
  asteroids: Asteroid[];
  projectiles: Projectile[];
  particles: Particle[];
  score: number;
  highScore: number;
  level: number;
  difficulty: number;
  lastSpawnTime: number;
  elapsedTime: number;
  shake: ScreenShake;
}

// Canvas internal resolution
export const GAME_WIDTH = 480;
export const GAME_HEIGHT = 360;

// Ship
export const SHIP_SPEED = 160;
export const SHIP_SIZE = 8;
export const SHIP_HIT_RADIUS = 6;
export const FIRE_COOLDOWN = 0.25;
export const INVINCIBILITY_DURATION = 2;

// Projectiles
export const PROJECTILE_SPEED = 300;
export const PROJECTILE_RADIUS = 2;

// Spawning & difficulty
export const BASE_SPAWN_INTERVAL = 2;
export const DIFFICULTY_RAMP_INTERVAL = 30;

// Particle
export const PARTICLE_DURATION = 0.5;

export const ASTEROID_CONFIG: Record<
  AsteroidSize,
  { radius: number; speedMin: number; speedMax: number; score: number }
> = {
  large: { radius: 25, speedMin: 30, speedMax: 60, score: 25 },
  medium: { radius: 15, speedMin: 50, speedMax: 90, score: 50 },
  small: { radius: 8, speedMin: 80, speedMax: 130, score: 100 },
};
