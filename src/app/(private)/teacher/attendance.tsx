import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { router } from "expo-router";

import { AppButton } from "@/components/ui/AppButton";
import { theme } from "@/constants/theme";
import { useSession } from "@/features/auth/useSession";
import { getMyCourseOfferings } from "@/features/teacher/services/teacher.service";
import { CourseOffering } from "@/features/teacher/teacher.types";

export default function TeacherAttendanceScreen() {
  const { token } = useSession();

  const [offerings, setOfferings] = useState<CourseOffering[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadOfferings = async () => {
      if (!token) {
        setIsLoading(false);
        return;
      }

      try {
        const response = await getMyCourseOfferings(token);

        setOfferings(response.data);
      } catch (error) {
        console.error("ERROR COURSE OFFERINGS:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadOfferings();
  }, [token]);

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />

        <Text style={styles.loadingText}>
          Cargando cursadas...
        </Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.container}
    >
      <Text style={styles.title}>Asistencia</Text>

      <Text style={styles.subtitle}>
        Seleccioná una cursada
      </Text>

      {offerings.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyTitle}>
            No tenés cursadas asignadas
          </Text>

          <Text style={styles.emptyText}>
            Las cursadas asignadas aparecerán aquí.
          </Text>
        </View>
      ) : (
        offerings.map((offering) => (
          <View key={offering.id} style={styles.card}>
            <Text style={styles.subject}>
              {offering.subject.name}
            </Text>

            <Text style={styles.detail}>
              Comisión: {offering.commission}
            </Text>

            <Text style={styles.detail}>
              Turno: {offering.shift}
            </Text>

            <Text style={styles.detail}>
              Horario: {offering.startTime} - {offering.endTime}
            </Text>

            <Text style={styles.detail}>
              Aula: {offering.classroom}
            </Text>

            <View style={styles.buttonContainer}>
              <AppButton
                title="Ver alumnos"
                onPress={() =>
                  router.push({
                    pathname:
                      "/(private)/teacher/attendance/[offeringId]",
                    params: {
                      offeringId: offering.id,
                    },
                  })
                }
              />
            </View>
          </View>
        ))
      )}

      <AppButton
        title="Volver"
        onPress={() => router.back()}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },

  container: {
    padding: theme.spacing.lg,
    gap: theme.spacing.md,
  },

  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: theme.colors.background,
  },

  loadingText: {
    marginTop: theme.spacing.sm,
    color: theme.colors.textSecondary,
  },

  title: {
    fontSize: theme.fontSize.xl,
    fontWeight: "700",
    color: theme.colors.text,
  },

  subtitle: {
    fontSize: theme.fontSize.md,
    color: theme.colors.textSecondary,
  },

  card: {
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.lg,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },

  subject: {
    fontSize: theme.fontSize.lg,
    fontWeight: "700",
    color: theme.colors.primary,
    marginBottom: theme.spacing.sm,
  },

  detail: {
    fontSize: theme.fontSize.md,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.xs,
  },

  buttonContainer: {
    marginTop: theme.spacing.md,
  },

  empty: {
    padding: theme.spacing.lg,
    backgroundColor: theme.colors.surface,
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
  },
});