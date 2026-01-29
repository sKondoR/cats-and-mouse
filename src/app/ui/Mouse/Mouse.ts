import { Sprite, Container, Assets } from "pixi.js";

export class Mouse extends Container {
  private bodyParts: Record<string, Sprite> = {};
  private readonly texturePaths: Record<string, string> = {
    arms: "main/mouse/arms.png",
    tail: "main/mouse/tail.png",
    body: "main/mouse/body.png",
  };
  private readyPromise: Promise<void>;

  // private tailAngle: number = 0;
  // private tailSpeed: number = 0.05;
  // private tailAmplitude: number = 10;

  private isMoving: boolean = false;
  private rotationSpeed: number = 0.1;
  private tailAnimationOffset: number = 0;
  private armsAnimationOffset: number = 0;

  private targetX: number = 0;
  private targetY: number = 0;
  private moveSpeed: number = 5;

  constructor() {
    super();

    this.bodyParts = {
      arms: new Sprite(),
      tail: new Sprite(),
      body: new Sprite(),
    };

    this.readyPromise = this.loadTextures();
    this.setupDisplayHierarchy();

    this.targetX = this.x;
    this.targetY = this.y;
  }

  private async loadTextures(): Promise<void> {
    try {
      // Загружаем текстуры один раз, где возможно
      const [arms, tail, body] = await Promise.all([
        Assets.load(this.texturePaths.arms),
        Assets.load(this.texturePaths.tail),
        Assets.load(this.texturePaths.body),
      ]);

      // Применяем текстуры
      this.bodyParts.arms.texture = arms;
      this.bodyParts.tail.texture = tail;
      this.bodyParts.body.texture = body;

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
    const { arms, body, tail } = this.bodyParts;
    this.addChild(arms);
    this.addChild(tail);
    this.addChild(body);
  }

  private async draw() {
    const { arms, body, tail } = this.bodyParts;
    arms.anchor.set(0.5, 0.5);
    arms.position.set(-10, 5);
    tail.anchor.set(1, 0.5);
    tail.position.set(-55, 23);
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

      const swingAmount = 0.5;
      const swingAmount2 = 0.15;
      this.tailAnimationOffset += 0.05 * deltaTime;
      this.armsAnimationOffset += 0.1 * deltaTime;
      this.bodyParts.tail.rotation =
        Math.sin(this.tailAnimationOffset) * swingAmount;
      this.bodyParts.arms.rotation =
        Math.sin(this.armsAnimationOffset) * swingAmount2;
      // Update rotation to face direction of movement
      const angleDifference = angle - this.rotation;
      const normalizedDelta =
        ((angleDifference + Math.PI) % (2 * Math.PI)) - Math.PI;
      this.rotation += normalizedDelta * this.rotationSpeed;
    }
  }
}
