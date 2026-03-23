import type { Asteroid, Laser, Particle, Star, PowerUp, PowerUpKind } from './types';
import {
  SCALE, LASER_SPEED, LASER_LIFE, FIRE_COOLDOWN, START_LIVES,
  INVULN_TIME, HIT_RADIUS_SHIP, ASTEROID_TIERS, PARALLAX,
  COL_SHIP, COL_LASER_GLOW, COL_PARTICLE, COL_PARTICLE_BLUE,
  COL_SHIELD, COL_RAPIDFIRE, COL_BOMB,
  POWERUP_DROP_CHANCE, POWERUP_LIFETIME, POWERUP_RADIUS,
  SHIELD_DURATION, RAPIDFIRE_DURATION, RAPIDFIRE_COOLDOWN,
  lerp, clamp, wrap, dist, randRange,
} from './types';
import { InputManager } from './input';
import {
  drawBackground, drawStars, drawAsteroidLayer,
  drawLasers, drawParticles, drawPowerUps, drawShip, drawShieldEffect,
  drawHud, drawActivePowerUps, drawCombo, drawWaveAnnounce, drawGameOver,
} from './renderer';
import { playShoot, playExplosion, playShipHit, playGameOver, playPickup, playBomb } from './sound';
import type { LeaderboardEntry } from './leaderboard';
import { fetchLeaderboard, submitScore } from './leaderboard';

const MAX_DT = 0.05;
const LS_KEY = 'asteroid-field-highscore';

function loadHighScore(): number {
  try { return Number(localStorage.getItem(LS_KEY)) || 0; } catch { return 0; }
}
function saveHighScore(score: number): void {
  try { localStorage.setItem(LS_KEY, String(score)); } catch { /* */ }
}

function randomShape(): number[] {
  const pts = 8 + Math.floor(Math.random() * 5);
  const s: number[] = [];
  for (let i = 0; i < pts; i++) s.push(0.65 + Math.random() * 0.7);
  return s;
}

export class GameEngine {
  private ctx: CanvasRenderingContext2D;
  private input: InputManager;
  private canvas: HTMLCanvasElement;
  private animId = 0;
  private lastTime = 0;
  private running = false;

  // Dimensions
  private W = 0;
  private H = 0;

  // Ship
  private shipX = 0;
  private shipY = 0;
  private shipAngle = -Math.PI / 2;
  private shipAlive = true;
  private invulnTimer = INVULN_TIME;

  // Entities
  private asteroids: Asteroid[] = [];
  private lasers: Laser[] = [];
  private particles: Particle[] = [];
  private stars: Star[] = [];
  private powerups: PowerUp[] = [];

  // Game state
  private score = 0;
  private highScore = 0;
  private lives = START_LIVES;
  private gameOver = false;
  private fireCooldown = 0;
  private spawnTimer = 0;
  private spawnInterval = 2.5;
  private difficulty = 1;
  private difficultyTimer = 0;
  private totalTime = 0;
  private camOX = 0;
  private camOY = 0;

  // Screen shake
  private shakeIntensity = 0;
  private shakeX = 0;
  private shakeY = 0;

  // Power-up effects
  private shieldTimer = 0;
  private rapidfireTimer = 0;

  // Combo system
  private comboCount = 0;
  private comboTimer = 0;
  private comboDisplayTimer = 0;
  private lastComboScore = 0;

  // Wave announcements
  private waveAnnounceTimer = 0;
  private waveAnnounceLevel = 0;

  // Leaderboard
  private leaderboard: LeaderboardEntry[] = [];
  private scoreSubmitted = false;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas 2D not supported');
    ctx.imageSmoothingEnabled = false;
    this.ctx = ctx;

    this.W = Math.floor(window.innerWidth / SCALE);
    this.H = Math.floor(window.innerHeight / SCALE);
    canvas.width = this.W;
    canvas.height = this.H;

