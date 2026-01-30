import { animate } from "motion";
import { Container, FederatedPointerEvent, Rectangle, Text } from "pixi.js";

import { engine } from "../../getEngine";
import { SpeedControl } from "../../ui/SpeedControl/SpeedControl";
import { FollowModeButton } from "../../ui/FollowModeButton/FollowModeButton";
import { CatBasik } from "../../ui/CatBasik/CatBasik";
import { Carpet } from "../../ui/Carpet/Carpet";
import { Mouse } from "../../ui/Mouse/Mouse";
import { Cheese } from "../../ui/Cheese/Cheese";
import { KeyboardController } from "../../core/input/KeyboardController";
import Border from "../../ui/Border/Border";

/**
 * Main game screen that handles cat and mouse interactions.
 * Contains game elements like cat, mouse, cheese, controls, and boundaries.
 */
export class MainScreen extends Container {
  public static assetBundles = ["main"];
  
  // Core containers
  public mainContainer: Container;
  
  // Game elements
  private cat: CatBasik;
  private mouse: Mouse;
  private cheese: Cheese;
  private carpet: Carpet;
  private border!: Border;
  
  // UI components
  private followModeButton: FollowModeButton;
  private speedControl: SpeedControl;
  private catchText: Text;
  private cheeseCountIcon: Cheese;
  private cheeseCountText: Text;
  
  // Game state
  private keyboard = new KeyboardController();
  private readyPromise: Promise<void>;
  
  // Configuration constants
  private readonly CONFIG = {
    BORDER_SIZE: 150,
    HOLE_SIZE: 150,
    MOVE_SPEED: 3,
    CAT_BASE_SCALE: 0.7,
    CHEESE_DELAY: 2500,
    HIT_RADIUS: 60,
    CHEESE_SPAWN_PADDING: 200,
    HEAD_OFFSET: 90,
    STOPPING_DISTANCE: 30,
    TELEPORT_OFFSET: 10,
    RETURN_OFFSET: 15
  };
  
  // State variables
  private isCheeseEaten: boolean = true;
  private cheeseCount: number = 0;
  private lastSpacePressed = false;
  private isMoving: boolean = false;
  private followMouseMode: boolean = false;
  private targetX: number = 0;
  private targetY: number = 0;
  
  // Ticker callback
  private tickerCallback: () => void;

  constructor() {
    super();
    
    this.initializeGameElements();
    this.setupEventListeners();
    this.setupTicker();
  }

  /**
   * Initializes all game elements and sets up the scene hierarchy.
   */
  private initializeGameElements(): void {
    // Initialize carpet
    this.carpet = new Carpet();
    this.addChild(this.carpet);
    this.readyPromise = this.carpet.load().then(() => {
      this.resizeCarpet();
    });

    // Initialize main container
    this.mainContainer = this.createMainContainer();
    this.addChild(this.mainContainer);

    // Initialize game objects
    this.border = this.createBorder();
    this.cheese = this.createCheese();
    this.cat = this.createCat();
    this.mouse = this.createMouse();
    this.catchText = this.createCatchText();
    this.cheeseCountIcon = this.createCheeseCountIcon();
    this.cheeseCountText = this.createCheeseCountText();
    
    // Initialize UI controls
    this.followModeButton = this.createFollowModeButton();
    this.speedControl = this.createSpeedControl();
  }

  /**
   * Creates and configures the main container for game elements.
   */
  private createMainContainer(): Container {
    const container = new Container();
    container.eventMode = "static";
    container.hitArea = null;
    container.sortableChildren = true;
    container.on("pointermove", this.handlePointerMove, this);
    return container;
  }

  /**
   * Creates the border element with specified dimensions.
   */
  private createBorder(): Border {
    const border = new Border(
      this.mainContainer.width,
      this.mainContainer.height,
      this.CONFIG.BORDER_SIZE,
      this.CONFIG.HOLE_SIZE
    );
    border.zIndex = 50;
    this.mainContainer.addChild(border);
    return border;
  }

  /**
   * Creates the cheese element.
   */
  private createCheese(): Cheese {
    const cheese = new Cheese();
    cheese.scale.set(this.CONFIG.CAT_BASE_SCALE);
    this.mainContainer.addChild(cheese);
    return cheese;
  }

  /**
   * Creates the cat element.
   */
  private createCat(): CatBasik {
    const cat = new CatBasik();
    cat.scale.set(this.CONFIG.CAT_BASE_SCALE);
    this.mainContainer.addChild(cat);
    return cat;
  }

