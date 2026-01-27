import { animate } from "motion";
import { Container, Graphics, Rectangle, Text } from "pixi.js";

import { engine } from "../../getEngine";
import { SpeedControl } from "./SpeedControl/SpeedControl";
import { FollowModeButton } from "./FollowModeButton/FollowModeButton";
import { CatBasik } from "./CatBasik/CatBasik";
import { Carpet } from "./Carpet/Carpet";
import { Mouse } from "./Mouse/Mouse";


export class MainScreen extends Container {
  // private textures: Record<string, Sprite> = {};
  // private readonly texturePaths: Record<string, string> = {
  //   carpet: "main/carpet.png",
  // };
  // private readyPromise: Promise<void>;

  public static assetBundles = ["main"];
  public mainContainer: Container;
  private cat: CatBasik;
  private mouse: Mouse;
  private groundLine: Graphics;
  private followModeButton: FollowModeButton;
  private speedControl: SpeedControl;
  private borderGraphic: Graphics;
  private carpet: Carpet;
  private readyPromise: Promise<void>;

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
  private catchText: Text;

  constructor() {
    super();

    this.carpet = new Carpet();
    this.carpet.alpha = 0;
    this.addChild(this.carpet);
    this.readyPromise = this.carpet.load().then(() => {
      this.resizeCarpet();
    });

    this.mainContainer = new Container();
    this.addChild(this.mainContainer);

    this.mainContainer.eventMode = "static";
    this.mainContainer.hitArea = null;
    this.mainContainer.on("pointermove", this.handlePointerMove);

    this.cat = new CatBasik();
    this.cat.scale.set(this.catBaseScale);
    this.mainContainer.addChild(this.cat);
    this.cat.position.y = this.groundY;

    this.mouse = new Mouse();
    this.mouse.alpha = 0;
    this.mouse.scale.set(this.catBaseScale);
    this.mainContainer.addChild(this.mouse);

    const border = new Graphics();
    this.addChild(border);
    this.borderGraphic = border;


    this.groundLine = new Graphics();
    this.groundLine.alpha = 0.5;
    this.mainContainer.addChild(this.groundLine);

    // Кнопка режима
    this.followModeButton = new FollowModeButton();
    this.addChild(this.followModeButton);
    this.followModeButton.on("toggle", (isActive: boolean) => {
      this.mouse.x = this.mainContainer.x;
      this.mouse.y = this.mainContainer.y;
      this.cat.x = 0;
      this.cat.y = 0;
      this.followMouseMode = isActive;
      if (this.followMouseMode) {
        this.isMoving = false;
        this.cat.stopMoving();
      }
    });

    this.catchText = new Text("поймал!", {
      fontFamily: "Arial",
      fontSize: 60,
      fill: "#333333",
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

  private async loadTextures(): Promise<void> {
    await this.readyPromise;
  }

  private handlePointerMove = (event: any) => {
    if (this.followMouseMode) {
      this.targetX = event.global.x - this.mainContainer.x;
      this.targetY = event.global.y - this.mainContainer.y;
      
      this.mouse.setTarget(this.targetX, this.targetY);
      this.mouse.alpha = 1;
      this.mouse.startMoving();
      // console.log('event.global.y: ', event.global.y);
      // toDO: mouse's holes
      // if(event.global.y < 5) {
      //   this.targetY = this.mainContainer.height;
      //   this.updateCursorDot(event.global.x, this.mainContainer.height);
      // }
      
    }
  };

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
      this.updateCatMovementToMouse(deltaTime);
    } else {
      this.updateCatWithKeyboard(deltaTime);
    }

    this.cat.update(deltaTime); // Внутренняя анимация кота (ноги, хвост)
    this.mouse.update(deltaTime);
  }

  private updateCatMovementToMouse(deltaTime: number) {
    // Use the actual position of the mouse character
    const mouseX = this.mouse.x;
    const mouseY = this.mouse.y;

    const headOffset = 90;
    const facingRight = this.cat.scale.x > 0;
    const headX = this.cat.x + (facingRight ? headOffset : -headOffset);
    const headY = this.cat.y;

    const dx = mouseX - headX;
    const dy = mouseY - headY;
    const distance = Math.sqrt(dx * dx + dy * dy);

    // Stop close to the mouse (e.g., within 30px)
    const stoppingDistance = 30;
    if (distance > stoppingDistance) {
      const angle = Math.atan2(dy, dx);
      const speed = this.moveSpeed * deltaTime;
      this.cat.x += Math.cos(angle) * speed;
      this.cat.y += Math.sin(angle) * speed;

      // Flip cat based on direction
      if (Math.cos(angle) < 0) {
        this.cat.scale.x = -(this.catBaseScale);
      } else {
        this.cat.scale.x = this.catBaseScale;
      }

      if (!this.isMoving) {
        this.isMoving = true;
        this.cat.startMoving();
      }

      this.catchText.alpha = 0; // Hide catch text while moving
    } else {
      if (this.isMoving) {
        this.isMoving = false;
        this.cat.stopMoving();
      }

      // Cat caught the mouse!
      if (this.followMouseMode) {
        this.showCatchMessage();
        this.followMouseMode = false;
        this.followModeButton.setActive(false);
        this.mouse.stopMoving();  
        // this.mouse.alpha = 0; // Optional: hide mouse after caught
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
      case " ":
        event.preventDefault();
        this.followModeButton.emit("toggle", !this.followMouseMode);
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

  private resizeCarpet() {
    if (!this.carpet.texture) return;
    this.carpet.resize(engine().screen.width, engine().screen.height);
  }

  public resize(width: number, height: number) {
    const centerX = width * 0.5;
    const centerY = height * 0.5;

    this.mainContainer.x = centerX;
    this.mainContainer.y = centerY;

    this.mainContainer.hitArea = new Rectangle(-centerX, -centerY, width, height);
    this.followModeButton.resize(width, height);
    this.resizeCarpet();

    this.borderGraphic.clear();
    this.borderGraphic.rect(0, 0, width, height)
     .stroke({
        width: 80,
        color: '#887849',
      });
    this.borderGraphic.alpha = 1;
  }

  public async show(): Promise<void> {
    engine().audio.bgm.play("main/sounds/bgm-main.mp3", { volume: 0.5 });

    this.cat.alpha = 0;
    const animation = animate(this.cat, { alpha: 1 }, { duration: 0.3, delay: 0.75, ease: "backOut" });
    await animation.finished;

    engine().ticker.add(this.tickerCallback);

    animate(this.carpet, { alpha: 0.2 }, { duration: 0.1, ease: "linear" });
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

