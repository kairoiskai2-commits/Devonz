import { globSync } from 'fast-glob';
import fs from 'node:fs/promises';
import { basename } from 'node:path';
import { defineConfig, presetIcons, presetUno, transformerDirectives } from 'unocss';

const iconPaths = globSync('./icons/*.svg');

const collectionName = 'veyra';

const customIconCollection = iconPaths.reduce(
  (acc, iconPath) => {
    const [iconName] = basename(iconPath).split('.');

    acc[collectionName] ??= {};
    acc[collectionName][iconName] = async () => fs.readFile(iconPath, 'utf8');

    return acc;
  },
  {} as Record<string, Record<string, () => Promise<string>>>,
);

const BASE_COLORS = {
  white: '#FFFFFF',
  gray: {
    // Blink.new inspired navy/charcoal palette
    50: '#f0f4f8',
    100: '#d9e2ec',
    200: '#bcccdc',
    300: '#9fb3c8',
    400: '#829ab1',
    500: '#627d98',
    600: '#486581',
    700: '#334e68',
    800: '#1a2332', // Main card background
    900: '#131a24', // Secondary background
    950: '#0d1117', // Deepest background (like GitHub dark)
  },
  accent: {
    // Blue accent like Blink.new
    50: '#eff6ff',
    100: '#dbeafe',
    200: '#bfdbfe',
    300: '#93c5fd',
    400: '#60a5fa',
    500: '#3b82f6', // Primary blue
    600: '#2563eb',
    700: '#1d4ed8',
    800: '#1e40af',
    900: '#1e3a8a',
    950: '#172554',
  },
  green: {
    50: '#F0FDF4',
    100: '#DCFCE7',
    200: '#BBF7D0',
    300: '#86EFAC',
    400: '#4ADE80',
    500: '#22C55E',
    600: '#16A34A',
    700: '#15803D',
    800: '#166534',
    900: '#14532D',
    950: '#052E16',
  },
  orange: {
    50: '#FFFAEB',
    100: '#FEEFC7',
    200: '#FEDF89',
    300: '#FEC84B',
    400: '#FDB022',
    500: '#F79009',
    600: '#DC6803',
    700: '#B54708',
    800: '#93370D',
    900: '#792E0D',
  },
  red: {
    50: '#FEF2F2',
    100: '#FEE2E2',
    200: '#FECACA',
    300: '#FCA5A5',
    400: '#F87171',
    500: '#EF4444',
    600: '#DC2626',
    700: '#B91C1C',
    800: '#991B1B',
    900: '#7F1D1D',
    950: '#450A0A',
  },
  purple: {
    50: '#FAF5FF',
    100: '#F3E8FF',
    200: '#E9D5FF',
    300: '#D8B4FE',
    400: '#C084FC',
    500: '#A855F7',
    600: '#7C3AED',
    700: '#6D28D9',
    800: '#5B21B6',
    900: '#4C1D95',
    950: '#2E1065',
  },
};

const COLOR_PRIMITIVES = {
  ...BASE_COLORS,
  alpha: {
    white: generateAlphaPalette(BASE_COLORS.white),
    gray: generateAlphaPalette(BASE_COLORS.gray[900]),
    red: generateAlphaPalette(BASE_COLORS.red[500]),
    accent: generateAlphaPalette(BASE_COLORS.accent[500]),
  },
};