  /**
   * Creates the mouse element.
   */
  private createMouse(): Mouse {
    const mouse = new Mouse();
    mouse.scale.set(this.CONFIG.CAT_BASE_SCALE);
    this.mainContainer.addChild(mouse);
    return mouse;
  }

  /**
   * Creates the "caught" text element.
   */
  private createCatchText(): Text {
    const text = new Text("поймал!", {
      fontFamily: "Arial",
      fontSize: 60,
      fill: "#333333",
      fontWeight: "bold",
      align: "center",
    });
    text.anchor.set(0.5);
    text.alpha = 0;
    this.mainContainer.addChild(text);
    return text;
  }

  /**
   * Creates the cheese count icon.
   */
  private createCheeseCountIcon(): Cheese {
    const icon = new Cheese();
    icon.zIndex = 100;
    icon.scale.set(this.CONFIG.CAT_BASE_SCALE);
    this.mainContainer.addChild(icon);
    return icon;
  }

  /**
   * Creates the cheese count text element.
   */
  private createCheeseCountText(): Text {
    const text = new Text(`${this.cheeseCount}`, {
      fontFamily: "Arial",
      fontSize: 60,
      fill: "#333333",
      fontWeight: "bold",
      align: "center",
    });
    text.zIndex = 100;
    text.anchor.set(0.5);
    this.mainContainer.addChild(text);
    return text;
  }

  /**
   * Creates the follow mode button.
   */
  private createFollowModeButton(): FollowModeButton {
    const button = new FollowModeButton();
    this.addChild(button);
    return button;
  }

  /**
   * Creates the speed control component.
   */
  private createSpeedControl(): SpeedControl {
    const control = new SpeedControl();
    this.addChild(control);
    return control;
  }

  /**
   * Sets up event listeners for UI components and game events.
   */
  private setupEventListeners(): void {
    this.followModeButton.on("toggle", this.handleFollowModeToggle, this);
    
    this.speedControl.on("speedChange", (newSpeed: number) => {
      this.updateMoveSpeed(newSpeed);
    });
  }

  /**
   * Updates the move speed of the cat.
   */
  private updateMoveSpeed(newSpeed: number): void {
    this.CONFIG.MOVE_SPEED = newSpeed;
  }

  /**
   * Sets up the ticker callback for the game loop.
   */
  private setupTicker(): void {
    this.tickerCallback = () => this.update();
  }

  /**
   * Loads resources associated with the screen.
   */
  public async loadTextures(): Promise<void> {
    await this.readyPromise;
  }

  /**
   * Animates the screen appearance.
   */
  public async show(): Promise<void> {
    engine().audio.bgm.play("main/sounds/bgm-main.mp3", { volume: 0.5 });

    this.mainContainer.alpha = 0;
    const animation = animate(
      this.mainContainer,
      { alpha: 1 },
      { duration: 0.3, delay: 0.75, ease: "backOut" }
    );

    await Promise.all([animation.finished]);
    engine().ticker.add(this.tickerCallback);

    setTimeout(() => {
      this.spawnCheese();
    }, this.CONFIG.CHEESE_DELAY);
  }

  /**
   * Hides the screen and stops the ticker.
   */
  public async hide(): Promise<void> {
    engine().ticker.remove(this.tickerCallback);
    this.border.destroy();
  }

  /**
   * Resizes elements when the window size changes.
   */
  public resize(width: number, height: number): void {
    const centerX = width * 0.5;
    const centerY = height * 0.5;

    this.mainContainer.position.set(centerX, centerY);
    this.mainContainer.hitArea = new Rectangle(
      -centerX,
      -centerY,
      width,
      height
    );
    this.border.resize(width, height);

    this.cat.position.set(-width * 0.25, 0);
    this.mouse.position.set(width * 0.25, 0);

    this.followModeButton.resize(width);
    this.speedControl.resize(width);
    this.resizeCarpet();

    this.cheeseCountIcon.position.set(-width * 0.5 + 10, -height * 0.5 + 10);
    this.cheeseCountText.position.set(-width * 0.5 + 100, -height * 0.5 + 40);
  }

  /**
   * Handles pointer movement - moves the mouse target in follow mode.
   */
  private handlePointerMove(event: FederatedPointerEvent): void {
    if (!this.followMouseMode) return;

    this.targetX = event.global.x - this.mainContainer.x;
    this.targetY = event.global.y - this.mainContainer.y;

    this.mouse.setTarget(this.targetX, this.targetY);
    this.mouse.startMoving();
  }

