export class KeyboardController {
  private keys: Record<string, boolean> = {
    ArrowLeft: false,
    ArrowRight: false,
    ArrowUp: false,
    ArrowDown: false,
    " ": false,
  };

  private onKeyDown = (e: KeyboardEvent) => {
    if (e.key in this.keys) {
      this.keys[e.key] = true;
      e.preventDefault();
    }
  };

  private onKeyUp = (e: KeyboardEvent) => {
    if (e.key in this.keys) {
      this.keys[e.key] = false;
    }
  };

  public start(): void {
    document.addEventListener("keydown", this.onKeyDown, { passive: false });
    document.addEventListener("keyup", this.onKeyUp, { passive: true });
  }

  public stop(): void {
    document.removeEventListener("keydown", this.onKeyDown);
    document.removeEventListener("keyup", this.onKeyUp);
  }

  public isPressed(key: string): boolean {
    return !!this.keys[key];
  }
}
