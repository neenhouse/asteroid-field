// --- Constants (matching retro-pixel original) ---

export const SCALE = 4;
export const LASER_SPEED = 200;
export const LASER_LIFE = 1.2;
export const FIRE_COOLDOWN = 0.15;
export const START_LIVES = 3;
export const INVULN_TIME = 2.0;
export const HIT_RADIUS_SHIP = 2.5;

export const ASTEROID_TIERS = [
  { radius: 14, speedMin: 12, speedMax: 22, score: 20 },
  { radius: 8, speedMin: 20, speedMax: 35, score: 50 },
  { radius: 4, speedMin: 30, speedMax: 55, score: 100 },
];

export const PARALLAX = [0.15, 0.4, 1.0];

// --- Colors ---

export const COL_BG = '#05050e';
export const COL_SHIP = '#00eeff';
export const COL_SHIP_ACCENT = '#0088aa';
export const COL_LASER = '#ff4444';
export const COL_LASER_GLOW = '#ff8866';
export const COL_ASTEROID = ['#332e28', '#665544', '#aa9977'];
export const COL_HUD = '#00eeff';
export const COL_STAR = ['#ffffff', '#8888cc'];
export const COL_PARTICLE = '#ffaa44';
export const COL_PARTICLE_BLUE = '#44aaff';

// --- Interfaces ---

export interface Asteroid {
  x: number; y: number; vx: number; vy: number;
  tier: number; shape: number[]; rot: number; rotSpeed: number;
  layer: number; active: boolean;
}

export interface Laser {
  x: number; y: number; vx: number; vy: number;
  life: number; active: boolean;
}

export interface Particle {
  x: number; y: number; vx: number; vy: number;
  life: number; maxLife: number; color: string; size: number; active: boolean;
}

export interface Star {
  x: number; y: number; brightness: number;
  twinklePhase: number; twinkleSpeed: number; layer: number;
}

// --- Power-ups ---

export type PowerUpKind = 'shield' | 'rapidfire' | 'bomb';

export interface PowerUp {
  x: number; y: number;
  kind: PowerUpKind;
  life: number;
  active: boolean;
}

export const POWERUP_DROP_CHANCE = 0.15;
export const POWERUP_LIFETIME = 8;
export const POWERUP_RADIUS = 4;
export const SHIELD_DURATION = 6;
export const RAPIDFIRE_DURATION = 5;
export const RAPIDFIRE_COOLDOWN = 0.06;

export const COL_SHIELD = '#44ff88';
export const COL_RAPIDFIRE = '#ffff44';
export const COL_BOMB = '#ff6644';

// --- Utility functions ---

export function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

export function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

export function wrap(v: number, max: number): number {
  return ((v % max) + max) % max;
}

export function dist(ax: number, ay: number, bx: number, by: number): number {
  const dx = ax - bx, dy = ay - by;
  return Math.sqrt(dx * dx + dy * dy);
}

export function randRange(min: number, max: number): number {
  return min + Math.random() * (max - min);
}
