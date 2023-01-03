import GameScene from "game/GameScene";
import { defaultMenu, gotoMenu, gotoScene, optionMenu } from "MenuUtils";
import { Scene, State } from "State";
import { Color } from "utils/Constants";

class TitleScene extends Scene {
  public readonly defaultMenu = defaultMenu(
    (s) => gotoMenu(s, this.rootMenu) //
  );

  private rootMenu = optionMenu(
    (s) => gotoMenu(s, this.defaultMenu),
    (s) => gotoMenu(s, this.defaultMenu),
    "Hobbit Home",
    [
      {
        text: "start game",
        apply: (s) => gotoScene(s, GameScene),
      },
    ]
  );

  override onUpdate(s: State): State {
    return s;
  }

  override onRender(s: State): void {
    const c = Color.TEXT;
    drawText("                                 ▗            ", c, 4, 2);
    drawText("                                 ▖▗           ", c, 4, 3);
    drawText("█▙  █▙     █   █   ☻  ▙   █▙  █▙              ", c, 4, 4);
    drawText("██  ██ ██▙ ██▙ ██▙   ██▙  ██  ██ ██▙ ██▙█▙ ██▛", c, 4, 5);
    drawText("██████ █ █ █ █ █ █ █  █   ██████ █ █ █ █ █ █═ ", c, 4, 6);
    drawText("▜█  ▜█ ▜█▛ ▜█▛ ▜█▛ ▜  ▜   ▜█  ▜█ ▜█▛ ▜ ▜ ▜ ▜█▛", c, 4, 7);
    drawText(" ═══════a game by javadocmd════════════v0.1════", c, 4, 8);

    drawText("press TAB to display menu", c, 6, 14);
    drawText("press ESC to exit a menu", c, 6, 15);
    drawText("press BACKTICK to flip the menu left or right", c, 6, 16);
  }
}

const instance = new TitleScene();

export default instance;
