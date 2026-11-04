import { useRef, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";

import { AppButton } from "@/components/ui/AppButton";
import { AppScreenHeader } from "@/components/ui/AppScreenHeader";
import { FeedbackState } from "@/components/ui/FeedbackState";
import { Screen } from "@/components/ui/Screen";
import { theme } from "@/constants/theme";
import { useSession } from "@/features/auth/useSession";

export default function TeacherHomeScreen() {
  const { user, signOut } = useSession();
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

  const teacherName = user?.profile?.firstName ?? "Profesor";
  const teacherLastName = user?.profile?.lastName ?? "";
  const fullName = `${teacherName} ${teacherLastName}`.trim();

  return (
    <Screen
      header={
        <AppScreenHeader
          showLogo
          title="Portal del Profesor"
          subtitle={fullName}
          meta="Profesor"
        />
      }
    >
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Acciones</Text>

          <AppButton
            title="Ver mis cursadas"
            onPress={() => router.push("/(private)/teacher/attendance")}
          />

          <AppButton
            title="Mi perfil"
            variant="secondary"
            onPress={() => router.push("/(private)/teacher/profile")}
          />
        </View>

        <View style={styles.spacer} />

        {logoutError ? (
          <View
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
          variant="secondary"
          onPress={handleLogout}
          loading={isSigningOut}
        />
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
  },

  content: {
    paddingTop: theme.spacing.md,
    paddingBottom: theme.spacing.lg,
    gap: theme.spacing.md,
    flexGrow: 1,
  },

  section: {
    gap: theme.spacing.sm,
  },

  sectionTitle: {
    color: theme.colors.primary,
    fontSize: theme.fontSize.lg,
    fontWeight: "700",
  },

  spacer: {
    flex: 1,
    minHeight: theme.spacing.lg,
  },
});
