import { Sprite, Container, Assets } from "pixi.js";

export class Mouse extends Container {
  private bodyParts: Record<string, Sprite> = {};
  private readonly texturePaths: Record<string, string> = {
    body: "/main/mouse.png",
  };
  private readyPromise: Promise<void>;

  // private tailAngle: number = 0;
  // private tailSpeed: number = 0.05;
  // private tailAmplitude: number = 10;

  private isMoving: boolean = false;
  private rotationSpeed: number = 0.1;

  private targetX: number = 0;
  private targetY: number = 0;
  private moveSpeed: number = 5;

  constructor() {
    super();

    this.bodyParts = {
      body: new Sprite(),
      // tail: new Sprite(),
    };

    this.readyPromise = this.loadTextures();
    this.setupDisplayHierarchy();

    this.targetX = this.x;
    this.targetY = this.y;
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

  public setTarget(x: number, y: number): void {
    this.targetX = x;
    this.targetY = y;
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
    if (!this.isMoving) return;

    // Smoothly move towards target
    const dx = this.targetX - this.x;
    const dy = this.targetY - this.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    // Stop if very close to target
    if (distance > 1) {
      const angle = Math.atan2(dy, dx);
      const speed = this.moveSpeed * deltaTime;

      this.x += Math.cos(angle) * speed;
      this.y += Math.sin(angle) * speed;

      // Update rotation to face direction of movement
      const angleDifference = angle - this.rotation;
      const normalizedDelta =
        ((angleDifference + Math.PI) % (2 * Math.PI)) - Math.PI;
      this.rotation += normalizedDelta * this.rotationSpeed;
    }
  }
}
