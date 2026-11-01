import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
} from "react-native";

import { theme } from "@/constants/theme";

type AppButtonVariant = "primary" | "secondary" | "danger";

type AppButtonProps = {
  title: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  variant?: AppButtonVariant;
};

export function AppButton({
  title,
  onPress,
  loading = false,
  disabled = false,
  variant = "primary",
}: AppButtonProps) {
  const isDisabled = disabled || loading;
  const isSecondary = variant === "secondary";

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      accessibilityLabel={title}
      style={({ pressed }) => [
        styles.button,
        variant === "secondary" && styles.buttonSecondary,
        variant === "danger" && styles.buttonDanger,
        pressed && styles.buttonPressed,
        isDisabled && styles.buttonDisabled,
      ]}
    >
      {loading ? (
        <ActivityIndicator
          color={isSecondary ? theme.colors.navy : theme.colors.white}
        />
      ) : (
        <Text style={[styles.text, isSecondary && styles.textSecondary]}>
          {title}
        </Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    width: "100%",
    minHeight: 52,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.colors.primary,
    borderWidth: 1,
    borderColor: theme.colors.primaryDark,
    borderRadius: 0,
    paddingHorizontal: theme.spacing.md,
  },

  buttonSecondary: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.ink,
  },

  buttonDanger: {
    backgroundColor: theme.colors.error,
    borderColor: theme.colors.error,
  },

  buttonPressed: {
    opacity: 0.85,
  },

  buttonDisabled: {
    opacity: 0.45,
  },

  text: {
    color: theme.colors.white,
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 0.3,
  },

  textSecondary: {
    color: theme.colors.navy,
  },
});
