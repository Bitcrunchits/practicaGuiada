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
import { StatusBadge } from "@/components/ui/StatusBadge";
import { theme } from "@/constants/theme";
import {
  buildOfferingAttendanceSummary,
  type StudentAttendanceSummary,
} from "@/features/attendance/attendance.summary";
import {
  getAttendanceStatusLabel,
  getAttendanceStatusTone,
} from "@/features/attendance/attendance.types";
import { useSession } from "@/features/auth/useSession";
import { getOfferingAttendanceData } from "@/features/teacher/services/teacher.service";
import { formatSessionDate } from "@/lib/format/date";

const SCREEN_STATUS = {
  LOADING: "loading",
  SUCCESS: "success",
  ERROR: "error",
} as const;

type ScreenStatus = (typeof SCREEN_STATUS)[keyof typeof SCREEN_STATUS];

type StudentAttendanceRouteParams = {
  offeringId?: string | string[];
  studentId?: string | string[];
  studentName?: string | string[];
  subjectName?: string | string[];
  commission?: string | string[];
};

const SKELETON_ROWS = [1, 2, 3];

function getSingleParam(
  value: string | string[] | undefined
): string {
  const rawValue = Array.isArray(value) ? value[0] : value;

  return rawValue?.trim() ?? "";
}

function getHeaderMeta(
  subjectName: string,
  commission: string
): string {
  const parts = [
    subjectName,
    commission ? `Comisión ${commission}` : "",
  ].filter(Boolean);

  return parts.length > 0 ? parts.join(" · ") : "Cursada";
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

function getRecordTopicLabel(topic: string | null): string {
  const trimmedTopic = topic?.trim() ?? "";

  return trimmedTopic.length > 0 ? trimmedTopic : "Sin tema registrado";
}

export default function StudentAttendanceHistoryScreen() {
  const { token } = useSession();
  const params = useLocalSearchParams<StudentAttendanceRouteParams>();

  const offeringId = getSingleParam(params.offeringId);
  const studentId = getSingleParam(params.studentId);
  const studentName = getSingleParam(params.studentName);
  const subjectName = getSingleParam(params.subjectName);
  const commission = getSingleParam(params.commission);

  const [summary, setSummary] = useState<StudentAttendanceSummary | null>(
    null
  );
  const [status, setStatus] = useState<ScreenStatus>(
    SCREEN_STATUS.LOADING
  );
  const [errorMessage, setErrorMessage] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;

    const loadStudentHistory = async () => {
      if (!offeringId) {
        setErrorMessage(
          "No pudimos identificar la cursada. Volvé a la lista y elegí una de nuevo."
        );
        setStatus(SCREEN_STATUS.ERROR);
        return;
      }

      if (!studentId) {
        setErrorMessage(
          "No pudimos identificar al alumno. Volvé a la lista y elegí uno de nuevo."
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

        const summaries = buildOfferingAttendanceSummary(
          data.students,
          data.sessions,
          data.attendanceBySession
        );
        const studentSummary =
          summaries.find((item) => item.student.id === studentId) ?? null;

        setSummary(studentSummary);
        setStatus(SCREEN_STATUS.SUCCESS);
      } catch {
        if (cancelled) {
          return;
        }

        setErrorMessage(
          "No pudimos cargar el historial del alumno. Revisá tu conexión y volvé a intentarlo."
        );
        setStatus(SCREEN_STATUS.ERROR);
      }
    };

    loadStudentHistory();

    return () => {
      cancelled = true;
    };
  }, [offeringId, studentId, token, reloadKey]);

  const handleRetry = () => {
    setStatus(SCREEN_STATUS.LOADING);
    setErrorMessage("");
    setReloadKey((current) => current + 1);
  };

  const handleBack = () => {
    router.back();
  };

  const loadedStudentName = summary
    ? `${summary.student.firstName} ${summary.student.lastName}`
    : "";
  const headerSubtitle = studentName || loadedStudentName || undefined;

  return (
    <Screen
      header={
        <AppScreenHeader
          title="Historial del alumno"
          subtitle={headerSubtitle}
          meta={getHeaderMeta(subjectName, commission)}
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
                <Skeleton width="55%" height={18} />
                <Skeleton width="80%" height={14} />
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

        {status === SCREEN_STATUS.SUCCESS && !summary ? (
          <FeedbackState
            type="error"
            message="No encontramos al alumno en esta cursada."
          />
        ) : null}

        {status === SCREEN_STATUS.SUCCESS && summary ? (
          <>
            <AppCard title="Resumen">
              <View style={styles.metricsRow}>
                <Text style={styles.percentage}>
                  {getPercentageLabel(summary.percentage)}
                </Text>

                <Text style={styles.counts}>{getCountsLabel(summary)}</Text>
              </View>

              <Text style={styles.attendanceLine}>
                {getAttendanceLine(summary)}
              </Text>
            </AppCard>

            <Text style={styles.sectionTitle}>Registros</Text>

            {summary.records.length === 0 ? (
              <AppCard
                title="Sin registros"
                subtitle="Este alumno no tiene asistencias registradas hasta hoy."
              />
            ) : (
              <View style={styles.list}>
                {summary.records.map((record) => {
                  const observation = record.observation?.trim() ?? "";

                  return (
                    <AppCard
                      key={record.sessionId}
                      title={formatSessionDate(record.date)}
                      subtitle={getRecordTopicLabel(record.topic)}
                    >
                      <StatusBadge
                        label={getAttendanceStatusLabel(record.status)}
                        tone={getAttendanceStatusTone(record.status)}
                      />

                      {observation ? (
                        <Text style={styles.observation}>
                          Observación: {observation}
                        </Text>
                      ) : null}
                    </AppCard>
                  );
                })}
              </View>
            )}
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

  observation: {
    color: theme.colors.textSecondary,
    fontSize: theme.fontSize.sm,
    lineHeight: 20,
  },
});
