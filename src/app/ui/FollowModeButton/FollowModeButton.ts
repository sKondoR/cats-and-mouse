import { Graphics } from "pixi.js";

export class FollowModeButton extends Graphics {
  private _active: boolean = false;
  private size: number = 40;

  constructor() {
    super();
    this.eventMode = "static";
    this.cursor = "pointer";
    this.on("pointerdown", this.toggle);
    this.draw();
  }

  public toggle = () => {
    this._active = !this._active;
    this.draw();
    this.emit("toggle", this._active);
  };

  public setActive(value: boolean) {
    if (this._active !== value) {
      this._active = value;
      this.draw();
    }
  }

  private draw() {
    this.clear();

    if (this._active) {
      // Active (Follow mode ON) — Green circle
      this.rect(-this.size / 2, -this.size / 2, this.size, this.size).fill({
        color: 0x00ff00,
        alpha: 0.6,
      });
      this.circle(0, 0, this.size * 0.3).fill({ color: 0x000000 });
    } else {
      // Inactive (Follow mode OFF) — Red cross
      this.rect(-this.size / 2, -this.size / 2, this.size, this.size).fill({
        color: 0xff0000,
        alpha: 0.6,
      });
      this.moveTo(-this.size * 0.3, -this.size * 0.3)
        .lineTo(this.size * 0.3, this.size * 0.3)
        .moveTo(this.size * 0.3, -this.size * 0.3)
        .lineTo(-this.size * 0.3, this.size * 0.3)
        .stroke({ color: 0x000000, width: 3 });
    }
  }

  public resize(screenWidth: number) {
    this.position.set(screenWidth - this.size / 2 - 10, this.size / 2 + 10);
  }
}
