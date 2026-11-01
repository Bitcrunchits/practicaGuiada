import { useEffect, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";

import { AppButton } from "@/components/ui/AppButton";
import { AppCard } from "@/components/ui/AppCard";
import { AppScreenHeader } from "@/components/ui/AppScreenHeader";
import { FeedbackState } from "@/components/ui/FeedbackState";
import { Screen } from "@/components/ui/Screen";
import { ScreenFooter } from "@/components/ui/ScreenFooter";
import { Skeleton } from "@/components/ui/Skeleton";
import { theme } from "@/constants/theme";
import {
  buildOfferingAttendanceSummary,
  type StudentAttendanceSummary,
} from "@/features/attendance/attendance.summary";
import { useSession } from "@/features/auth/useSession";
import { getOfferingAttendanceData } from "@/features/teacher/services/teacher.service";

const SCREEN_STATUS = {
  LOADING: "loading",
  SUCCESS: "success",
  ERROR: "error",
} as const;

type ScreenStatus = (typeof SCREEN_STATUS)[keyof typeof SCREEN_STATUS];

type AttendanceSummaryRouteParams = {
  offeringId?: string | string[];
  subjectName?: string | string[];
  commission?: string | string[];
};

const SKELETON_ROWS = [1, 2, 3, 4];

function getSingleParam(
  value: string | string[] | undefined
): string {
  const rawValue = Array.isArray(value) ? value[0] : value;

  return rawValue?.trim() ?? "";
}

function getHeaderSubtitle(
  subjectName: string,
  commission: string
): string {
  const parts = [
    subjectName,
    commission ? `Comisión ${commission}` : "",
  ].filter(Boolean);

  return parts.length > 0 ? parts.join(" · ") : "Cursada";
}

function getStudentSubtitle(student: StudentAttendanceSummary["student"]): string {
  const parts = [
    student.studentNumber ? `Legajo: ${student.studentNumber}` : "",
    student.documentNumber ? `DNI: ${student.documentNumber}` : "",
  ].filter(Boolean);

  return parts.length > 0 ? parts.join(" · ") : "Sin datos de legajo";
}

function getPercentageLabel(percentage: number | null): string {
  return percentage === null ? "—" : `${percentage}%`;
}

function getCountsLabel(summary: StudentAttendanceSummary): string {
  const { counts } = summary;

  return `P ${counts.PRESENT} · A ${counts.ABSENT} · T ${counts.LATE} · J ${counts.JUSTIFIED}`;
}

function getAttendanceLine(summary: StudentAttendanceSummary): string {
  if (summary.totalMarked === 0) {
    return "Sin registros hasta hoy";
  }

  return `${summary.attended} de ${summary.totalMarked} clases con asistencia`;
}

export default function OfferingAttendanceSummaryScreen() {
  const { token } = useSession();
  const params = useLocalSearchParams<AttendanceSummaryRouteParams>();

  const offeringId = getSingleParam(params.offeringId);
  const subjectName = getSingleParam(params.subjectName);
  const commission = getSingleParam(params.commission);

  const [summaries, setSummaries] = useState<StudentAttendanceSummary[]>([]);
  const [status, setStatus] = useState<ScreenStatus>(
    SCREEN_STATUS.LOADING
  );
  const [errorMessage, setErrorMessage] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;

    const loadSummary = async () => {
      if (!offeringId) {
        setErrorMessage(
          "No pudimos identificar la cursada. Volvé a la lista y elegí una de nuevo."
        );
        setStatus(SCREEN_STATUS.ERROR);
        return;
      }

      if (!token) {
        setErrorMessage(
          "No pudimos validar tu sesión. Volvé a iniciar sesión."
        );
        setStatus(SCREEN_STATUS.ERROR);
        return;
      }

      setStatus(SCREEN_STATUS.LOADING);
      setErrorMessage("");

      try {
        const data = await getOfferingAttendanceData(offeringId, token);

        if (cancelled) {
          return;
        }

        setSummaries(
          buildOfferingAttendanceSummary(
            data.students,
            data.sessions,
            data.attendanceBySession
          )
        );
        setStatus(SCREEN_STATUS.SUCCESS);
      } catch {
        if (cancelled) {
          return;
        }

        setErrorMessage(
          "No pudimos cargar las asistencias de esta cursada. Revisá tu conexión y volvé a intentarlo."
        );
        setStatus(SCREEN_STATUS.ERROR);
      }
    };

    loadSummary();

    return () => {
      cancelled = true;
    };
  }, [offeringId, token, reloadKey]);

  const handleRetry = () => {
    setStatus(SCREEN_STATUS.LOADING);
    setErrorMessage("");
    setReloadKey((current) => current + 1);
  };

  const handleBack = () => {
    router.back();
  };

  const handleOpenHistory = (summary: StudentAttendanceSummary) => {
    const { student } = summary;

    router.push({
      pathname:
        "/(private)/teacher/attendance/[offeringId]/student-attendance/[studentId]",
      params: {
        offeringId,
        studentId: student.id,
        studentName: `${student.firstName} ${student.lastName}`,
        subjectName,
        commission,
      },
    });
  };

  return (
    <Screen
      header={
        <AppScreenHeader
          title="Consultar asistencias"
          subtitle={getHeaderSubtitle(subjectName, commission)}
          meta="Hasta hoy"
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
        {status === SCREEN_STATUS.LOADING ? (
          <View style={styles.list}>
            {SKELETON_ROWS.map((row) => (
              <View key={row} style={styles.skeletonCard}>
                <Skeleton width="60%" height={18} />
                <Skeleton width="85%" height={14} />
                <Skeleton width="100%" height={40} />
              </View>
            ))}
          </View>
        ) : null}

        {status === SCREEN_STATUS.ERROR ? (
          <View style={styles.feedback}>
            <FeedbackState type="error" message={errorMessage} />

            <AppButton title="Reintentar" onPress={handleRetry} />
          </View>
        ) : null}

        {status === SCREEN_STATUS.SUCCESS && summaries.length === 0 ? (
          <AppCard
            title="No hay alumnos inscriptos"
            subtitle="Cuando existan alumnos inscriptos en esta cursada, aparecerán aquí."
          />
        ) : null}

        {status === SCREEN_STATUS.SUCCESS && summaries.length > 0 ? (
          <>
            <Text style={styles.sectionTitle}>Alumnos</Text>

            <FeedbackState
              type="info"
              message="El porcentaje cuenta Presente, Tarde y Justificado como asistencia."
            />

            <View style={styles.list}>
              {summaries.map((summary) => {
                const { student } = summary;

                return (
                  <AppCard
                    key={student.id}
                    title={`${student.firstName} ${student.lastName}`}
                    subtitle={getStudentSubtitle(student)}
                  >
                    <View style={styles.metricsRow}>
                      <Text style={styles.percentage}>
                        {getPercentageLabel(summary.percentage)}
                      </Text>

                      <Text style={styles.counts}>
                        {getCountsLabel(summary)}
                      </Text>
                    </View>

                    <Text style={styles.attendanceLine}>
                      {getAttendanceLine(summary)}
                    </Text>

                    <AppButton
                      title="Ver historial"
                      variant="secondary"
                      onPress={() => handleOpenHistory(summary)}
                    />
                  </AppCard>
                );
              })}
            </View>
          </>
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
    gap: theme.spacing.lg,
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

  metricsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: theme.spacing.sm,
  },

  percentage: {
    color: theme.colors.primary,
    fontSize: theme.fontSize.xl,
    fontWeight: "700",
  },

  counts: {
    color: theme.colors.textSecondary,
    fontSize: theme.fontSize.sm,
    fontWeight: "600",
    flexShrink: 1,
  },

  attendanceLine: {
    color: theme.colors.text,
    fontSize: theme.fontSize.sm,
    lineHeight: 20,
  },
});
