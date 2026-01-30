import { animate } from "motion";
import { Container, Text, Graphics } from "pixi.js";

export class WelcomeScreen extends Container {
  public static assetBundles = ["default"];
  
  private welcomeText!: Text;
  private background!: Graphics;

  constructor() {
    super();
    
    this.createBackground();
    this.createWelcomeText();
  }

  private createBackground(): void {
    this.background = new Graphics();
    this.background.rect(0, 0, 100, 100).fill({ color: 0xE8CB76 });
    this.addChildAt(this.background, 0);
  }

  private createWelcomeText(): void {
    this.welcomeText = new Text({
      text: "Привет! Поиграем в кошки-мышки?",
      style: {
        fontFamily: "Arial",
        fontSize: 72,
        fill: "#333333",
        fontWeight: "bold",
        align: "center",
      }
    });
    this.welcomeText.anchor.set(0.5);
    this.welcomeText.alpha = 0;
    this.welcomeText.scale.set(0.5);
    this.addChild(this.welcomeText);
  }

  public resize(width: number, height: number): void {
    this.background.clear();
    this.background.rect(0, 0, width, height).fill({ color: 0xE8CB76 });
    
    this.welcomeText.position.set(width * 0.5, height * 0.5);
  }

  public async show(): Promise<void> {
  
    // Анимация появления текста с одновременным увеличением
    const appearAnimation = animate(
      this.welcomeText,
      {
        alpha: 1,
      },
      {
        duration: 1.0,
        ease: "easeOut"
      }
    );
    
    const scaleAnimation = animate(
      this.welcomeText.scale,
      {
        x: 1,
        y: 1
      },
      {
        duration: 1.0,
        ease: "easeOut"
      }
    );
    
    // Ждем завершения основных анимаций
    await Promise.all([
      appearAnimation.finished,
      scaleAnimation.finished
    ]);
    
    // Небольшая пауза перед исчезновением
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  public async hide(): Promise<void> {
    const fadeAnimation = animate(
      this.welcomeText,
      {
        alpha: 0,
      },
      {
        duration: 0.8,
        ease: "easeIn"
      }
    );
    
    const scaleAnimation = animate(
      this.welcomeText.scale,
      {
        x: 0.8,
        y: 0.8
      },
      {
        duration: 0.8,
        ease: "easeIn"
      }
    );
    
    await Promise.all([
      fadeAnimation.finished,
      scaleAnimation.finished
    ]);
  }
}