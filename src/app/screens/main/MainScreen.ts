import { animate } from "motion";
import {
  Container,
  FederatedPointerEvent,
  Graphics,
  Rectangle,
  Text,
} from "pixi.js";

import { engine } from "../../getEngine";
import { SpeedControl } from "../../ui/SpeedControl/SpeedControl";
import { FollowModeButton } from "../../ui/FollowModeButton/FollowModeButton";
import { CatBasik } from "../../ui/CatBasik/CatBasik";
import { Carpet } from "../../ui/Carpet/Carpet";
import { Mouse } from "../../ui/Mouse/Mouse";
import { KeyboardController } from "../../core/input/KeyboardController";

export class MainScreen extends Container {
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

  private lastSpacePressed = false;

  private moveSpeed = 3;
  private catBaseScale = 0.7;

  private isMoving: boolean = false;
  private tickerCallback: () => void;
  private keyboard = new KeyboardController();

  private targetX: number = 0;
  private targetY: number = 0;
  private followMouseMode: boolean = false;
  private catchText: Text;

  constructor() {
    super();

    // Инициализация ковра
    this.carpet = new Carpet();
    this.carpet.alpha = 0;
    this.addChild(this.carpet);
    this.readyPromise = this.carpet.load().then(() => {
      this.resizeCarpet();
    });

    // Основной контейнер с центрированием
    this.mainContainer = new Container();
    this.addChild(this.mainContainer);

    this.mainContainer.eventMode = "static";
    this.mainContainer.hitArea = null;
    this.mainContainer.on("pointermove", this.handlePointerMove, this);

    // Кот
    this.cat = new CatBasik();
    this.cat.scale.set(this.catBaseScale);
    this.mainContainer.addChild(this.cat);

    // Мышь (невидима до активации)
    this.mouse = new Mouse();
    this.mouse.scale.set(this.catBaseScale);
    this.mainContainer.addChild(this.mouse);

    // Графика границы и линии земли
    this.borderGraphic = new Graphics();
    this.addChild(this.borderGraphic);

    this.groundLine = new Graphics();
    this.groundLine.alpha = 0.5;
    this.mainContainer.addChild(this.groundLine);

    // Кнопка режима преследования мыши
    this.followModeButton = new FollowModeButton();
    this.addChild(this.followModeButton);
    this.followModeButton.on("toggle", this.handleFollowModeToggle, this);

    // Текст "поймал!"
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
    this.speedControl.on("speedChange", (newSpeed: number) => {
      this.moveSpeed = newSpeed;
    });

    // Обновление — оптимизировано как стрелочная функция
    this.tickerCallback = () => this.update();
  }

  /**
   * Загружает ресурсы, связанные с экраном.
   */
  public async loadTextures(): Promise<void> {
    await this.readyPromise;
  }

  /**
   * Обработчик движения курсора — перемещает цель для кота в режиме слежения.
   */
  private handlePointerMove(event: FederatedPointerEvent): void {
    if (!this.followMouseMode) return;

    this.targetX = event.global.x - this.mainContainer.x;
    this.targetY = event.global.y - this.mainContainer.y;

    this.mouse.setTarget(this.targetX, this.targetY);
    this.mouse.alpha = 1;
    this.mouse.startMoving();
  }

  /**
   * Обработчик переключения режима слежения за мышью.
   */
  private handleFollowModeToggle(isActive: boolean): void {
    const screenWidth = engine().screen.width;
    this.followMouseMode = isActive;
    this.followModeButton.setActive(isActive);

    if (isActive) {
      this.isMoving = false;
      this.keyboard.stop();
      this.cat.stopMoving();

      this.cat.position.set(-screenWidth * 0.25, 0);
      this.mouse.position.set(screenWidth * 0.25, 0);
    } else {
      this.keyboard.start();
      this.mouse.stopMoving();
    }
  }

  /**
   * Подготавливает экран к работе: добавляет слушатели клавиатуры.
   */
  public prepare(): void {
    this.keyboard.start();
  }

  /**
   * Сбрасывает состояние экрана: удаляет слушатели и тикер.
   */
  public reset(): void {
    this.keyboard.stop();
    engine().ticker.remove(this.tickerCallback);
  }

  /**
   * Основной метод обновления логики на каждом кадре.
   */
  public update(): void {
    const deltaTime = 1; // Можно заменить на engine().ticker.deltaMS / 16.6, если нужна точность
    this.handleKeyActions();

    if (this.followMouseMode) {
      this.updateCatMovementToMouse(deltaTime);
    } else {
      this.updateCatWithKeyboard();
    }

    this.cat.update(deltaTime);
    this.mouse.update(deltaTime);
  }

