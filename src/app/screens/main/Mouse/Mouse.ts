import { Sprite, Container, Assets } from "pixi.js";

export class Mouse extends Container {
  private bodyParts: Record<string, Sprite> = {};
  private readonly texturePaths: Record<string, string> = {
    body: "main/mouse.png",
  };
  private readyPromise: Promise<void>;

  // private tailAngle: number = 0;
  // private tailSpeed: number = 0.05;
  // private tailAmplitude: number = 10;

  private isMoving: boolean = false;
  private lastX: number = 0;
  private lastY: number = 0;
  private targetRotation: number = 0;
  private rotationSpeed: number = 0.1; 

  constructor() {
    super();

    this.bodyParts = {
      body: new Sprite(),
      // tail: new Sprite(),
    };

    this.readyPromise = this.loadTextures();
    this.setupDisplayHierarchy();

    this.lastX = this.x;
    this.lastY = this.y;
  }

  private async loadTextures(): Promise<void> {
    try {
      // Загружаем текстуры один раз, где возможно
      const [body] = await Promise.all([
        Assets.load(this.texturePaths.body),
        // Assets.load(this.texturePaths.tail),
      ]);

      // Применяем текстуры
      this.bodyParts.body.texture = body;
      // this.bodyParts.tail.texture = tail;

      this.draw();
      console.log("Mouse textures loaded");
    } catch (err) {
      console.error("Failed to load mouse textures", err);
    }
  }

  public async waitForTextures() {
    await this.readyPromise;
  }

  private setupDisplayHierarchy(): void {
    const { body } = this.bodyParts;
    this.addChild(body);
  }

  private async draw() {
    const { body } = this.bodyParts;
    body.anchor.set(0.5, 0.5);
    body.position.set(0, 0);
  }

  public startMoving() {
    this.isMoving = true;
  }

  public stopMoving() {
    this.isMoving = false;
  }

  public update(deltaTime: number) {
    // Skip if not moving
    if (!this.isMoving || (this.x === this.lastX && this.y === this.lastY)) {
      return;
    }

    const dx = this.x - this.lastX;
    const dy = this.y - this.lastY;

    if (dx !== 0 || dy !== 0) {
      // Calculate target angle in radians
      this.targetRotation = Math.atan2(dy, dx);
    }

    // Smoothly interpolate rotation
    const angleDifference = this.targetRotation - this.rotation;

    // Normalize angle difference to [-π, π]
    const normalizedDelta = ((angleDifference + Math.PI) % (2 * Math.PI)) - Math.PI;

    // Apply rotation increment based on speed
    this.rotation += normalizedDelta * this.rotationSpeed;

    // Update last position
    this.lastX = this.x;
    this.lastY = this.y;
  }

}
