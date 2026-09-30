import { StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";

import { AppButton } from "@/components/ui/AppButton";
import { theme } from "@/constants/theme";

export default function AttendanceStudentsScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>
        Alumnos de la cursada
      </Text>

      <View style={styles.emptyCard}>
        <Text style={styles.emptyTitle}>
          No hay alumnos inscriptos
        </Text>

        <Text style={styles.emptyText}>
          Cuando existan alumnos inscriptos en esta cursada,
          aparecerán aquí para registrar su asistencia.
        </Text>
      </View>

      <AppButton
        title="Volver"
        onPress={() => router.back()}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    padding: theme.spacing.lg,
    gap: theme.spacing.md,
  },

  title: {
    fontSize: theme.fontSize.xl,
    fontWeight: "700",
    color: theme.colors.text,
  },

  emptyCard: {
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.lg,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },

  emptyTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: "700",
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },

  emptyText: {
    fontSize: theme.fontSize.md,
    color: theme.colors.textSecondary,
    lineHeight: 22,
  },
});