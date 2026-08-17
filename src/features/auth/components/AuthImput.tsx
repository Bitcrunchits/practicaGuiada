import { useState } from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  View,
} from "react-native";

import { theme } from "@/constants/theme";

type InputProps = TextInputProps & {
  label?: string;
  error?: string;
  isPassword?: boolean;
};

export function Input({
  label,
  error,
  isPassword = false,
  ...textInputProps
}: InputProps) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <View style={styles.container}>
      {label ? <Text style={styles.label}>{label}</Text> : null}

      <View
        style={[
          styles.inputContainer,
          error ? styles.inputContainerError : null,
        ]}
      >
        <TextInput
          style={styles.input}
          placeholderTextColor={theme.colors.textSecondary}
          secureTextEntry={isPassword && !showPassword}
          {...textInputProps}
        />

        {isPassword ? (
          <Pressable
            onPress={() => setShowPassword((previous) => !previous)}
            style={styles.passwordButton}
          >
            <Text style={styles.passwordButtonText}>
              {showPassword ? "Ocultar" : "Ver"}
            </Text>
          </Pressable>
        ) : null}
      </View>

      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    marginBottom: theme.spacing.md,
  },

  label: {
    marginBottom: theme.spacing.sm,
    fontSize: theme.fontSize.sm,
    fontWeight: "600",
    color: theme.colors.text,
  },

  inputContainer: {
    minHeight: 52,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: theme.spacing.md,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
  },

  inputContainerError: {
    borderColor: theme.colors.error,
  },

  input: {
    flex: 1,
    paddingVertical: theme.spacing.md,
    fontSize: theme.fontSize.md,
    color: theme.colors.text,
  },

  passwordButton: {
    paddingLeft: theme.spacing.sm,
    paddingVertical: theme.spacing.sm,
  },

  passwordButtonText: {
    fontSize: theme.fontSize.sm,
    fontWeight: "600",
    color: theme.colors.primary,
  },

  errorText: {
    marginTop: theme.spacing.xs,
    fontSize: theme.fontSize.xs,
    color: theme.colors.error,
  },
});