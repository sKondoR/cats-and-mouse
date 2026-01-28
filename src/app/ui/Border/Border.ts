import { Graphics } from "pixi.js";

export class Border extends Graphics {
  private _width: number;
  private _height: number;
  private _borderSize: number;
  private _holeSize: number;

  // Настройки дырок
  private totalHolesHorizontal: number = 2;
  private totalHolesVertical: number = 1;
  private color: number = 0x887849; // hex color (without #)

  constructor(
    width: number,
    height: number,
    borderSize: number,
    holeSize: number,
  ) {
    super();
    this._width = width;
    this._height = height;
    this._borderSize = borderSize;
    this._holeSize = holeSize;
    this.draw();
  }

  public draw(): void {
    this.clear();

    const left = 0;
    const right = this._width;
    const top = 0;
    const bottom = this._height;

    // Верхняя и нижняя — по 2 дырки
    this.drawDashedLine(left, top, right, top, this.totalHolesHorizontal);
    this.drawDashedLine(left, bottom, right, bottom, this.totalHolesHorizontal);

    // Левая и правая — по 1 дырке
    this.drawDashedLine(left, top, left, bottom, this.totalHolesVertical);
    this.drawDashedLine(right, top, right, bottom, this.totalHolesVertical);
  }

  private drawDashedLine(
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    holeCount: number,
  ): void {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const length = Math.sqrt(dx * dx + dy * dy);
    if (length === 0) return;

    const steps = holeCount + 1;
    const segmentLength = (length - holeCount * this._holeSize) / steps;

    const stepX = dx / length;
    const stepY = dy / length;

    let currentX = x1;
    let currentY = y1;

    for (let i = 0; i < steps; i++) {
      this.moveTo(currentX, currentY);

      currentX += stepX * segmentLength;
      currentY += stepY * segmentLength;

      this.lineTo(currentX, currentY);

      this.stroke({
        width: this._borderSize,
        color: this.color,
        alpha: 1,
      });

      // Пропуск (дырка)
      currentX += stepX * this._holeSize;
      currentY += stepY * this._holeSize;
    }
  }

  public resize(width: number, height: number): void {
    this._width = width;
    this._height = height;
    this.draw();
  }

  public destroy(): void {
    super.destroy();
  }

  // Геттеры и сеттеры (по желанию)
  setHoleSize(size: number): this {
    this._holeSize = size;
    this.draw();
    return this;
  }

  setHoleCount(horizontal: number, vertical: number): this {
    this.totalHolesHorizontal = horizontal;
    this.totalHolesVertical = vertical;
    this.draw();
    return this;
  }

  setColor(color: number): this {
    this.color = color;
    this.draw();
    return this;
  }
}

export default Border;
