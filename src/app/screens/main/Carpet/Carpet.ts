import { Sprite, Texture } from "pixi.js";
import { Assets } from "pixi.js";

export class Carpet extends Sprite {
  private static texturePath = "/main/carpet.png";

  constructor() {
    super();
    this.texture = Texture.EMPTY;
    this.alpha = 0.5;
    this.anchor.set(0.5);
  }

  public async load(): Promise<void> {
    try {
      const texture = await Assets.load(Carpet.texturePath);
      this.texture = texture;
    } catch (err) {
      console.error("Failed to load carpet texture", err);
    }
  }

  public resize(screenWidth: number, screenHeight: number): void {
    if (!this.texture || this.texture === Texture.EMPTY) {
      this.x = screenWidth / 2;
      this.y = screenHeight / 2;
      return;
    }

    const resource = this.texture.source;
    const aspectRatio = resource.width / resource.height;
    this.height = screenHeight * 0.8;
    this.width = this.height * aspectRatio;
    this.x = screenWidth / 2;
    this.y = screenHeight / 2;
  }
}
