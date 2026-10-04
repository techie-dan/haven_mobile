import { StyleSheet, Text, type TextProps } from "react-native";

import { fonts, palette } from "@/theme";

type Variant =
  | "display"
  | "displayLarge"
  | "title"
  | "subtitle"
  | "body"
  | "bodySoft"
  | "small"
  | "label"
  | "eyebrow"
  | "price";

export type AppTextProps = TextProps & {
  variant?: Variant;
  color?: string;
};

export function AppText({ variant = "body", color, style, ...rest }: AppTextProps) {
  return <Text style={[styles[variant], color ? { color } : null, style]} {...rest} />;
}

const styles = StyleSheet.create({
  display: {
    fontFamily: fonts.display,
    fontSize: 26,
    lineHeight: 32,
    color: palette.ink,
  },
  displayLarge: {
    fontFamily: fonts.display,
    fontSize: 38,
    lineHeight: 44,
    color: palette.ink,
  },
  title: {
    fontFamily: fonts.display,
    fontSize: 22,
    lineHeight: 28,
    color: palette.ink,
  },
  subtitle: {
    fontFamily: fonts.body,
    fontSize: 15,
    lineHeight: 22,
    color: palette.inkSoft,
  },
  body: {
    fontFamily: fonts.body,
    fontSize: 14,
    lineHeight: 21,
    color: palette.ink,
  },
  bodySoft: {
    fontFamily: fonts.body,
    fontSize: 13,
    lineHeight: 20,
    color: palette.muted,
  },
  small: {
    fontFamily: fonts.body,
    fontSize: 12,
    lineHeight: 17,
    color: palette.muted,
  },
  label: {
    fontFamily: fonts.body,
    fontSize: 11,
    letterSpacing: 1.2,
    textTransform: "uppercase",
    color: palette.inkSoft,
  },
  eyebrow: {
    fontFamily: fonts.body,
    fontSize: 10,
    letterSpacing: 1.8,
    textTransform: "uppercase",
    color: palette.muted,
  },
  price: {
    fontFamily: fonts.body,
    fontSize: 15,
    color: palette.ink,
  },
});
