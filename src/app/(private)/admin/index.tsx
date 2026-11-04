import { useRef, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";

import { AppButton } from "@/components/ui/AppButton";
import { FeedbackState } from "@/components/ui/FeedbackState";
import { useSession } from "@/features/auth/useSession";

export default function AdminHomeScreen() {
  const { signOut } = useSession();
  const [logoutError, setLogoutError] = useState("");
  const [isSigningOut, setIsSigningOut] = useState(false);
  const signOutInFlight = useRef(false);

  const handleLogout = async () => {
    if (signOutInFlight.current) return;
    signOutInFlight.current = true;
    setIsSigningOut(true);
    setLogoutError("");

    try {
      await signOut();
    } catch {
      setLogoutError("No se pudo cerrar la sesión. Intenta nuevamente.");
      setIsSigningOut(false);
      signOutInFlight.current = false;
      return;
    }

    router.replace("/login");
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Pantalla del Administrador</Text>

      {logoutError ? (
        <View
          style={styles.logoutFeedback}
          accessible
          accessibilityRole="alert"
          accessibilityLiveRegion="polite"
          accessibilityLabel={logoutError}
        >
          <FeedbackState type="error" message={logoutError} />
        </View>
      ) : null}

      <AppButton
        title="Cerrar sesión"
        onPress={handleLogout}
        loading={isSigningOut}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
    gap: 20,
  },

  title: {
    fontSize: 24,
    fontWeight: "700",
  },

  logoutFeedback: {
    width: "100%",
  },
});
