// SpeedControl.ts
import { Graphics, Text } from "pixi.js";

export class SpeedControl extends Graphics {
  private valueText: Text;
  private currentValue: number = 3; // Начальная скорость (moveSpeed)
  private readonly minValue = 1;
  private readonly maxValue = 10;

  constructor() {
    super();

    this.valueText = new Text(this.currentValue.toString(), {
      fontFamily: "Arial",
      fontSize: 24,
      fill: 0xffffff,
      fontWeight: "bold",
    });
    this.valueText.anchor.set(0.5);

    this.draw();
    this.setupListeners();
  }

    private draw() {
    this.clear();
    const buttonSize = 40;
    const padding = 10;

    // Кнопка "-"
    this.rect(-buttonSize - padding, -buttonSize / 2, buttonSize, buttonSize)
        .fill({ color: 0xff6666, alpha: 1 })
        .stroke({ color: 0x000000, width: 2 });

    // Горизонтальная линия "-"
    this.moveTo(-buttonSize - padding + 10, 0)
        .lineTo(-buttonSize - padding + 30, 0)
        .stroke({ color: 0x000000, width: 3 });

    // Кнопка "+"
    this.rect(buttonSize + padding, -buttonSize / 2, buttonSize, buttonSize)
        .fill({ color: 0x66ff66, alpha: 1 })
        .stroke({ color: 0x000000, width: 2 });

    // Вертикальная и горизонтальная линии "+"
    this.moveTo(buttonSize + padding + 20, 10)
        .lineTo(buttonSize + padding + 20, -10)
        .moveTo(buttonSize + padding + 10, 0)
        .lineTo(buttonSize + padding + 30, 0)
        .stroke({ color: 0x000000, width: 3 });

    // Центральный текст
    this.valueText.text = this.currentValue.toString();
    this.valueText.position.set(0, 0);
    
    // Удаляем предыдущий текст, если он был
    const oldText = this.getChildByName("valueText");
    if (oldText) this.removeChild(oldText);
        this.valueText.name = "valueText";
        this.addChild(this.valueText);
    }

  private setupListeners() {
    this.eventMode = "static";
    this.cursor = "pointer";

    this.on("pointertap", (e) => {
      const x = e.global.x - this.worldTransform.tx;
      const padding = 10;

      if (x < -padding) {
        this.decrease();
      } else if (x > padding) {
        this.increase();
      }
    });
  }

  public increase() {
    if (this.currentValue < this.maxValue) {
      this.currentValue++;
      this.updateDisplay();
      this.emit("speedChange", this.currentValue);
    }
  }

  public decrease() {
    if (this.currentValue > this.minValue) {
      this.currentValue--;
      this.updateDisplay();
      this.emit("speedChange", this.currentValue);
    }
  }

  private updateDisplay() {
    this.valueText.text = 'speed: ' + this.currentValue.toString();
    this.draw(); // перерисовываем графику (например, чтобы обновить состояние при анимации)
  }

  public setValue(value: number) {
    this.currentValue = Math.max(this.minValue, Math.min(this.maxValue, value));
    this.updateDisplay();
  }

  public getValue(): number {
    return this.currentValue;
  }

  public resize(screenWidth: number, screenHeight: number) {
    const marginX = 200;
    const marginY = 30;
    this.position.set(screenWidth - marginX, marginY);
  }
}