  /**
   * Handles the toggle of mouse follow mode.
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
      this.resetCheeseCount();
    } else {
      this.keyboard.start();
      this.mouse.stopMoving();
    }
  }

  /**
   * Resets the cheese count to zero.
   */
  private resetCheeseCount(): void {
    this.cheeseCount = 0;
    this.cheeseCountText.text = `${this.cheeseCount}`;
  }

  /**
   * Prepares the screen for gameplay: starts keyboard listeners.
   */
  public prepare(): void {
    this.keyboard.start();
  }

  /**
   * Resets the screen state: removes listeners and ticker.
   */
  public reset(): void {
    this.keyboard.stop();
    engine().ticker.remove(this.tickerCallback);
  }

  /**
   * Main update method called every frame.
   */
  public update(): void {
    const deltaTime = 1; // Can be replaced with engine().ticker.deltaMS / 16.6 for precision
    this.handleKeyActions();

    if (this.followMouseMode) {
      this.updateCatMovementToMouse(deltaTime);
    } else {
      this.updateCatWithKeyboard();
    }

    this.cat.update(deltaTime);
    this.mouse.update(deltaTime);

    this.constrainMouseToBounds();

    // Check cheese consumption
    if (!this.isCheeseEaten) {
      this.checkCheeseCollision();
    }
  }

