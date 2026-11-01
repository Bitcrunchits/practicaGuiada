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

type AppInputProps = TextInputProps & {
  label?: string;
  error?: string;
  isPassword?: boolean;
};

export function AppInput({
  label,
  error,
  isPassword = false,
  onFocus,
  onBlur,
  ...textInputProps
}: AppInputProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [focused, setFocused] = useState(false);

  return (
    <View style={styles.container}>
      {label ? <Text style={styles.label}>{label}</Text> : null}

      <View
        style={[
          styles.inputContainer,
          focused ? styles.inputContainerFocused : null,
          error ? styles.inputContainerError : null,
        ]}
      >
        <TextInput
          style={styles.input}
          placeholderTextColor={theme.colors.textSecondary}
          secureTextEntry={isPassword && !showPassword}
          onFocus={(event) => {
            setFocused(true);
            onFocus?.(event);
          }}
          onBlur={(event) => {
            setFocused(false);
            onBlur?.(event);
          }}
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
    marginBottom: 8,
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.8,
    textTransform: "uppercase",
    color: theme.colors.textSecondary,
  },

  inputContainer: {
    minHeight: 52,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.ink,
    borderRadius: 0,
  },

  inputContainerFocused: {
    borderColor: theme.colors.primary,
    borderWidth: 2,
  },

  inputContainerError: {
    borderColor: theme.colors.error,
    borderWidth: 2,
  },

  input: {
    flex: 1,
    paddingVertical: 16,
    fontSize: 16,
    color: theme.colors.text,
  },

  passwordButton: {
    paddingLeft: theme.spacing.sm,
    paddingVertical: theme.spacing.sm,
  },

  passwordButtonText: {
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    color: theme.colors.primary,
  },

  errorText: {
    marginTop: 4,
    fontSize: 12,
    fontWeight: "600",
    color: theme.colors.error,
  },
});
