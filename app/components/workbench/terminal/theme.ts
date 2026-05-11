import type { ITheme } from '@xterm/xterm';

const style = getComputedStyle(document.documentElement);
const cssVar = (token: string) => style.getPropertyValue(token) || undefined;

export function getTerminalTheme(overrides?: ITheme): ITheme {
  return {
    cursor: cssVar('--veyra-elements-terminal-cursorColor'),
    cursorAccent: cssVar('--veyra-elements-terminal-cursorColorAccent'),
    foreground: cssVar('--veyra-elements-terminal-textColor'),
    background: cssVar('--veyra-elements-terminal-backgroundColor'),
    selectionBackground: cssVar('--veyra-elements-terminal-selection-backgroundColor'),
    selectionForeground: cssVar('--veyra-elements-terminal-selection-textColor'),
    selectionInactiveBackground: cssVar('--veyra-elements-terminal-selection-backgroundColorInactive'),

    // ansi escape code colors
    black: cssVar('--veyra-elements-terminal-color-black'),
    red: cssVar('--veyra-elements-terminal-color-red'),
    green: cssVar('--veyra-elements-terminal-color-green'),
    yellow: cssVar('--veyra-elements-terminal-color-yellow'),
    blue: cssVar('--veyra-elements-terminal-color-blue'),
    magenta: cssVar('--veyra-elements-terminal-color-magenta'),
    cyan: cssVar('--veyra-elements-terminal-color-cyan'),
    white: cssVar('--veyra-elements-terminal-color-white'),
    brightBlack: cssVar('--veyra-elements-terminal-color-brightBlack'),
    brightRed: cssVar('--veyra-elements-terminal-color-brightRed'),
    brightGreen: cssVar('--veyra-elements-terminal-color-brightGreen'),
    brightYellow: cssVar('--veyra-elements-terminal-color-brightYellow'),
    brightBlue: cssVar('--veyra-elements-terminal-color-brightBlue'),
    brightMagenta: cssVar('--veyra-elements-terminal-color-brightMagenta'),
    brightCyan: cssVar('--veyra-elements-terminal-color-brightCyan'),
    brightWhite: cssVar('--veyra-elements-terminal-color-brightWhite'),

    ...overrides,
  };
}
