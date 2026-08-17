import { StyleSheet } from "react-native";

import { Screen } from "@/components/ui/Screen";
import { LoginForm } from "@/features/auth/components/LoginForm";

export default function LoginScreen() {
  return (
    <Screen style={styles.container}>
      <LoginForm />
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: "center",
  },
});