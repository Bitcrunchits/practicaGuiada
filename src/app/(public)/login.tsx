import { Image, StyleSheet } from "react-native";

import { Screen } from "@/components/ui/Screen";
import { LoginForm } from "@/features/auth/components/LoginForm";

export default function LoginScreen() {
  return (
    <Screen style={styles.container}>

      <Image
        source={require("../../../assets/images/logo-its.png")}
        style={styles.logo}
      />

      <LoginForm />

    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: "center",
  },

  logo: {
    width: 250,
    height: 100,
    resizeMode: "contain",
    alignSelf: "center",
    marginBottom: 20,
  },
});