    this.input = new InputManager(this.W, this.H);
    this.highScore = loadHighScore();
    this.resetGame();
  }

  start(): void {
    this.running = true;
    this.lastTime = performance.now();
    this.animId = requestAnimationFrame(this.loop);
  }

  stop(): void {
    this.running = false;
    cancelAnimationFrame(this.animId);
    this.input.destroy();
  }

  // --- Init ---

  private initStars(): void {
    this.stars = [];
    const count = Math.floor((this.W * this.H) / 60);
    for (let i = 0; i < count; i++) {
      const layer = Math.random() < 0.6 ? 0 : 1;
      const driftSpeed = layer === 0 ? 0.5 + Math.random() * 1 : 1 + Math.random() * 2;
      const driftAngle = Math.random() * Math.PI * 2;
      this.stars.push({
        x: Math.random() * this.W,
        y: Math.random() * this.H,
        brightness: layer === 0 ? 0.15 + Math.random() * 0.35 : 0.3 + Math.random() * 0.5,
        twinklePhase: Math.random() * Math.PI * 2,
        twinkleSpeed: 0.5 + Math.random() * 2.5,
        layer,
        dx: Math.cos(driftAngle) * driftSpeed,
        dy: Math.sin(driftAngle) * driftSpeed,
      });
    }
  }

  private resetGame(): void {
    this.shipX = this.W / 2;
    this.shipY = this.H / 2;
    this.shipAngle = -Math.PI / 2;
    this.shipAlive = true;
    this.invulnTimer = INVULN_TIME;
    this.asteroids = [];
    this.lasers = [];
    this.particles = [];
    this.powerups = [];
    this.score = 0;
    this.lives = START_LIVES;
    this.gameOver = false;
    this.fireCooldown = 0;
    this.spawnTimer = 0;
    this.spawnInterval = 2.5;
    this.difficulty = 1;
    this.difficultyTimer = 0;
    this.totalTime = 0;
    this.camOX = 0;
    this.camOY = 0;
    this.shakeIntensity = 0;
    this.shakeX = 0;
    this.shakeY = 0;
    this.shieldTimer = 0;
    this.rapidfireTimer = 0;
    this.comboCount = 0;
    this.comboTimer = 0;
    this.comboDisplayTimer = 0;
    this.lastComboScore = 0;
    this.waveAnnounceTimer = 0;
    this.waveAnnounceLevel = 0;
    this.leaderboard = [];
    this.scoreSubmitted = false;
    this.input.stopInitialsMode();
    this.initStars();
    for (let i = 0; i < 5; i++) this.spawnAsteroid(0, 2);
    for (let i = 0; i < 4; i++) this.spawnAsteroid(1, 1);
    for (let i = 0; i < 8; i++) this.spawnAsteroid(1, 0);
  }

  // --- Spawning ---

  private spawnAsteroid(tierIdx: number, layer: number, atX?: number, atY?: number): void {
    const tier = ASTEROID_TIERS[tierIdx];
    let x: number, y: number;
    if (atX !== undefined && atY !== undefined) {
      x = atX;
      y = atY;
    } else {
      const edge = Math.floor(Math.random() * 4);
      switch (edge) {
        case 0: x = Math.random() * this.W; y = -tier.radius; break;
        case 1: x = this.W + tier.radius; y = Math.random() * this.H; break;
        case 2: x = Math.random() * this.W; y = this.H + tier.radius; break;
        default: x = -tier.radius; y = Math.random() * this.H; break;
      }
      if (this.shipAlive && dist(x, y, this.shipX, this.shipY) < 40) {
        x = wrap(x + this.W / 2, this.W);
        y = wrap(y + this.H / 2, this.H);
      }
    }
    const angle = Math.random() * Math.PI * 2;
    const speed = randRange(tier.speedMin, tier.speedMax) * PARALLAX[layer];
    this.asteroids.push({
      x, y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      tier: tierIdx,
      shape: randomShape(),
      rot: Math.random() * Math.PI * 2,
      rotSpeed: (Math.random() - 0.5) * 1.5,
      layer,
      active: true,
    });
  }

  private spawnParticles(x: number, y: number, count: number, color: string, speed: number, size = 1): void {
    for (let i = 0; i < count; i++) {
      const a = Math.random() * Math.PI * 2;
      const spd = speed * (0.2 + Math.random() * 0.8);
      const life = 0.25 + Math.random() * 0.55;
      this.particles.push({
        x, y,
        vx: Math.cos(a) * spd,
        vy: Math.sin(a) * spd,
        life, maxLife: life, color, size, active: true,
      });
    }
  }

  private spawnPowerUp(x: number, y: number): void {
    if (Math.random() > POWERUP_DROP_CHANCE) return;
    const kinds: PowerUpKind[] = ['shield', 'rapidfire', 'bomb'];
    const kind = kinds[Math.floor(Math.random() * kinds.length)];
    this.powerups.push({ x, y, kind, life: POWERUP_LIFETIME, active: true });
  }

  private fireLaser(): void {
    if (this.fireCooldown > 0 || !this.shipAlive || this.gameOver) return;
    const tipX = this.shipX + Math.cos(this.shipAngle) * 4;
    const tipY = this.shipY + Math.sin(this.shipAngle) * 4;
    this.lasers.push({
      x: tipX, y: tipY,
      vx: Math.cos(this.shipAngle) * LASER_SPEED,
      vy: Math.sin(this.shipAngle) * LASER_SPEED,
      life: LASER_LIFE, active: true,
    });
    const cooldown = this.rapidfireTimer > 0 ? RAPIDFIRE_COOLDOWN : FIRE_COOLDOWN;
    this.fireCooldown = cooldown;
    this.spawnParticles(tipX, tipY, 3, COL_LASER_GLOW, 20);
    playShoot();
  }

  private destroyAsteroid(a: Asteroid): void {
    a.active = false;
    // Combo system
    if (this.comboTimer > 0) {
      this.comboCount++;
    } else {
      this.comboCount = 1;
    }
    this.comboTimer = 2.0;
    const baseScore = ASTEROID_TIERS[a.tier].score;
    const multiplier = Math.min(this.comboCount, 10);
    const earned = baseScore * multiplier;
    this.score += earned;
    if (multiplier > 1) {
      this.lastComboScore = earned;
      this.comboDisplayTimer = 1.5;
    }
    const r = ASTEROID_TIERS[a.tier].radius;
    this.spawnParticles(a.x, a.y, 5 + r, COL_PARTICLE, 25 + r * 2);
    this.spawnParticles(a.x, a.y, 3, COL_PARTICLE_BLUE, 15 + r);
    playExplosion(a.tier === 0);
    // Screen shake based on asteroid size
    const shakeAmt = a.tier === 0 ? 3 : a.tier === 1 ? 1.5 : 0.5;
    this.shakeIntensity = Math.max(this.shakeIntensity, shakeAmt);
    // Maybe drop power-up
    if (a.layer === 2) this.spawnPowerUp(a.x, a.y);
    // Split
    if (a.tier < ASTEROID_TIERS.length - 1) {
      const next = a.tier + 1;
      const count = a.tier === 0 ? 3 : 2;
      for (let i = 0; i < count; i++) {
        const ang = Math.random() * Math.PI * 2;
        this.spawnAsteroid(next, a.layer, a.x + Math.cos(ang) * r * 0.3, a.y + Math.sin(ang) * r * 0.3);
      }
    }
  }

  private activateBomb(): void {
    playBomb();
    this.shakeIntensity = Math.max(this.shakeIntensity, 6);
    for (const a of this.asteroids) {
      if (!a.active || a.layer !== 2) continue;
      a.active = false;
      this.score += ASTEROID_TIERS[a.tier].score;
      this.spawnParticles(a.x, a.y, 4, COL_BOMB, 30);
    }
    // Flash effect
    this.spawnParticles(this.shipX, this.shipY, 20, COL_BOMB, 60, 2);
  }

  private shipHit(): void {
    // Shield absorbs the hit
    if (this.shieldTimer > 0) {
      this.shieldTimer = 0;
      this.spawnParticles(this.shipX, this.shipY, 10, COL_SHIELD, 40);
      this.invulnTimer = 0.5;
      return;
    }
    this.lives--;
    this.spawnParticles(this.shipX, this.shipY, 12, COL_SHIP, 45);
    this.spawnParticles(this.shipX, this.shipY, 8, COL_PARTICLE, 30);
    this.shakeIntensity = Math.max(this.shakeIntensity, 6);
    playShipHit();
    if (this.lives <= 0) {
      this.shipAlive = false;
      this.gameOver = true;
      if (this.score > this.highScore) {
        this.highScore = this.score;
        saveHighScore(this.score);
      }
      playGameOver();
      // Start leaderboard flow
      this.input.startInitialsMode();
      this.scoreSubmitted = false;
      fetchLeaderboard().then((lb) => { this.leaderboard = lb; });
    } else {
      this.invulnTimer = INVULN_TIME;
    }
  }

  // --- Main loop ---

  private loop = (now: number): void => {
    if (!this.running) return;
    const dt = Math.min((now - this.lastTime) / 1000, MAX_DT);
    this.lastTime = now;

    // Dynamic resolution
    const newW = Math.floor(window.innerWidth / SCALE);
    const newH = Math.floor(window.innerHeight / SCALE);
    if (newW !== this.W || newH !== this.H) {
      this.W = newW;
      this.H = newH;
      this.canvas.width = this.W;
      this.canvas.height = this.H;
      this.ctx.imageSmoothingEnabled = false;
    }

    // Handle initials submission
    if (this.gameOver && this.input.isInInitialsMode && this.input.initialsSubmitted && !this.scoreSubmitted) {
      this.scoreSubmitted = true;
      this.input.stopInitialsMode();
      const name = this.input.initials;
      const score = this.score;
      submitScore(name, score).then(() => {
        fetchLeaderboard().then((lb) => { this.leaderboard = lb; });
      });
    }

    // Handle restart (only after submission or if no initials mode)
    if (this.input.resetRequested && (!this.input.isInInitialsMode || this.scoreSubmitted)) {
      this.resetGame();
    } else if (this.gameOver && this.input.clicked && this.scoreSubmitted) {
      this.resetGame();
    } else {
      if (this.input.clicked && !this.gameOver) this.fireLaser();
      this.update(dt);
    }

    this.draw(dt);
    this.input.clearFrame();
    this.animId = requestAnimationFrame(this.loop);
  };

  // --- Update ---

  private update(dt: number): void {
    if (this.gameOver) return;
    this.totalTime += dt;

    // Difficulty ramp every 15s
    this.difficultyTimer += dt;
    if (this.difficultyTimer >= 15) {
      this.difficultyTimer -= 15;
      this.difficulty++;
      this.spawnInterval = Math.max(2.5 - this.difficulty * 0.2, 0.8);
      // Wave announcement
      this.waveAnnounceTimer = 2.5;
      this.waveAnnounceLevel = this.difficulty;
    }

    // Periodic asteroid spawns
    this.spawnTimer += dt;
    if (this.spawnTimer >= this.spawnInterval) {
      this.spawnTimer -= this.spawnInterval;
      const tier = Math.random() < 0.4 ? 0 : 1;
      const lr = Math.random();
      const layer = lr < 0.2 ? 0 : lr < 0.45 ? 1 : 2;
      this.spawnAsteroid(tier, layer);
    }

    // Shooting
    if (this.fireCooldown > 0) this.fireCooldown -= dt;
    if (this.input.mouseDown && this.fireCooldown <= 0 && this.shipAlive) this.fireLaser();

    // Ship follows cursor smoothly
    if (this.shipAlive) {
      const dx = this.input.mouseX - this.shipX;
      const dy = this.input.mouseY - this.shipY;
      this.shipAngle = Math.atan2(dy, dx);
      if (Math.sqrt(dx * dx + dy * dy) > 2) {
        const f = 1 - Math.pow(0.02, dt);
        this.shipX = lerp(this.shipX, this.input.mouseX, f);
        this.shipY = lerp(this.shipY, this.input.mouseY, f);
      }
      this.shipX = clamp(this.shipX, 3, this.W - 3);
      this.shipY = clamp(this.shipY, 3, this.H - 3);
      if (this.invulnTimer > 0) this.invulnTimer -= dt;
    }

    // Power-up timers
    if (this.shieldTimer > 0) this.shieldTimer -= dt;
    if (this.rapidfireTimer > 0) this.rapidfireTimer -= dt;

    // Combo decay
    if (this.comboTimer > 0) {
      this.comboTimer -= dt;
      if (this.comboTimer <= 0) this.comboCount = 0;
    }
    if (this.comboDisplayTimer > 0) this.comboDisplayTimer -= dt;

    // Wave announcement decay
    if (this.waveAnnounceTimer > 0) this.waveAnnounceTimer -= dt;

    // Camera parallax offset
    this.camOX = (this.shipX - this.W / 2) * 0.1;
    this.camOY = (this.shipY - this.H / 2) * 0.1;

    // Screen shake decay
    if (this.shakeIntensity > 0) {
      this.shakeX = (Math.random() - 0.5) * this.shakeIntensity * 2;
      this.shakeY = (Math.random() - 0.5) * this.shakeIntensity * 2;
      this.shakeIntensity *= 0.88;
      if (this.shakeIntensity < 0.2) {
        this.shakeIntensity = 0;
        this.shakeX = 0;
        this.shakeY = 0;
      }
    }

    // Move lasers
    for (const l of this.lasers) {
      if (!l.active) continue;
      l.x += l.vx * dt;
      l.y += l.vy * dt;
      l.life -= dt;
      if (l.life <= 0 || l.x < -10 || l.x > this.W + 10 || l.y < -10 || l.y > this.H + 10) {
        l.active = false;
      }
    }

    // Move asteroids with edge wrapping
    for (const a of this.asteroids) {
      if (!a.active) continue;
      a.x += a.vx * dt;
      a.y += a.vy * dt;
      a.rot += a.rotSpeed * dt;
      const r = ASTEROID_TIERS[a.tier].radius;
      a.x = wrap(a.x + r, this.W + r * 2) - r;
      a.y = wrap(a.y + r, this.H + r * 2) - r;
    }

    // Move particles
    for (const p of this.particles) {
      if (!p.active) continue;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vx *= 0.97;
      p.vy *= 0.97;
      p.life -= dt;
      if (p.life <= 0) p.active = false;
    }

    // Power-up lifetime
    for (const pu of this.powerups) {
      if (!pu.active) continue;
      pu.life -= dt;
      if (pu.life <= 0) pu.active = false;
    }

    // Ship picks up power-ups
    if (this.shipAlive) {
      for (const pu of this.powerups) {
        if (!pu.active) continue;
        if (dist(this.shipX, this.shipY, pu.x, pu.y) < POWERUP_RADIUS + HIT_RADIUS_SHIP) {
          pu.active = false;
          playPickup();
          this.spawnParticles(pu.x, pu.y, 6,
            pu.kind === 'shield' ? COL_SHIELD : pu.kind === 'rapidfire' ? COL_RAPIDFIRE : COL_BOMB,
            25);
          switch (pu.kind) {
            case 'shield': this.shieldTimer = SHIELD_DURATION; break;
            case 'rapidfire': this.rapidfireTimer = RAPIDFIRE_DURATION; break;
            case 'bomb': this.activateBomb(); break;
          }
        }
      }
    }

    // Laser vs near-layer asteroid collisions
    for (const l of this.lasers) {
      if (!l.active) continue;
      for (const a of this.asteroids) {
        if (!a.active || a.layer !== 2) continue;
        if (dist(l.x, l.y, a.x, a.y) < ASTEROID_TIERS[a.tier].radius) {
          l.active = false;
          this.destroyAsteroid(a);
          break;
        }
      }
    }

    // Ship vs near-layer asteroid collisions
    if (this.shipAlive && this.invulnTimer <= 0) {
      for (const a of this.asteroids) {
        if (!a.active || a.layer !== 2) continue;
        if (dist(this.shipX, this.shipY, a.x, a.y) < ASTEROID_TIERS[a.tier].radius + HIT_RADIUS_SHIP) {
          this.shipHit();
          this.destroyAsteroid(a);
          break;
        }
      }
    }

    // Cleanup dead entities
    this.lasers = this.lasers.filter((l) => l.active);
    this.asteroids = this.asteroids.filter((a) => a.active);
    this.particles = this.particles.filter((p) => p.active);
    this.powerups = this.powerups.filter((pu) => pu.active);

  }

  // --- Draw ---

  private draw(dt: number): void {
    drawBackground(this.ctx, this.W, this.H);

    // Apply screen shake
    this.ctx.save();
    this.ctx.translate(this.shakeX, this.shakeY);

    // Stars and asteroids, back to front
    drawStars(this.ctx, this.stars, dt, 0, this.camOX, this.camOY, this.W, this.H);
    drawAsteroidLayer(this.ctx, this.asteroids, 0, this.camOX, this.camOY);
    drawStars(this.ctx, this.stars, dt, 1, this.camOX, this.camOY, this.W, this.H);
    drawAsteroidLayer(this.ctx, this.asteroids, 1, this.camOX, this.camOY);
    drawAsteroidLayer(this.ctx, this.asteroids, 2, this.camOX, this.camOY);

    drawLasers(this.ctx, this.lasers);
    drawPowerUps(this.ctx, this.powerups, this.totalTime);
    drawParticles(this.ctx, this.particles);

    // Ship
    if (this.shipAlive) {
      const show = this.invulnTimer <= 0 || Math.floor(this.invulnTimer * 10) % 2 === 0;
      if (show) drawShip(this.ctx, this.shipX, this.shipY, this.shipAngle, this.totalTime);
      if (this.shieldTimer > 0) drawShieldEffect(this.ctx, this.shipX, this.shipY, this.totalTime);
    }

    this.ctx.restore();

    // HUD drawn without shake
    drawHud(
      this.ctx, this.W, this.H,
      this.score, this.lives, this.difficulty,
      this.totalTime,
    );
    drawActivePowerUps(this.ctx, this.W, this.shieldTimer, this.rapidfireTimer);
    drawCombo(this.ctx, this.W, this.comboCount, this.comboDisplayTimer, this.lastComboScore);

    // Wave announcement
    if (this.waveAnnounceTimer > 0) {
      drawWaveAnnounce(this.ctx, this.W, this.H, this.waveAnnounceLevel, this.waveAnnounceTimer);
    }

    // Game over overlay
    if (this.gameOver) {
      drawGameOver(
        this.ctx, this.W, this.H,
        this.score,
        this.input.initials, this.input.isInInitialsMode, this.scoreSubmitted,
        this.leaderboard, this.totalTime,
      );
    }
  }
}
