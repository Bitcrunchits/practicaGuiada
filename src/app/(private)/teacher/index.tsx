import { StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";

import { AppLogo } from "@/components/ui/AppLogo";
import { AppButton } from "@/components/ui/AppButton";
import { useSession } from "@/features/auth/useSession";
import { theme } from "@/constants/theme";

export default function TeacherHomeScreen() {
  const { user, signOut } = useSession();

  const handleLogout = async () => {
    await signOut();
    router.replace("/login");
  };

  const teacherName = user?.profile?.firstName ?? "Profesor";
  const teacherLastName = user?.profile?.lastName ?? "";

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>

        <AppLogo size="large" />

        {/* Encabezado */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>
            Portal del Profesor
          </Text>

          <Text style={styles.headerName}>
            {teacherName} {teacherLastName}
          </Text>

          <Text style={styles.headerRole}>
            Profesor
          </Text>
        </View>

        {/* Opciones */}
        <View style={styles.options}>

          <View style={styles.card}>
            

            <View style={styles.cardContent}>
              <Text style={styles.cardTitle}>
                Asistencia
              </Text>

              <Text style={styles.cardDescription}>
                Cursadas, alumnos y registro de asistencia
              </Text>
            </View>

            <Text
              style={styles.arrow}
              onPress={() =>
                router.push("/(private)/teacher/attendance")
              }
            >
              ›
            </Text>
          </View>

          <View style={styles.card}>
            

            <View style={styles.cardContent}>
              <Text style={styles.cardTitle}>
                Mi perfil
              </Text>

              <Text style={styles.cardDescription}>
                Datos personales y profesionales
              </Text>
            </View>

            <Text
              style={styles.arrow}
              onPress={() =>
                router.push("/(private)/teacher/profile")
              }
            >
              ›
            </Text>
          </View>

        </View>

        <View style={styles.spacer} />

        {/* Cerrar sesión */}
        <View style={styles.footer}>
          <AppButton
            title="Cerrar sesión"
            onPress={handleLogout}
          />
        </View>

      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },

  container: {
    flex: 1,
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.sm,
    paddingBottom: theme.spacing.sm,
  },

  header: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.radius.lg,
    marginBottom: theme.spacing.md,
  },

  headerTitle: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.white,
  },

  headerName: {
    fontSize: theme.fontSize.xl,
    fontWeight: "700",
    color: theme.colors.white,
    marginTop: theme.spacing.xs,
  },

  headerRole: {
    fontSize: theme.fontSize.md,
    fontWeight: "600",
    color: theme.colors.text,
    marginTop: 2,
  },

  options: {
    gap: theme.spacing.sm,
  },

  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: theme.colors.surface,

    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,

    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,

    minHeight: 64,
  },

  cardContent: {
    flex: 1,
  },

  cardTitle: {
    fontSize: theme.fontSize.md,
    fontWeight: "700",
    color: theme.colors.primary,
  },

  cardDescription: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },

  arrow: {
    fontSize: 28,
    color: theme.colors.textSecondary,
    marginLeft: theme.spacing.sm,
    paddingHorizontal: theme.spacing.sm,
  },

  spacer: {
    flex: 1,
  },

  footer: {
    paddingTop: theme.spacing.sm,
  },
});
