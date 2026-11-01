import { StyleSheet } from "react-native";

import { AppCard } from "@/components/ui/AppCard";
import { AppLogo } from "@/components/ui/AppLogo";
import { Screen } from "@/components/ui/Screen";
import { LoginForm } from "@/features/auth/components/LoginForm";

export default function LoginScreen() {
  return (
    <Screen style={styles.container}>

      <AppLogo size="large" />

      <AppCard style={styles.card}>
        <LoginForm />
      </AppCard>

    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: "center",
  },

  card: {
    padding: 24,
  },
});
