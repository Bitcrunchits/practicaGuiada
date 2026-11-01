import { useEffect, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";

import { AppButton } from "@/components/ui/AppButton";
import { AppCard } from "@/components/ui/AppCard";
import { AppScreenHeader } from "@/components/ui/AppScreenHeader";
import { FeedbackState } from "@/components/ui/FeedbackState";
import { Screen } from "@/components/ui/Screen";
import { ScreenFooter } from "@/components/ui/ScreenFooter";
import { Skeleton } from "@/components/ui/Skeleton";
import { theme } from "@/constants/theme";
import { useSession } from "@/features/auth/useSession";
import { getMyCourseOfferings } from "@/features/teacher/services/teacher.service";
import { CourseOffering } from "@/features/teacher/services/teacher.types";

const OFFERINGS_STATUS = {
  LOADING: "loading",
  SUCCESS: "success",
  ERROR: "error",
} as const;

type OfferingsStatus =
  (typeof OFFERINGS_STATUS)[keyof typeof OFFERINGS_STATUS];

const SKELETON_ROWS = [1, 2, 3];

const DAY_LABELS: Record<number, string> = {
  0: "Domingo",
  1: "Lunes",
  2: "Martes",
  3: "Miércoles",
  4: "Jueves",
  5: "Viernes",
  6: "Sábado",
  7: "Domingo",
};

function getTrimmedValue(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function getSubjectTitle(offering: CourseOffering): string {
  return getTrimmedValue(offering.subject?.name) || "Materia sin nombre";
}

function getOfferingSubtitle(offering: CourseOffering): string {
  const commission = getTrimmedValue(offering.commission);
  const shift = getTrimmedValue(offering.shift);
  const parts: string[] = [];

  if (commission) {
    parts.push(`Comisión ${commission}`);
  }

  if (shift) {
    parts.push(`Turno ${shift}`);
  }

  return parts.length > 0 ? parts.join(" · ") : "Cursada sin datos";
}

function getScheduleLabel(offering: CourseOffering): string {
  const dayLabel = DAY_LABELS[offering.dayOfWeek] ?? "";
  const startTime = getTrimmedValue(offering.startTime);
  const endTime = getTrimmedValue(offering.endTime);
  const timeRange =
    startTime && endTime
      ? `${startTime} - ${endTime}`
      : startTime || endTime;

  return [dayLabel, timeRange].filter(Boolean).join(" · ") || "A confirmar";
}

function getClassroomLabel(offering: CourseOffering): string {
  return getTrimmedValue(offering.classroom) || "A confirmar";
}

export default function TeacherAttendanceScreen() {
  const { token } = useSession();

  const [offerings, setOfferings] = useState<CourseOffering[]>([]);
  const [status, setStatus] = useState<OfferingsStatus>(
    OFFERINGS_STATUS.LOADING
  );
  const [errorMessage, setErrorMessage] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;

    const loadOfferings = async () => {
      if (!token) {
        setErrorMessage(
          "No pudimos validar tu sesión. Volvé a iniciar sesión."
        );
        setStatus(OFFERINGS_STATUS.ERROR);
        return;
      }

      setStatus(OFFERINGS_STATUS.LOADING);
      setErrorMessage("");

      try {
        const response = await getMyCourseOfferings(token);

        if (cancelled) {
          return;
        }

        if (!Array.isArray(response.data)) {
          setErrorMessage(
            "La respuesta del servidor no es válida. Volvé a intentarlo."
          );
          setStatus(OFFERINGS_STATUS.ERROR);
          return;
        }

        setOfferings(response.data);
        setStatus(OFFERINGS_STATUS.SUCCESS);
      } catch {
        if (cancelled) {
          return;
        }

        setErrorMessage(
          "No pudimos cargar tus cursadas. Revisá tu conexión y volvé a intentarlo."
        );
        setStatus(OFFERINGS_STATUS.ERROR);
      }
    };

    loadOfferings();

    return () => {
      cancelled = true;
    };
  }, [token, reloadKey]);

  const handleRetry = () => {
    setStatus(OFFERINGS_STATUS.LOADING);
    setErrorMessage("");
    setReloadKey((current) => current + 1);
  };

  const handleBack = () => {
    router.back();
  };

  return (
    <Screen
      header={
        <AppScreenHeader
          title="Mis cursadas"
          subtitle="Materias que tenés asignadas"
          onBack={handleBack}
        />
      }
      footer={<ScreenFooter onBack={handleBack} />}
    >
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.sectionTitle}>Cursadas asignadas</Text>

        {status === OFFERINGS_STATUS.LOADING ? (
          <View style={styles.list}>
            {SKELETON_ROWS.map((row) => (
              <View key={row} style={styles.skeletonCard}>
                <Skeleton width="65%" height={18} />
                <Skeleton width="45%" height={14} />
                <Skeleton width="55%" height={14} />
                <Skeleton width="40%" height={14} />
              </View>
            ))}
          </View>
        ) : null}

        {status === OFFERINGS_STATUS.ERROR ? (
          <View style={styles.feedback}>
            <FeedbackState type="error" message={errorMessage} />

            <AppButton title="Reintentar" onPress={handleRetry} />
          </View>
        ) : null}

        {status === OFFERINGS_STATUS.SUCCESS && offerings.length === 0 ? (
          <AppCard
            title="No tenés cursadas asignadas"
            subtitle="Cuando te asignen una cursada, aparecerá en esta lista."
          />
        ) : null}

        {status === OFFERINGS_STATUS.SUCCESS && offerings.length > 0 ? (
          <View style={styles.list}>
            {offerings.map((offering) => (
              <AppCard
                key={offering.id}
                title={getSubjectTitle(offering)}
                subtitle={getOfferingSubtitle(offering)}
                onPress={() =>
                  router.push({
                    pathname:
                      "/(private)/teacher/attendance/[offeringId]",
                    params: {
                      offeringId: offering.id,
                      subjectName: getTrimmedValue(
                        offering.subject?.name
                      ),
                      commission: getTrimmedValue(
                        offering.commission
                      ),
                    },
                  })
                }
              >
                <Text style={styles.detailText}>
                  Horario: {getScheduleLabel(offering)}
                </Text>

                <Text style={styles.detailText}>
                  Aula: {getClassroomLabel(offering)}
                </Text>
              </AppCard>
            ))}
          </View>
        ) : null}
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
    paddingBottom: theme.spacing.xl,
    gap: theme.spacing.md,
  },

  sectionTitle: {
    color: theme.colors.primary,
    fontSize: theme.fontSize.lg,
    fontWeight: "700",
  },

  list: {
    gap: theme.spacing.sm,
  },

  skeletonCard: {
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.md,
    borderRadius: theme.radius.none,
    borderWidth: 1,
    borderColor: theme.colors.border,
    gap: theme.spacing.sm,
  },

  feedback: {
    paddingTop: theme.spacing.md,
    gap: theme.spacing.sm,
  },

  detailText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
  },
});
