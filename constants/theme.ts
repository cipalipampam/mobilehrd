/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import { Platform } from 'react-native';

const tintColorLight = '#1a1a1a';
const tintColorDark = '#fff';

export const Colors = {
  light: {
    text: '#1a1a1a',
    background: '#fff',
    tint: tintColorLight,
    icon: '#1a1a1a',
    tabIconDefault: '#999',
    tabIconSelected: tintColorLight,
    primary: '#1a1a1a',
    secondary: '#f5f5f5',
    border: '#e0e0e0',
    card: '#fff',
    textSecondary: '#666',
    textTertiary: '#999',
  },
  dark: {
    text: '#fff',
    background: '#1a1a1a',
    tint: tintColorDark,
    icon: '#fff',
    tabIconDefault: '#999',
    tabIconSelected: tintColorDark,
    primary: '#fff',
    secondary: '#2a2a2a',
    border: '#3a3a3a',
    card: '#2a2a2a',
    textSecondary: '#aaa',
    textTertiary: '#888',
  },
};

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
