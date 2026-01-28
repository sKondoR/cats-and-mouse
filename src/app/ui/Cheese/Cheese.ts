import { Sprite, Container, Assets } from "pixi.js";

export class Cheese extends Container {
  private cheeseParts: Record<string, Sprite> = {};
  private readonly texturePaths: Record<string, string> = {
    cheese: "main/cheese.png",
  };
  private readyPromise: Promise<void>;

  // private isMoving: boolean = false;

  constructor() {
    super();

    this.cheeseParts = {
      cheese: new Sprite(),
    };

    this.readyPromise = this.loadTextures();
    this.setupDisplayHierarchy();
  }

  private async loadTextures(): Promise<void> {
    try {
      // Загружаем текстуры один раз, где возможно
      const [cheese] = await Promise.all([
        Assets.load(this.texturePaths.cheese),
      ]);

      // Применяем текстуры
      this.cheeseParts.cheese.texture = cheese;

      this.draw(); // Позиционирование после загрузки
      console.log("Cheese textures loaded");
    } catch (err) {
      console.error("Failed to load Cheese textures", err);
      // Сохраняем работоспособность, даже если текстуры не загрузились
    }
  }

  public async waitForTextures() {
    await this.readyPromise;
  }

  private setupDisplayHierarchy(): void {
    const { cheese } =
      this.cheeseParts;
    this.addChild(cheese);
  }

  private async draw() {
    const { cheese } =
      this.cheeseParts;
    cheese.position.set(0, 0);
  }

  public startMoving() {
    // this.isMoving = true;
  }

  public stopMoving() {
    // this.isMoving = false;
    this.cheeseParts.cheese.rotation = 0;
  }
}
