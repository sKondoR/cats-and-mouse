import { Sprite, Container, Assets } from "pixi.js";

export class CatBasik extends Container {
  private bodyParts: Record<string, Sprite> = {};
  private readonly texturePaths: Record<string, string> = {
    head: "/main/cat-basik/head.png",
    body: "/main/cat-basik/body.png",
    tail: "/main/cat-basik/tail.png",
    arm: "/main/cat-basik/arm.png",
    leg: "/main/cat-basik/leg.png",
  };
  private readyPromise: Promise<void>;

  private tailAngle: number = 0;
  private tailSpeed: number = 0.05;
  private tailAmplitude: number = 10;

  private isMoving: boolean = false;
  private legAnimationOffset: number = 0;

  constructor() {
    super();

    this.bodyParts = {
      head: new Sprite(),
      body: new Sprite(),
      tail: new Sprite(),
      leftArm: new Sprite(),
      rightArm: new Sprite(),
      leftLeg: new Sprite(),
      rightLeg: new Sprite(),
    };

    this.readyPromise = this.loadTextures();
    this.setupDisplayHierarchy();
  }

  private async loadTextures(): Promise<void> {
    try {
      // Загружаем текстуры один раз, где возможно
      const [head, body, tail, arm, leg] = await Promise.all([
        Assets.load(this.texturePaths.head),
        Assets.load(this.texturePaths.body),
        Assets.load(this.texturePaths.tail),
        Assets.load(this.texturePaths.arm),
        Assets.load(this.texturePaths.leg),
      ]);

      // Применяем текстуры
      this.bodyParts.head.texture = head;
      this.bodyParts.body.texture = body;
      this.bodyParts.tail.texture = tail;
      this.bodyParts.leftArm.texture = arm;
      this.bodyParts.rightArm.texture = arm;
      this.bodyParts.leftLeg.texture = leg;
      this.bodyParts.rightLeg.texture = leg;

      this.draw(); // Позиционирование после загрузки
      console.log("Cat textures loaded");
    } catch (err) {
      console.error("Failed to load cat textures", err);
      // Сохраняем работоспособность, даже если текстуры не загрузились
    }
  }

  public async waitForTextures() {
    await this.readyPromise;
  }

  private setupDisplayHierarchy(): void {
    const { tail, rightArm, leftLeg, rightLeg, body, leftArm, head } =
      this.bodyParts;
    this.addChild(tail, rightArm, leftLeg, rightLeg, body, leftArm, head);
  }

  private async draw() {
    const { head, body, tail, leftArm, rightArm, leftLeg, rightLeg } =
      this.bodyParts;

    head.position.set(-20, -140);
    body.position.set(0, 0);
    tail.position.set(20, 170);
    tail.anchor.set(0.7, 0.5);

    leftArm.position.set(130, 80);
    leftArm.rotation = Math.PI / 1.5;
    rightArm.position.set(230, 25);
    rightArm.rotation = Math.PI / 2.2;

    leftLeg.position.set(10, 190);
    rightLeg.position.set(90, 190);
  }

  public startMoving() {
    this.isMoving = true;
  }

  public stopMoving() {
    this.isMoving = false;
    this.bodyParts.leftLeg.rotation = 0;
    this.bodyParts.rightLeg.rotation = 0;
  }

  public update(deltaTime: number) {
    // Анимация хвоста
    this.tailAngle += this.tailSpeed;
    this.bodyParts.tail.rotation =
      Math.sin(this.tailAngle) * ((this.tailAmplitude * Math.PI) / 180);

    // Анимация ног при движении
    if (this.isMoving) {
      this.legAnimationOffset += 0.05 * deltaTime;

      const swingAmount = 0.1;
      this.bodyParts.leftLeg.rotation =
        Math.sin(this.legAnimationOffset) * swingAmount;
      this.bodyParts.rightLeg.rotation =
        Math.sin(this.legAnimationOffset + Math.PI) * swingAmount;
    }
  }
}