  /**
   * Checks collision between mouse and cheese.
   */
  private checkCheeseCollision(): void {
    const dx = this.mouse.x - this.cheese.x;
    const dy = this.mouse.y - this.cheese.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance < this.CONFIG.HIT_RADIUS) {
      this.hideCheese();
      this.incrementCheeseCount();
      // New cheese appears after 2 seconds
      setTimeout(() => {
        this.spawnCheese();
      }, 2000);
    }
  }

  /**
   * Hides the cheese from view.
   */
  private hideCheese(): void {
    this.cheese.alpha = 0;
    this.isCheeseEaten = true;
  }

  /**
   * Increments the cheese count and updates the display.
   */
  private incrementCheeseCount(): void {
    this.cheeseCount++;
    this.cheeseCountText.text = `${this.cheeseCount}`;
  }

  /**
   * Constrains mouse position within the borders.
   */
  private constrainMouseToBounds(): void {
    const { width, height } = engine().screen;
    const margin = this.CONFIG.BORDER_SIZE;

    const x0 = -width * 0.5;
    const x1 = width * 0.5;
    const y0 = -height * 0.5;
    const y1 = height * 0.5;
    const minX = x0 + margin;
    const maxX = x1 - margin;
    const minY = y0 + margin;
    const maxY = y1 - margin;

    const xLength = (width - 2 * this.CONFIG.HOLE_SIZE) / 3;
    
    // Left and right holes
    if (!this.isInRange(this.mouse.y, [-this.CONFIG.HOLE_SIZE / 2, this.CONFIG.HOLE_SIZE])) {
      this.mouse.x = Math.max(minX, Math.min(maxX, this.mouse.x));
    }
    
    // Mouse enters right hole
    if (this.mouse.x > x1 - this.CONFIG.TELEPORT_OFFSET) {
      this.mouse.x = x0 + this.CONFIG.RETURN_OFFSET;
    }
    // Mouse enters left hole
    if (this.mouse.x < x0 + this.CONFIG.TELEPORT_OFFSET) {
      this.mouse.x = x1 - this.CONFIG.RETURN_OFFSET;
    }

    // Top and bottom holes
    if (
      !(
        this.isInRange(this.mouse.x, [
          -xLength * 0.5 - this.CONFIG.HOLE_SIZE,
          -xLength * 0.5,
        ]) ||
        this.isInRange(this.mouse.x, [
          xLength * 0.5,
          xLength * 0.5 + this.CONFIG.HOLE_SIZE,
        ])
      )
    ) {
      this.mouse.y = Math.max(minY, Math.min(maxY, this.mouse.y));
    }
    // Mouse enters bottom hole
    if (this.mouse.y > y1 - this.CONFIG.TELEPORT_OFFSET) {
      this.mouse.y = y0 + this.CONFIG.RETURN_OFFSET;
      this.mouse.x = -this.mouse.x;
    }
    // Mouse enters top hole
    if (this.mouse.y < y0 + this.CONFIG.TELEPORT_OFFSET) {
      this.mouse.y = y1 - this.CONFIG.RETURN_OFFSET;
      this.mouse.x = -this.mouse.x;
    }
  }

  /**
   * Updates cat movement toward mouse position.
   */
  private updateCatMovementToMouse(deltaTime: number): void {
    const mouseX = this.mouse.x;
    const mouseY = this.mouse.y;

    const headOffset = this.CONFIG.HEAD_OFFSET;
    const facingRight = this.cat.scale.x > 0;
    const headX = this.cat.x + (facingRight ? headOffset : -headOffset);
    const headY = this.cat.y;

    const dx = mouseX - headX;
    const dy = mouseY - headY;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance > this.CONFIG.STOPPING_DISTANCE) {
      const angle = Math.atan2(dy, dx);
      const speed = this.CONFIG.MOVE_SPEED * deltaTime;
      this.cat.x += Math.cos(angle) * speed;
      this.cat.y += Math.sin(angle) * speed;

      // Rotate cat
      const newScaleX =
        Math.cos(angle) < 0 ? -this.CONFIG.CAT_BASE_SCALE : this.CONFIG.CAT_BASE_SCALE;
      if (this.cat.scale.x !== newScaleX) {
        this.cat.scale.x = newScaleX;
      }

      this.startCatMovement();
      this.catchText.alpha = 0;
    } else {
      this.stopCatMovement();

      if (this.followMouseMode) {
        this.showCatchMessage();
        this.handleFollowModeToggle(false);
      }
    }
  }

  /**
   * Starts cat movement animation.
   */
  private startCatMovement(): void {
    if (!this.isMoving) {
      this.isMoving = true;
      this.cat.startMoving();
    }
  }

  /**
   * Stops cat movement animation.
   */
  private stopCatMovement(): void {
    if (this.isMoving) {
      this.isMoving = false;
      this.cat.stopMoving();
    }
  }

  /**
   * Animates the "caught" message.
   */
  private showCatchMessage(): void {
    this.catchText.position.set(this.cat.x, this.cat.y - 50);
    this.catchText.alpha = 0;

    animate(
      this.catchText,
      { alpha: 1, y: this.catchText.y - 10 },
      { duration: 0.3, ease: "easeOut" }
    ).finished.then(() => {
      setTimeout(() => {
        animate(this.catchText, { alpha: 0 }, { duration: 0.5 }).finished.then(
          () => {
            this.catchText.y = this.cat.y - 50;
          }
        );
      }, 3000);
    });
  }

  /**
   * Updates cat movement with keyboard input.
   */
  private updateCatWithKeyboard(): void {
    let dx = 0;
    let dy = 0;

    if (this.keyboard.isPressed("ArrowLeft")) dx -= this.CONFIG.MOVE_SPEED;
    if (this.keyboard.isPressed("ArrowRight")) dx += this.CONFIG.MOVE_SPEED;
    if (this.keyboard.isPressed("ArrowUp")) dy -= this.CONFIG.MOVE_SPEED;
    if (this.keyboard.isPressed("ArrowDown")) dy += this.CONFIG.MOVE_SPEED;

    if (dx !== 0) {
      this.cat.x += dx;
      this.startCatMovement();

      // Rotation
      if (dx < 0 && this.cat.scale.x > 0) {
        this.cat.scale.x = -this.CONFIG.CAT_BASE_SCALE;
      } else if (dx > 0 && this.cat.scale.x < 0) {
        this.cat.scale.x = this.CONFIG.CAT_BASE_SCALE;
      }
    }

    if (dy !== 0) {
      this.cat.y += dy;
      this.startCatMovement();
    }

    if (this.isMoving && !dx && !dy) {
      this.stopCatMovement();
    }
  }

  /**
   * Handles keyboard actions.
   */
  private handleKeyActions(): void {
    // Toggle mouse mode
    const spacePressed = this.keyboard.isPressed(" ");
    if (spacePressed && !this.lastSpacePressed) {
      this.handleFollowModeToggle(!this.followMouseMode);
    }
    this.lastSpacePressed = spacePressed;
  }

  /**
   * Correctly resizes the carpet.
   */
  private resizeCarpet(): void {
    if (!this.carpet.texture) return;
    this.carpet.resize(engine().screen.width, engine().screen.height);
  }

  /**
   * Checks if a value is within a range.
   */
  private isInRange(value: number, range: [number, number]): boolean {
    return value >= range[0] && value <= range[1];
  }

  /**
   * Spawns cheese at a random position.
   */
  private spawnCheese(): void {
    const { width, height } = engine().screen;
    const padding = this.CONFIG.CHEESE_SPAWN_PADDING;

    const x = this.randomRange(-width * 0.5 + padding, width * 0.5 - padding);
    const y = this.randomRange(-height * 0.5 + padding, height * 0.5 - padding);

    this.cheese.position.set(x, y);
    this.cheese.alpha = 1;
    this.isCheeseEaten = false;
  }

  /**
   * Generates a random number in a range.
   */
  private randomRange(min: number, max: number): number {
    return Math.random() * (max - min) + min;
  }
}