export default defineConfig({
  safelist: [...Object.keys(customIconCollection[collectionName] || {}).map((x) => `i-veyra:${x}`)],
  shortcuts: {
    'veyra-ease-cubic-bezier': 'ease-[cubic-bezier(0.4,0,0.2,1)]',
    'transition-theme': 'transition-[background-color,border-color,color] duration-150 veyra-ease-cubic-bezier',
    kdb: 'bg-veyra-elements-code-background text-veyra-elements-code-text py-1 px-1.5 rounded-md',
    'max-w-chat': 'max-w-[var(--chat-max-width)]',
  },
  rules: [
    /**
     * This shorthand doesn't exist in Tailwind and we overwrite it to avoid
     * any conflicts with minified CSS classes.
     */
    ['b', {}],
  ],
  theme: {
    colors: {
      ...COLOR_PRIMITIVES,
      veyra: {
        elements: {
          borderColor: 'var(--veyra-elements-borderColor)',
          borderColorActive: 'var(--veyra-elements-borderColorActive)',
          background: {
            depth: {
              1: 'var(--veyra-elements-bg-depth-1)',
              2: 'var(--veyra-elements-bg-depth-2)',
              3: 'var(--veyra-elements-bg-depth-3)',
              4: 'var(--veyra-elements-bg-depth-4)',
            },
          },
          textPrimary: 'var(--veyra-elements-textPrimary)',
          textSecondary: 'var(--veyra-elements-textSecondary)',
          textTertiary: 'var(--veyra-elements-textTertiary)',
          code: {
            background: 'var(--veyra-elements-code-background)',
            text: 'var(--veyra-elements-code-text)',
          },
          button: {
            primary: {
              background: 'var(--veyra-elements-button-primary-background)',
              backgroundHover: 'var(--veyra-elements-button-primary-backgroundHover)',
              text: 'var(--veyra-elements-button-primary-text)',
            },
            secondary: {
              background: 'var(--veyra-elements-button-secondary-background)',
              backgroundHover: 'var(--veyra-elements-button-secondary-backgroundHover)',
              text: 'var(--veyra-elements-button-secondary-text)',
            },
            danger: {
              background: 'var(--veyra-elements-button-danger-background)',
              backgroundHover: 'var(--veyra-elements-button-danger-backgroundHover)',
              text: 'var(--veyra-elements-button-danger-text)',
            },
          },
          item: {
            contentDefault: 'var(--veyra-elements-item-contentDefault)',
            contentActive: 'var(--veyra-elements-item-contentActive)',
            contentAccent: 'var(--veyra-elements-item-contentAccent)',
            contentDanger: 'var(--veyra-elements-item-contentDanger)',
            backgroundDefault: 'var(--veyra-elements-item-backgroundDefault)',
            backgroundActive: 'var(--veyra-elements-item-backgroundActive)',
            backgroundAccent: 'var(--veyra-elements-item-backgroundAccent)',
            backgroundDanger: 'var(--veyra-elements-item-backgroundDanger)',
          },
          actions: {
            background: 'var(--veyra-elements-actions-background)',
            code: {
              background: 'var(--veyra-elements-actions-code-background)',
            },
          },
          artifacts: {
            background: 'var(--veyra-elements-artifacts-background)',
            backgroundHover: 'var(--veyra-elements-artifacts-backgroundHover)',
            borderColor: 'var(--veyra-elements-artifacts-borderColor)',
            inlineCode: {
              background: 'var(--veyra-elements-artifacts-inlineCode-background)',
              text: 'var(--veyra-elements-artifacts-inlineCode-text)',
            },
          },
          messages: {
            background: 'var(--veyra-elements-messages-background)',
            linkColor: 'var(--veyra-elements-messages-linkColor)',
            code: {
              background: 'var(--veyra-elements-messages-code-background)',
            },
            inlineCode: {
              background: 'var(--veyra-elements-messages-inlineCode-background)',
              text: 'var(--veyra-elements-messages-inlineCode-text)',
            },
          },
          icon: {
            success: 'var(--veyra-elements-icon-success)',
            error: 'var(--veyra-elements-icon-error)',
            primary: 'var(--veyra-elements-icon-primary)',
            secondary: 'var(--veyra-elements-icon-secondary)',
            tertiary: 'var(--veyra-elements-icon-tertiary)',
          },
          preview: {
            addressBar: {
              background: 'var(--veyra-elements-preview-addressBar-background)',
              backgroundHover: 'var(--veyra-elements-preview-addressBar-backgroundHover)',
              backgroundActive: 'var(--veyra-elements-preview-addressBar-backgroundActive)',
              text: 'var(--veyra-elements-preview-addressBar-text)',
              textActive: 'var(--veyra-elements-preview-addressBar-textActive)',
            },
          },
          terminals: {
            background: 'var(--veyra-elements-terminals-background)',
            buttonBackground: 'var(--veyra-elements-terminals-buttonBackground)',
          },
          dividerColor: 'var(--veyra-elements-dividerColor)',
          loader: {
            background: 'var(--veyra-elements-loader-background)',
            progress: 'var(--veyra-elements-loader-progress)',
          },
          prompt: {
            background: 'var(--veyra-elements-prompt-background)',
          },
          sidebar: {
            dropdownShadow: 'var(--veyra-elements-sidebar-dropdownShadow)',
            buttonBackgroundDefault: 'var(--veyra-elements-sidebar-buttonBackgroundDefault)',
            buttonBackgroundHover: 'var(--veyra-elements-sidebar-buttonBackgroundHover)',
            buttonText: 'var(--veyra-elements-sidebar-buttonText)',
          },
          cta: {
            background: 'var(--veyra-elements-cta-background)',
            text: 'var(--veyra-elements-cta-text)',
          },
        },
      },
    },
  },
  transformers: [transformerDirectives()],
  presets: [
    presetUno({
      dark: {
        light: '[data-theme="light"]',
        dark: '[data-theme="dark"]',
      },
    }),
    presetIcons({
      warn: true,
      collections: {
        ...customIconCollection,
      },
      unit: 'em',
    }),
  ],
});

/**
 * Generates an alpha palette for a given hex color.
 *
 * @param hex - The hex color code (without alpha) to generate the palette from.
 * @returns An object where keys are opacity percentages and values are hex colors with alpha.
 *
 * Example:
 *
 * ```
 * {
 *   '1': '#FFFFFF03',
 *   '2': '#FFFFFF05',
 *   '3': '#FFFFFF08',
 * }
 * ```
 */
function generateAlphaPalette(hex: string) {
  return [1, 2, 3, 4, 5, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100].reduce(
    (acc, opacity) => {
      const alpha = Math.round((opacity / 100) * 255)
        .toString(16)
        .padStart(2, '0');

      acc[opacity] = `${hex}${alpha}`;

      return acc;
    },
    {} as Record<number, string>,
  );
}
