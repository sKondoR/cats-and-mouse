import { animate } from "motion";
import { Container, Graphics, Rectangle, Sprite, Text, Texture } from "pixi.js";

import { engine } from "../../getEngine";
import { SpeedControl } from "./SpeedControl/SpeedControl";
import { CatBasik } from "./CatBasik/CatBasik";

export class MainScreen extends Container {
  public static assetBundles = ["main"];
  public mainContainer: Container;
  private cat: CatBasik;
  private groundLine: Graphics;
  private speedControl: SpeedControl;

  private moveSpeed = 3;
  private readonly jumpSpeed = 200;
  private groundY = 100;
  private catBaseScale = 0.7;

  private isMoving: boolean = false;
  private tickerCallback: () => void;
  private readonly keys: Record<string, boolean> = {
    ArrowLeft: false,
    ArrowRight: false,
  };

  private targetX: number = 0;
  private targetY: number = 0;
  private followMouseMode: boolean = false;
  private followModeButton: Graphics;
  private cursorDot: Graphics;
  private catchText: Text;

  constructor() {
    super();

    this.mainContainer = new Container();
    this.addChild(this.mainContainer);
    
    const texture = Texture.from("main/carpet");
    const carpetSprite = new Sprite(texture);

    // Scale and position to cover the entire screen
    carpetSprite.anchor.set(0.5); // Center anchor
    carpetSprite.x = 0; // Centered in mainContainer
    carpetSprite.y = 0;

    // Optional: scale to fit screen if needed
    carpetSprite.width = engine().screen.width;
    carpetSprite.height = engine().screen.height;
    this.mainContainer.addChildAt(carpetSprite, 0);

    this.mainContainer.eventMode = "static";
    this.mainContainer.hitArea = null;
    this.mainContainer.on("pointermove", this.handlePointerMove);

    this.cat = new CatBasik();
    this.cat.scale.set(this.catBaseScale);
    this.mainContainer.addChild(this.cat);
    this.cat.position.y = this.groundY;

    this.groundLine = new Graphics();
    this.groundLine.alpha = 0.5;
    this.mainContainer.addChild(this.groundLine);

    // Кнопка режима
    this.followModeButton = new Graphics();
    this.updateFollowModeButton();
    this.addChild(this.followModeButton);
    this.followModeButton.eventMode = "static";
    this.followModeButton.cursor = "pointer";
    this.followModeButton.on("pointerdown", () => {
      this.targetX = this.mainContainer.x;
      this.targetY = this.mainContainer.y;
      this.followMouseMode = !this.followMouseMode;
      this.updateFollowModeButton();
      if (this.followMouseMode) {
        // Отключаем движение с клавиатуры
        this.isMoving = false;
        this.cat.stopMoving();
      } else {
      }
    });

    const cursorDot = new Graphics();
    cursorDot.name = "cursorDot";
    this.addChild(cursorDot);
    this.cursorDot = cursorDot;

    this.catchText = new Text("поймал!", {
      fontFamily: "Arial",
      fontSize: 24,
      fill: 0xffcc00,
      fontWeight: "bold",
      align: "center",
    });
    this.catchText.anchor.set(0.5);
    this.catchText.alpha = 0;
    this.mainContainer.addChild(this.catchText);

    // Управление скоростью
    this.speedControl = new SpeedControl();
    this.addChild(this.speedControl);
    this.speedControl.resize(engine().screen.width, engine().screen.height);
    this.speedControl.on("speedChange", (newSpeed: number) => {
      this.moveSpeed = newSpeed;
    });

    this.tickerCallback = () => this.update();
  }

  private updateFollowModeButton() {
    const size = 40;
    const g = this.followModeButton;
    g.clear();

    if (this.followMouseMode) {
      g.rect(-size / 2, -size / 2, size, size).fill({ color: 0x00ff00, alpha: 0.6 });
      g.circle(0, 0, size * 0.3).fill({ color: 0x000000 });
    } else {
      g.rect(-size / 2, -size / 2, size, size).fill({ color: 0xff0000, alpha: 0.6 });
      g.moveTo(-size * 0.3, -size * 0.3)
        .lineTo(size * 0.3, size * 0.3)
        .moveTo(size * 0.3, -size * 0.3)
        .lineTo(-size * 0.3, size * 0.3)
        .stroke({ color: 0x000000, width: 3 });
    }

    this.followModeButton.position.set(
      engine().screen.width - size / 2 - 10,
      size / 2 + 10
    );
  }

  private handlePointerMove = (event: any) => {
    if (this.followMouseMode) {
      this.targetX = event.global.x - this.mainContainer.x;
      this.targetY = event.global.y - this.mainContainer.y;
      this.updateCursorDot(event.global.x, event.global.y);
      console.log('event.global.y: ', event.global.y);
      // toDO: mouse's holes
      // if(event.global.y < 5) {
      //   this.targetY = this.mainContainer.height;
      //   this.updateCursorDot(event.global.x, this.mainContainer.height);
      // }
      
    }
  };

  private updateCursorDot(x: number, y: number) {
    const dot = this.cursorDot;
    dot.clear();
    dot.circle(0, 0, 10)
      .fill({ color: 0xff0000, alpha: 0.8 })
      .stroke({ color: 0x000000, width: 1 });
    dot.position.set(x, y);
  }

  public prepare() {
    document.addEventListener("keydown", this.handleKeyDown);
    document.addEventListener("keyup", this.handleKeyUp);
  }

