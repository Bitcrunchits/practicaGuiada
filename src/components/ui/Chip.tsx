import { Pressable, StyleSheet, Text, View } from "react-native";
import { theme } from "@/constants/theme";

type ChipTone = "present" | "info" | "success" | "warning" | "neutral" | "absent";

interface ChipProps {
  label: string;
  tone?: ChipTone;
  onPress?: () => void;
  style?: ViewStyle;
}

const TONE_COLORS: Record<ChipTone, { bg: string; text: string; border: string }> = {
  present: { bg: "#E7F6EC", text: "#1F6B3A", border: "#1F6B3A" },
  info: { bg: "#E8F0FA", text: "#2F5FA8", border: "#2F5FA8" },
  success: { bg: "#E7F6EC", text: "#1F6B3A", border: "#1F6B3A" },
  warning: { bg: "#FEF0C7", text: "#B54708", border: "#B54708" },
  neutral: { bg: "#F2F4F7", text: "#5B6675", border: "#CBD5E1" },
  absent: { bg: "#FEE4E2", text: "#B42318", border: "#B42318" },
}

export function Chip({ label, tone = "neutral", onPress, style }: ChipProps) {
  const colors = TONE_COLORS[tone];

  return (
    <Pressable
      style={[
        styles.container,
        { backgroundColor: colors.bg, borderColor: colors.border },
        style,
      ]}
      onPress={onPress}
      accessibilityRole={onPress ? "button" : undefined}
      accessibilityState={onPress ? { disabled: false } : undefined}
    >
      <Text style={[styles.text, { color: colors.text }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 4,
    borderWidth: 1,
    borderRadius: theme.radius.pill,
    minWidth: 64,
    alignItems: "center",
    justifyContent: "center",
  },
  text: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.4,
    textTransform: "uppercase",
  },
});

import type { ViewStyle } from "react-native";