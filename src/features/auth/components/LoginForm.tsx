import { useState } from "react";
import {
  StyleSheet,
  Text,
  View,
} from "react-native";

import { AppButton } from "@/components/ui/AppButton";
import { AppInput } from "@/components/ui/AppInput";
import { FeedbackState } from "@/components/ui/FeedbackState";
import { theme } from "@/constants/theme";

import { login } from "@/features/auth/services/auth.service";
import { useSession } from "../useSession";
import { router } from "expo-router";

export function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const { signIn } = useSession();

  const handleLogin = async () => {
    setError("");

    if (!email.trim()) {
      setError("Ingresá tu correo electrónico.");
      return;
    }

    if (!password.trim()) {
      setError("Ingresá tu contraseña.");
      return;
    }

    try {
      setLoading(true);

      const response = await login({
        email,
        password,
      });

      await signIn(
        response.data.accessToken,
        response.data.user
      );
      
      router.replace("/")
    } catch (error) {
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError("No se pudo iniciar sesión.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>
          Bienvenido
        </Text>

        <View style={styles.accentRule} />

        <Text style={styles.subtitle}>
          Ingresá tus datos para continuar
        </Text>
      </View>

      <AppInput
        label="Correo electrónico"
        placeholder="nombre@correo.com"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        autoCorrect={false}
      />

      <AppInput
        label="Contraseña"
        placeholder="Ingresá tu contraseña"
        value={password}
        onChangeText={setPassword}
        isPassword
        autoCapitalize="none"
      />

      <FeedbackState
        message={error}
        type="error"
      />

      <AppButton
        title="Iniciar sesión"
        onPress={handleLogin}
        loading={loading}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
  },

  header: {
    alignItems: "flex-start",
  },

  title: {
    fontSize: 28,
    fontWeight: "800",
    color: theme.colors.navy,
    marginBottom: 8,
    textAlign: "left",
  },

  accentRule: {
    width: 48,
    height: 3,
    backgroundColor: theme.colors.accent,
    marginBottom: 16,
  },

  subtitle: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginBottom: 24,
    textAlign: "left",
  },
});