  public reset() {
    document.removeEventListener("keydown", this.handleKeyDown);
    document.removeEventListener("keyup", this.handleKeyUp);
    engine().ticker.remove(this.tickerCallback);
  }

  public update() {
    const deltaTime = 1; // Упрощённо. Можно использовать engine().ticker.deltaMS

    if (this.followMouseMode) {
      this.updateCatMovementToTarget(deltaTime);
    } else {
      this.updateCatWithKeyboard(deltaTime);
    }

    this.cat.update(deltaTime); // Внутренняя анимация кота (ноги, хвост)
  }

  private updateCatMovementToTarget(deltaTime: number) {
    const headOffset = 90;
    // Определяем направление взгляда кота (зависит от scale.x)
    const facingRight = this.cat.scale.x > 0;
    const headX = this.cat.x + (facingRight ? headOffset : -headOffset);
    const headY = this.cat.y; // предполагаем, что голова на той же высоте

    const dx = this.targetX - headX;
    const dy = this.targetY - headY;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance > 15) {
      const angle = Math.atan2(dy, dx);
      const speed = this.moveSpeed * deltaTime;
      this.cat.x += Math.cos(angle) * speed;
      this.cat.y += Math.sin(angle) * speed;

      // Поворот тела в сторону движения
      // this.cat.rotation = angle;

      // Масштаб для "лица" вперёд (если используется)
      if (Math.cos(angle) < 0) {
        this.cat.scale.x = -(this.catBaseScale);
      } else {
        this.cat.scale.x = this.catBaseScale;
      }

      if (!this.isMoving) {
        this.isMoving = true;
        this.cat.startMoving();
      }

      // Скрываем текст, если он был
      this.catchText.alpha = 0;
    } else {
      if (this.isMoving) {
        this.isMoving = false;
        this.cat.stopMoving();
      }

      // Кот достиг цели — "поймал!"
      if (this.followMouseMode) {
        this.showCatchMessage();
        this.followMouseMode = false;
        this.updateFollowModeButton(); // обновляем кнопку
      }
    }
  }

  private showCatchMessage() {
    this.catchText.position.set(this.cat.x, this.cat.y - 50); // над котом
    this.catchText.alpha = 0;

    // Анимация появления и исчезновения
    animate(
      this.catchText,
      { alpha: 1, y: this.catchText.y - 10 },
      { duration: 0.3, ease: "easeOut" }
    ).finished.then(() => {
      setTimeout(() => {
        animate(this.catchText, { alpha: 0 }, { duration: 0.5 }).finished.then(() => {
          this.catchText.y = this.cat.y - 50; // сброс позиции Y после анимации
        });
      }, 3000);
    });
  }

  private updateCatWithKeyboard(_deltaTime: number) {
    let dx = 0;

    if (this.keys.ArrowLeft) dx -= this.moveSpeed;
    if (this.keys.ArrowRight) dx += this.moveSpeed;

    if (dx !== 0) {
      this.cat.x += dx;

      if (!this.isMoving) {
        this.isMoving = true;
        this.cat.startMoving();
      }

      // Поворот спрайта
      if (dx < 0 && this.cat.scale.x > 0) {
        this.flipCat(-this.catBaseScale);
      } else if (dx > 0 && this.cat.scale.x < 0) {
        this.flipCat(this.catBaseScale);
      }
    } else {
      if (this.isMoving) {
        this.isMoving = false;
        this.cat.stopMoving();
      }
    }
  }

  private flipCat(targetScaleX: number) {
    animate(
      this.cat.scale,
      { x: targetScaleX },
      { duration: 0.2, ease: "easeOut" }
    );
  }

  private handleKeyDown = (event: KeyboardEvent) => {
    const { key } = event;

    if (key in this.keys) {
      this.keys[key] = true;
    }

    switch (key) {
      case "ArrowUp":
        event.preventDefault();
        this.performJump();
        return;
      case "ArrowDown":
        event.preventDefault();
        animate(this.cat, { y: this.groundY }, { duration: 0.5, ease: "easeOut" });
        return;
      default:
        return;
    }
  };

  private handleKeyUp = (event: KeyboardEvent) => {
    const { key } = event;

    if (key in this.keys) {
      this.keys[key] = false;
    }

    const anyMovementKeyPressed = ["ArrowLeft", "ArrowRight"].some((k) => this.keys[k]);
    if (!anyMovementKeyPressed && this.isMoving) {
      this.isMoving = false;
      this.cat.stopMoving();
    }
  };

  public resize(width: number, height: number) {
    const centerX = width * 0.5;
    const centerY = height * 0.5;

    this.mainContainer.x = centerX;
    this.mainContainer.y = centerY;

    this.mainContainer.hitArea = new Rectangle(-centerX, -centerY, width, height);
    this.updateFollowModeButton();
  }

  public async show(): Promise<void> {
    engine().audio.bgm.play("main/sounds/bgm-main.mp3", { volume: 0.5 });

    this.cat.alpha = 0;
    const animation = animate(this.cat, { alpha: 1 }, { duration: 0.3, delay: 0.75, ease: "backOut" });
    await animation.finished;

    engine().ticker.add(this.tickerCallback);
  }

  public async hide() {
    engine().ticker.remove(this.tickerCallback);
  }

  private performJump() {
    animate(
      this.cat,
      { y: this.cat.y - this.jumpSpeed },
      {
        duration: 0.2,
        ease: "easeOut",
        onComplete: () => {
          animate(this.cat, { y: this.groundY }, { duration: 0.25, ease: "easeIn" });
        },
      }
    );
  }
}

