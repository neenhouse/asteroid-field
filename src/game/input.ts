const GAME_KEYS = new Set([
  'Space',
  'ArrowUp',
  'ArrowDown',
  'ArrowLeft',
  'ArrowRight',
  'KeyW',
  'KeyA',
  'KeyS',
  'KeyD',
]);

export class InputManager {
  private held = new Set<string>();
  private pressed = new Set<string>();

  // Touch state
  private joystickId: number | null = null;
  private joystickOrigin: { x: number; y: number } | null = null;
  private virtualDx = 0;
  private virtualDy = 0;
  private virtualFire = false;
  private virtualTapped = false;

  private onKeyDown = (e: KeyboardEvent) => {
    if (GAME_KEYS.has(e.code)) e.preventDefault();
    if (!this.held.has(e.code)) this.pressed.add(e.code);
    this.held.add(e.code);
  };

  private onKeyUp = (e: KeyboardEvent) => {
    this.held.delete(e.code);
  };

  private onTouchStart = (e: TouchEvent) => {
    e.preventDefault();
    this.virtualTapped = true;
    const midX = window.innerWidth / 2;
    for (let i = 0; i < e.changedTouches.length; i++) {
      const t = e.changedTouches[i];
      if (t.clientX < midX && this.joystickId === null) {
        this.joystickId = t.identifier;
        this.joystickOrigin = { x: t.clientX, y: t.clientY };
      } else if (t.clientX >= midX) {
        this.virtualFire = true;
      }
    }
  };

  private onTouchMove = (e: TouchEvent) => {
    e.preventDefault();
    for (let i = 0; i < e.changedTouches.length; i++) {
      const t = e.changedTouches[i];
      if (t.identifier === this.joystickId && this.joystickOrigin) {
        const dx = t.clientX - this.joystickOrigin.x;
        const dy = t.clientY - this.joystickOrigin.y;
        const dead = 10;
        const max = 50;
        this.virtualDx = Math.abs(dx) > dead ? Math.max(-1, Math.min(1, dx / max)) : 0;
        this.virtualDy = Math.abs(dy) > dead ? Math.max(-1, Math.min(1, dy / max)) : 0;
      }
    }
  };

  private onTouchEnd = (e: TouchEvent) => {
    for (let i = 0; i < e.changedTouches.length; i++) {
      const t = e.changedTouches[i];
      if (t.identifier === this.joystickId) {
        this.joystickId = null;
        this.joystickOrigin = null;
        this.virtualDx = 0;
        this.virtualDy = 0;
      }
    }
    // Check remaining touches for fire
    let rightTouch = false;
    const midX = window.innerWidth / 2;
    for (let i = 0; i < e.touches.length; i++) {
      if (e.touches[i].clientX >= midX) {
        rightTouch = true;
        break;
      }
    }
    this.virtualFire = rightTouch;
  };

  constructor() {
    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('keyup', this.onKeyUp);
    window.addEventListener('touchstart', this.onTouchStart, { passive: false });
    window.addEventListener('touchmove', this.onTouchMove, { passive: false });
    window.addEventListener('touchend', this.onTouchEnd, { passive: false });
  }

  isDown(code: string): boolean {
    if (this.held.has(code)) return true;
    if ((code === 'ArrowLeft' || code === 'KeyA') && this.virtualDx < -0.3) return true;
    if ((code === 'ArrowRight' || code === 'KeyD') && this.virtualDx > 0.3) return true;
    if ((code === 'ArrowUp' || code === 'KeyW') && this.virtualDy < -0.3) return true;
    if ((code === 'ArrowDown' || code === 'KeyS') && this.virtualDy > 0.3) return true;
    if (code === 'Space' && this.virtualFire) return true;
    return false;
  }

  wasPressed(code: string): boolean {
    if (this.pressed.has(code)) return true;
    if (code === 'Space' && this.virtualTapped) return true;
    return false;
  }

  clearFrame(): void {
    this.pressed.clear();
    this.virtualTapped = false;
  }

  destroy(): void {
    window.removeEventListener('keydown', this.onKeyDown);
    window.removeEventListener('keyup', this.onKeyUp);
    window.removeEventListener('touchstart', this.onTouchStart);
    window.removeEventListener('touchmove', this.onTouchMove);
    window.removeEventListener('touchend', this.onTouchEnd);
  }
}
