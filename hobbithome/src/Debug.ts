import { Color } from "utils/Constants";

var debug: string | null = null;

export function draw(): void {
  if (debug !== null) {
    drawText(debug, Color.TEXT, 0, 0);
  }
}

export function log(text: string): void {
  debug = text;
}

export function clear(): void {
  debug = null;
}
