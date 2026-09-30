import { useEffect, useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { router } from "expo-router";

import { Skeleton } from "@/components/ui/Skeleton";
import { AppButton } from "@/components/ui/AppButton";
import { theme } from "@/constants/theme";
import { useSession } from "@/features/auth/useSession";
import { getMyCourseOfferings } from "@/features/teacher/services/teacher.service";
import { CourseOffering } from "@/features/teacher/services/teacher.types";

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
      <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.container}
    >
      {/* Título */}
      <Skeleton width="40%" height={28} borderRadius={8} />

      {/* Subtítulo */}
      <Skeleton width="55%" height={18} borderRadius={6} />

      {/* Cursada 1 */}
      <View style={styles.card}>
        <Skeleton width="65%" height={22} borderRadius={6} />

        <View style={styles.skeletonDetails}>
          <Skeleton width="40%" height={16} borderRadius={5} />
          <Skeleton width="35%" height={16} borderRadius={5} />
          <Skeleton width="70%" height={16} borderRadius={5} />
          <Skeleton width="45%" height={16} borderRadius={5} />
        </View>

        <View style={styles.skeletonButton}>
          <Skeleton width="100%" height={44} borderRadius={8} />
        </View>
      </View>

      {/* Cursada 2 */}
      <View style={styles.card}>
        <Skeleton width="55%" height={22} borderRadius={6} />

        <View style={styles.skeletonDetails}>
          <Skeleton width="45%" height={16} borderRadius={5} />
          <Skeleton width="30%" height={16} borderRadius={5} />
          <Skeleton width="65%" height={16} borderRadius={5} />
          <Skeleton width="40%" height={16} borderRadius={5} />
        </View>

        <View style={styles.skeletonButton}>
          <Skeleton width="100%" height={44} borderRadius={8} />
        </View>
      </View>
    </ScrollView>
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

  skeletonDetails: {
  gap: theme.spacing.sm,
  marginTop: theme.spacing.md,
},

skeletonButton: {
  marginTop: theme.spacing.md,
},
});