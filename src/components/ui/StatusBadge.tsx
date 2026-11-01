import { StyleSheet, Text, View } from "react-native";

import { theme } from "@/constants/theme";

export type StatusTone = "present" | "absent" | "late" | "justified" | "neutral";

type StatusBadgeProps = {
  label: string;
  tone?: StatusTone;
};

export function StatusBadge({
  label,
  tone = "neutral",
}: StatusBadgeProps) {
  return (
    <View
      style={[
        styles.container,
        tone === "present" && styles.present,
        tone === "absent" && styles.absent,
        tone === "late" && styles.late,
        tone === "justified" && styles.justified,
        tone === "neutral" && styles.neutral,
      ]}
    >
      <Text
        style={[
          styles.text,
          tone === "present" && styles.textPresent,
          tone === "absent" && styles.textAbsent,
          tone === "late" && styles.textLate,
          tone === "justified" && styles.textJustified,
          tone === "neutral" && styles.textNeutral,
        ]}
      >
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignSelf: "flex-start",
    borderWidth: 1,
    borderRadius: 0,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },

  text: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.6,
    textTransform: "uppercase",
  },

  present: {
    backgroundColor: theme.colors.successBackground,
    borderColor: theme.colors.success,
  },

  textPresent: {
    color: theme.colors.success,
  },

  absent: {
    backgroundColor: theme.colors.errorBackground,
    borderColor: theme.colors.error,
  },

  textAbsent: {
    color: theme.colors.error,
  },

  late: {
    backgroundColor: theme.colors.warningBackground,
    borderColor: theme.colors.warning,
  },

  textLate: {
    color: theme.colors.warning,
  },

  justified: {
    backgroundColor: theme.colors.infoBackground,
    borderColor: theme.colors.info,
  },

  textJustified: {
    color: theme.colors.info,
  },

  neutral: {
    backgroundColor: theme.colors.surfaceMuted,
    borderColor: theme.colors.borderSubtle,
  },

  textNeutral: {
    color: theme.colors.textSecondary,
  },
});
