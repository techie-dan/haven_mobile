import { Platform } from "react-native";

/**
 * Brand tokens sampled from the studio comps, so the app and the website read
 * as one product. Keep this in step with `retail store/src/app/globals.css`.
 */
export const palette = {
  canvas: "#f4f1ec",
  surface: "#ffffff",
  surfaceSunk: "#faf8f5",
  ink: "#1c1a17",
  inkSoft: "#4a453e",
  muted: "#8c8579",
  line: "#e2ddd4",
  lineStrong: "#cfc8bb",
  terracotta: "#c1613c",
  terracottaSoft: "#fbf3ef",
  sage: "#6b7a5e",
  brass: "#b08d57",
  white: "#ffffff",
} as const;

const displayStack = Platform.select({
  ios: "Georgia",
  android: "serif",
  default: "Georgia, 'Times New Roman', serif",
});

const bodyStack = Platform.select({
  ios: "System",
  android: "sans-serif",
  default:
    "system-ui, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
});

export const fonts = {
  display: displayStack,
  body: bodyStack,
  mono: Platform.select({ ios: "Menlo", android: "monospace", default: "monospace" }),
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
} as const;

export const radius = {
  sm: 4,
  md: 8,
  lg: 14,
  pill: 999,
} as const;

/** Small-caps eyebrow: 10px, wide tracking, uppercase. */
export const eyebrow = {
  fontFamily: fonts.body,
  fontSize: 10,
  letterSpacing: 1.8,
  textTransform: "uppercase" as const,
  color: palette.muted,
};
