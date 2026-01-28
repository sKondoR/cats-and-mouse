import { CatBasik } from "../ui/CatBasik/CatBasik";
import { Mouse } from "../ui/Mouse/Mouse";
import { KeyboardController } from "../core/input/KeyboardController";

export class CatMovementSystem {
  constructor(
    private cat: CatBasik,
    private mouse: Mouse,
    private moveSpeed: number,
    // private groundY: number,
    private baseScale: number,
  ) {}

  private get headX(): number {
    const offset = 90;
    return this.cat.scale.x > 0 ? this.cat.x + offset : this.cat.x - offset;
  }

  update(
    deltaTime: number,
    isFollowMode: boolean,
    keyboard: KeyboardController,
  ): void {
    if (isFollowMode) {
      this.moveToMouse(deltaTime);
    } else {
      this.moveWithKeyboard(keyboard);
    }
  }

  private moveToMouse(deltaTime: number): void {
    const { x: mouseX, y: mouseY } = this.mouse;
    const headX = this.headX;
    const headY = this.cat.y;

    const dx = mouseX - headX;
    const dy = mouseY - headY;
    const distance = Math.sqrt(dx * dx + dy * dy);

    const stoppingDistance = 30;
    if (distance > stoppingDistance) {
      const angle = Math.atan2(dy, dx);
      const speed = this.moveSpeed * deltaTime;

      this.cat.x += Math.cos(angle) * speed;
      this.cat.y += Math.sin(angle) * speed;

      const newScaleX = Math.cos(angle) < 0 ? -this.baseScale : this.baseScale;
      if (this.cat.scale.x !== newScaleX) {
        this.cat.scale.x = newScaleX;
      }

      this.cat.startMoving();
    } else {
      this.cat.stopMoving();
    }
  }

  private moveWithKeyboard(keyboard: KeyboardController): void {
    const dx =
      (keyboard.isPressed("ArrowRight") ? this.moveSpeed : 0) -
      (keyboard.isPressed("ArrowLeft") ? this.moveSpeed : 0);

    if (dx !== 0) {
      this.cat.x += dx;
      this.cat.startMoving();

      if (dx < 0 && this.cat.scale.x > 0) {
        this.cat.scale.x = -this.baseScale;
      } else if (dx > 0 && this.cat.scale.x < 0) {
        this.cat.scale.x = this.baseScale;
      }
    } else {
      this.cat.stopMoving();
    }
  }
}
