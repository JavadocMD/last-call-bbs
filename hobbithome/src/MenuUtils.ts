import { MenuPainter } from "Painter";
import { Menu, Result, Scene, State } from "State";
import { Key } from "utils/Constants";
import { identity, pipe } from "utils/Funcs";
import { Arrays } from "utils/index";

export type StateUpdate = (state: State) => State;

// state transition shortcuts

export function flipMenu(s: State): State {
  return { ...s, menuLeft: !s.menuLeft };
}

export function gotoMenu(state: State, next: Menu): State {
  return pipe<State>(
    (s) => s.menu.onExit(s),
    (s) => ({ ...s, menu: next }),
    (s) => s.menu.onEnter(s)
  )(state);
}

export function gotoScene(s: State, next: Scene): State {
  return { ...s, scene: next, menu: next.defaultMenu };
}

interface Option {
  readonly text: string;
  readonly apply: StateUpdate;
}

export function option(text: string, apply: StateUpdate): Option {
  return { text, apply };
}

export function defaultMenu(openMenu: StateUpdate): Menu {
  return {
    onRender(s: State): void {},
    onInput(s: State, key: number): Result {
      switch (key) {
        case Key.TAB:
          return openMenu(s);
        default:
          return null;
      }
    },
    onEnter: identity,
    onExit: identity,
  };
}

export function optionMenu(
  closeMenu: StateUpdate,
  goBack: StateUpdate,
  title: string,
  options: Array<Option>
): Menu {
  return {
    onRender({ menuLeft }): void {
      const p = new MenuPainter(menuLeft);
      p.start(title);
      options.forEach((x, i) => {
        const t = `${(i + 1).toString()}. ${x.text}`;
        p.nextLine(t);
      });
    },
    onInput(s: State, key: number): Result {
      if (key === Key.TAB) {
        return closeMenu(s);
      } else if (key === Key.ESCAPE) {
        return goBack(s);
      } else if (key === Key.BACKTICK) {
        return flipMenu(s);
      } else if (Key.isNumber(key)) {
        const index = Key.toNumber(key) - 1;
        const picked = Arrays.get(options, index);
        if (picked !== null) {
          return picked.apply(s);
        } else {
          return null;
        }
      } else {
        return null;
      }
    },
    onEnter: identity,
    onExit: identity,
  };
}
