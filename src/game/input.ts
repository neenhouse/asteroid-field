import { SCALE } from './types';

export class InputManager {
  mouseX: number;
  mouseY: number;
  mouseDown = false;
  private _clicked = false;
  private _resetRequested = false;

  constructor(w: number, h: number) {
    this.mouseX = w / 2;
    this.mouseY = h / 2;

    window.addEventListener('mousemove', this.onMouseMove);
    window.addEventListener('mousedown', this.onMouseDown);
    window.addEventListener('mouseup', this.onMouseUp);
    window.addEventListener('touchmove', this.onTouchMove, { passive: false });
    window.addEventListener('touchstart', this.onTouchStart, { passive: false });
    window.addEventListener('touchend', this.onTouchEnd);
    window.addEventListener('keydown', this.onKeyDown);
  }

  private screenToArt(sx: number, sy: number) {
    return { ax: sx / SCALE, ay: sy / SCALE };
  }

  private onMouseMove = (e: MouseEvent) => {
    const { ax, ay } = this.screenToArt(e.clientX, e.clientY);
    this.mouseX = ax;
    this.mouseY = ay;
  };

  private onMouseDown = (e: MouseEvent) => {
    const { ax, ay } = this.screenToArt(e.clientX, e.clientY);
    this.mouseX = ax;
    this.mouseY = ay;
    this.mouseDown = true;
    this._clicked = true;
  };

  private onMouseUp = () => {
    this.mouseDown = false;
  };

  private onTouchMove = (e: TouchEvent) => {
    e.preventDefault();
    const t = e.touches[0];
    const { ax, ay } = this.screenToArt(t.clientX, t.clientY);
    this.mouseX = ax;
    this.mouseY = ay;
  };

  private onTouchStart = (e: TouchEvent) => {
    e.preventDefault();
    const t = e.touches[0];
    const { ax, ay } = this.screenToArt(t.clientX, t.clientY);
    this.mouseX = ax;
    this.mouseY = ay;
    this.mouseDown = true;
    this._clicked = true;
  };

  private onTouchEnd = () => {
    this.mouseDown = false;
  };

  private onKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'r' || e.key === 'R') this._resetRequested = true;
  };

  get clicked(): boolean {
    return this._clicked;
  }

  get resetRequested(): boolean {
    return this._resetRequested;
  }

  clearFrame(): void {
    this._clicked = false;
    this._resetRequested = false;
  }

  destroy(): void {
    window.removeEventListener('mousemove', this.onMouseMove);
    window.removeEventListener('mousedown', this.onMouseDown);
    window.removeEventListener('mouseup', this.onMouseUp);
    window.removeEventListener('touchmove', this.onTouchMove);
    window.removeEventListener('touchstart', this.onTouchStart);
    window.removeEventListener('touchend', this.onTouchEnd);
    window.removeEventListener('keydown', this.onKeyDown);
  }
}