  /**
   * Обновляет движение кота к позиции мыши.
   */
  private updateCatMovementToMouse(deltaTime: number): void {
    const mouseX = this.mouse.x;
    const mouseY = this.mouse.y;

    const headOffset = 90;
    const facingRight = this.cat.scale.x > 0;
    const headX = this.cat.x + (facingRight ? headOffset : -headOffset);
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

      // Поворот кота
      const newScaleX =
        Math.cos(angle) < 0 ? -this.catBaseScale : this.catBaseScale;
      if (this.cat.scale.x !== newScaleX) {
        this.cat.scale.x = newScaleX;
      }

      if (!this.isMoving) {
        this.isMoving = true;
        this.cat.startMoving();
      }

      this.catchText.alpha = 0;
    } else {
      if (this.isMoving) {
        this.isMoving = false;
        this.cat.stopMoving();
      }

      if (this.followMouseMode) {
        this.showCatchMessage();
        this.handleFollowModeToggle(false);
        // this.cat.position.set(-this.mainContainer.width * 0.25, 0);
        // this.mouse.position.set(this.mainContainer.width * 0.75, 0);
      }
    }
  }

  /**
   * Анимирует сообщение "поймал!".
   */
  private showCatchMessage(): void {
    this.catchText.position.set(this.cat.x, this.cat.y - 50);
    this.catchText.alpha = 0;

    animate(
      this.catchText,
      { alpha: 1, y: this.catchText.y - 10 },
      { duration: 0.3, ease: "easeOut" },
    ).finished.then(() => {
      setTimeout(() => {
        animate(this.catchText, { alpha: 0 }, { duration: 0.5 }).finished.then(
          () => {
            this.catchText.y = this.cat.y - 50;
          },
        );
      }, 3000);
    });
  }

  private updateCatMoving(): void {
    if (!this.isMoving) {
      this.isMoving = true;
      this.cat.startMoving();
    }
  }

  /**
   * Обновляет движение кота по клавишам стрелок.
   */
  private updateCatWithKeyboard(): void {
    let dx = 0;
    let dy = 0;

    if (this.keyboard.isPressed("ArrowLeft")) dx -= this.moveSpeed;
    if (this.keyboard.isPressed("ArrowRight")) dx += this.moveSpeed;
    if (this.keyboard.isPressed("ArrowUp")) dy -= this.moveSpeed;
    if (this.keyboard.isPressed("ArrowDown")) dy += this.moveSpeed;

    if (dx !== 0) {
      this.cat.x += dx;
      this.updateCatMoving();

      // Поворот
      if (dx < 0 && this.cat.scale.x > 0) {
        this.cat.scale.x = -this.catBaseScale;
      } else if (dx > 0 && this.cat.scale.x < 0) {
        this.cat.scale.x = this.catBaseScale;
      }
    }

    if (dy !== 0) {
      this.cat.y += dy;
      this.updateCatMoving();
    }

    if (this.isMoving && !dx && !dy) {
      this.isMoving = false;
      this.cat.stopMoving();
    }
  }

  private handleKeyActions(): void {
    // Переключение режима мыши
    const spacePressed = this.keyboard.isPressed(" ");
    if (spacePressed && !this.lastSpacePressed) {
      console.log("here", !this.followMouseMode);
      this.handleFollowModeToggle(!this.followMouseMode);
    }
    this.lastSpacePressed = spacePressed;
  }

  /**
   * Изменяет размеры элементов при изменении окна.
   */
  public resize(width: number, height: number): void {
    const centerX = width * 0.5;
    const centerY = height * 0.5;

    this.mainContainer.position.set(centerX, centerY);
    this.mainContainer.hitArea = new Rectangle(
      -centerX,
      -centerY,
      width,
      height,
    );

    this.cat.position.set(-width * 0.25, 0);
    this.mouse.position.set(width * 0.25, 0);

    this.followModeButton.resize(width);
    this.speedControl.resize(width);
    this.resizeCarpet();

    // Обновление графики границы
    this.borderGraphic.clear();
    this.borderGraphic
      .rect(0, 0, width, height)
      .stroke({ width: 80, color: "#887849" });
  }

  /**
   * Корректно изменяет размер ковра.
   */
  private resizeCarpet(): void {
    if (!this.carpet.texture) return;
    this.carpet.resize(engine().screen.width, engine().screen.height);
  }

  /**
   * Анимация появления экрана.
   */
  public async show(): Promise<void> {
    engine().audio.bgm.play("main/sounds/bgm-main.mp3", { volume: 0.5 });

    this.cat.alpha = 0;
    this.mouse.alpha = 0;
    const animation = animate(
      this.cat,
      { alpha: 1 },
      { duration: 0.3, delay: 0.75, ease: "backOut" },
    );
    await animation.finished;
    const animation2 = animate(
      this.mouse,
      { alpha: 1 },
      { duration: 0.3, delay: 0.75, ease: "backOut" },
    );
    await animation2.finished;

    engine().ticker.add(this.tickerCallback);
    animate(this.carpet, { alpha: 0.2 }, { duration: 0.1, ease: "linear" });
  }

  /**
   * Скрытие экрана — останавливает тикер.
   */
  public async hide(): Promise<void> {
    engine().ticker.remove(this.tickerCallback);
  }
}
