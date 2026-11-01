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
    padding: 16,
    borderRadius: 0,
    marginBottom: 16,
    borderWidth: 1,
    borderLeftWidth: 4,
  },

  error: {
    backgroundColor: theme.colors.errorBackground,
    borderColor: theme.colors.error,
    borderLeftColor: theme.colors.error,
  },

  success: {
    backgroundColor: theme.colors.successBackground,
    borderColor: theme.colors.success,
    borderLeftColor: theme.colors.success,
  },

  info: {
    backgroundColor: theme.colors.infoBackground,
    borderColor: theme.colors.info,
    borderLeftColor: theme.colors.info,
  },

  text: {
    fontSize: 14,
    color: theme.colors.text,
    lineHeight: 20,
  },
});
