import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";

import { AppButton } from "@/components/ui/AppButton";
import { theme } from "@/constants/theme";
import { useSession } from "@/features/auth/useSession";
import { getMyAttendance } from "@/features/student/services/student.service";
import { StudentAttendanceData } from "@/features/student/student.types";

export default function StudentAttendanceScreen() {
  const { token } = useSession();

  const { courseOfferingId } = useLocalSearchParams<{
    courseOfferingId: string;
  }>();

  const [attendance, setAttendance] =
    useState<StudentAttendanceData | null>(null);

  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadAttendance = async () => {
      if (!token || !courseOfferingId) {
        setIsLoading(false);
        return;
      }

      try {
        const response = await getMyAttendance(
          courseOfferingId,
          token
        );

        setAttendance(response.data);
      } catch (error) {
        console.error("ERROR ATTENDANCE:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadAttendance();
  }, [token, courseOfferingId]);

  // -----------------------------
  // CARGANDO
  // -----------------------------

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}>
          <ActivityIndicator
            size="large"
            color={theme.colors.primary}
          />

          <Text style={styles.loadingText}>
            Cargando asistencia...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // -----------------------------
  // SIN DATOS
  // -----------------------------

  if (!attendance) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}>
          <Text style={styles.errorTitle}>
            No se pudo cargar la asistencia
          </Text>

          <AppButton
            title="Volver"
            onPress={() => router.back()}
          />
        </View>
      </SafeAreaView>
    );
  }

  const { totals, records } = attendance;

  // -----------------------------
  // PANTALLA
  // -----------------------------

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.title}>
            Asistencia
          </Text>

          <Text style={styles.subtitle}>
            Resumen de tu cursada
          </Text>
        </View>

        {/* PRESENTES */}

        <View style={styles.card}>
          <Text style={styles.cardLabel}>
            Presentes
          </Text>

          <Text style={styles.cardValue}>
            {totals.PRESENT}
          </Text>
        </View>

        {/* AUSENTES */}

        <View style={styles.card}>
          <Text style={styles.cardLabel}>
            Ausentes
          </Text>

          <Text style={styles.cardValue}>
            {totals.ABSENT}
          </Text>
        </View>

        {/* TARDANZAS */}

        <View style={styles.card}>
          <Text style={styles.cardLabel}>
            Tardanzas
          </Text>

          <Text style={styles.cardValue}>
            {totals.LATE}
          </Text>
        </View>

        {/* JUSTIFICADAS */}

        <View style={styles.card}>
          <Text style={styles.cardLabel}>
            Justificadas
          </Text>

          <Text style={styles.cardValue}>
            {totals.JUSTIFIED}
          </Text>
        </View>

        {/* HISTORIAL */}

        <View style={styles.historyCard}>
          <Text style={styles.historyTitle}>
            Historial
          </Text>

          {records.length === 0 ? (
            <Text style={styles.emptyText}>
              Todavía no hay registros de asistencia.
            </Text>
          ) : (
            <Text style={styles.emptyText}>
              Hay {records.length} registros de asistencia.
            </Text>
          )}
        </View>

        <View style={styles.footer}>
          <AppButton
            title="Volver"
            onPress={() => router.back()}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },

  content: {
    padding: theme.spacing.lg,
    gap: theme.spacing.md,
  },

  center: {
    flex: 1,
    justifyContent: "center",
    padding: theme.spacing.lg,
    gap: theme.spacing.md,
  },

  header: {
    marginBottom: theme.spacing.sm,
  },

  title: {
    fontSize: theme.fontSize.xl,
    fontWeight: "700",
    color: theme.colors.text,
  },

  subtitle: {
    marginTop: theme.spacing.xs,
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
  },

  loadingText: {
    textAlign: "center",
    color: theme.colors.textSecondary,
  },

  errorTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: "700",
    color: theme.colors.text,
    textAlign: "center",
  },

  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: theme.spacing.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  cardLabel: {
    fontSize: theme.fontSize.md,
    fontWeight: "600",
    color: theme.colors.text,
  },

  cardValue: {
    fontSize: theme.fontSize.xl,
    fontWeight: "700",
    color: theme.colors.primary,
  },

  historyCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: theme.spacing.md,
  },

  historyTitle: {
    fontSize: theme.fontSize.md,
    fontWeight: "700",
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },

  emptyText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
  },

  footer: {
    marginTop: theme.spacing.md,
  },
});