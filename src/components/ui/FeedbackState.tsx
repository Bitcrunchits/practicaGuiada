import { StyleSheet, Text, View } from "react-native";

import { theme } from "@/constants/theme";

type FeedbackType = "error" | "success" | "info";

type FeedbackStateProps = {
  message: string;
  type?: FeedbackType;
};

export function FeedbackState({
  message,
  type = "info",
}: FeedbackStateProps) {
  if (!message) {
    return null;
  }

  return (
    <View
      style={[
        styles.container,
        type === "error" && styles.error,
        type === "success" && styles.success,
        type === "info" && styles.info,
      ]}
    >
      <Text style={styles.text}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    padding: theme.spacing.md,
    borderRadius: theme.radius.md,
    marginBottom: theme.spacing.md,
  },

  error: {
    backgroundColor: theme.colors.errorBackground,
  },

  success: {
    backgroundColor: theme.colors.successBackground,
  },

  info: {
    backgroundColor: theme.colors.infoBackground,
  },

  text: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.text,
  },
});