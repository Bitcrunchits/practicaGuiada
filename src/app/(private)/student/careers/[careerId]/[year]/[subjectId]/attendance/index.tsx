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
import { ApiError } from "@/lib/api/api.client";
import { formatSessionDate } from "@/lib/format/date";
import { useSession } from "@/features/auth/useSession";
import {
  getAttendanceStatusLabel,
  getAttendanceStatusTone,
} from "@/features/attendance/attendance.types";
import { getMyAttendance } from "@/features/student/services/student.service";
import {
  StudentAttendanceData,
  StudentAttendanceRecord,
  StudentAttendanceTotals,
} from "@/features/student/student.types";

const ATTENDANCE_STATUS = {
  LOADING: "loading",
  SUCCESS: "success",
  ERROR: "error",
} as const;

type AttendanceStatus = (typeof ATTENDANCE_STATUS)[keyof typeof ATTENDANCE_STATUS];

type AttendanceRouteParams = {
  courseOfferingId?: string | string[];
  subjectName?: string | string[];
};

function getSingleParam(
  value: string | string[] | undefined
): string {
  const rawValue = Array.isArray(value) ? value[0] : value;
  return rawValue?.trim() ?? "";
}

function isAttendanceRecord(
  value: unknown
): value is StudentAttendanceRecord {
  return typeof value === "object" && value !== null;
}

function toCount(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function normalizeAttendance(
  data: StudentAttendanceData
): StudentAttendanceData {
  const totals = data.totals;
  const records = data.records;

  return {
    totals: {
      PRESENT: toCount(totals?.PRESENT),
      ABSENT: toCount(totals?.ABSENT),
      LATE: toCount(totals?.LATE),
      JUSTIFIED: toCount(totals?.JUSTIFIED),
    },
    records: Array.isArray(records)
      ? records.filter(isAttendanceRecord)
      : [],
  };
}

function getRecordDateValue(record: StudentAttendanceRecord): unknown {
  return (
    record.classSession?.date ??
    record.session?.date ??
    record.date
  );
}

function getRecordDateLabel(record: StudentAttendanceRecord): string {
  const value = getRecordDateValue(record);

  if (typeof value !== "string" || value.trim().length === 0) {
    return "Fecha sin informar";
  }

  return formatSessionDate(value);
}

function getRecordSortDate(record: StudentAttendanceRecord): string {
  const value = getRecordDateValue(record);

  if (typeof value !== "string") {
    return "";
  }

  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value.trim());

  if (!match) {
    return "";
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const candidate = new Date(year, month - 1, day);

  const isRealDate =
    candidate.getFullYear() === year &&
    candidate.getMonth() === month - 1 &&
    candidate.getDate() === day;

  return isRealDate
    ? `${match[1]}-${match[2]}-${match[3]}`
    : "";
}

function getRecordTopic(record: StudentAttendanceRecord): string {
  const value =
    record.classSession?.topic ??
    record.session?.topic ??
    record.topic;

  if (typeof value !== "string") {
    return "Sin tema registrado";
  }

  const trimmedValue = value.trim();

  return trimmedValue.length > 0
    ? trimmedValue
    : "Sin tema registrado";
}

function getRecordObservation(record: StudentAttendanceRecord): string {
  if (typeof record.observation !== "string") {
    return "";
  }

  return record.observation.trim();
}

function sortAttendanceRecords(
  records: StudentAttendanceRecord[]
): StudentAttendanceRecord[] {
  return records
    .map((record, index) => ({
      record,
      index,
      sortDate: getRecordSortDate(record),
    }))
    .sort((left, right) => {
      if (left.sortDate && right.sortDate) {
        if (left.sortDate === right.sortDate) {
          return left.index - right.index;
        }

        return left.sortDate < right.sortDate ? 1 : -1;
      }

      if (left.sortDate) {
        return -1;
      }

      if (right.sortDate) {
        return 1;
      }

      return left.index - right.index;
    })
    .map((item) => item.record);
}

function getAttendanceErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.status === 401) {
      return "Tu sesión expiró. Volvé a iniciar sesión.";
    }

    if (error.status === 403) {
      return "No tenés permisos para ver esta asistencia.";
    }

    if (error.status === 404) {
      return "No encontramos la asistencia de esta cursada.";
    }
  }

  return "No pudimos cargar la asistencia. Revisá tu conexión y volvé a intentarlo.";
}

const ATTENDANCE_TYPES = [
  { key: "PRESENT", label: "Presentes", tone: "present" as const, icon: "●" },
  { key: "ABSENT", label: "Ausentes", tone: "absent" as const, icon: "●" },
  { key: "LATE", label: "Tardanzas", tone: "late" as const, icon: "●" },
  { key: "JUSTIFIED", label: "Justificadas", tone: "justified" as const, icon: "●" },
] as const;

const TOTAL_CARDS = [
  { key: "PRESENT", label: "Presentes" },
  { key: "ABSENT", label: "Ausentes" },
  { key: "LATE", label: "Tardanzas" },
  { key: "JUSTIFIED", label: "Justificadas" },
] as const;

const EMPTY_TOTALS: StudentAttendanceTotals = {
  PRESENT: 0,
  ABSENT: 0,
  LATE: 0,
  JUSTIFIED: 0,
};

export default function StudentAttendanceScreen() {
  const { token } = useSession();
  const params = useLocalSearchParams<AttendanceRouteParams>();

  const courseOfferingId = getSingleParam(params.courseOfferingId);
  const subjectName = getSingleParam(params.subjectName);

  const [attendance, setAttendance] =
    useState<StudentAttendanceData | null>(null);
  const [status, setStatus] = useState<AttendanceStatus>(
    ATTENDANCE_STATUS.LOADING
  );
  const [errorMessage, setErrorMessage] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;

    const loadAttendance = async () => {
      if (!courseOfferingId) {
        setErrorMessage(
          "No pudimos identificar la cursada. Volvé a la lista y elegí una de nuevo."
        );
        setStatus(ATTENDANCE_STATUS.ERROR);
        return;
      }

      if (!token) {
        setErrorMessage(
          "No pudimos validar tu sesión. Volvé a iniciar sesión."
        );
        setStatus(ATTENDANCE_STATUS.ERROR);
        return;
      }

      setStatus(ATTENDANCE_STATUS.LOADING);
      setErrorMessage("");

      try {
        const response = await getMyAttendance(
          courseOfferingId,
          token
        );

        if (cancelled) {
          return;
        }

        const data = response.data;

        if (!data || typeof data !== "object" || Array.isArray(data)) {
          setErrorMessage(
            "La respuesta del servidor no es válida. Volvé a intentarlo."
          );
          setStatus(ATTENDANCE_STATUS.ERROR);
          return;
        }

        setAttendance(normalizeAttendance(data));
        setStatus(ATTENDANCE_STATUS.SUCCESS);
      } catch (error) {
        if (cancelled) {
          return;
        }

        setErrorMessage(getAttendanceErrorMessage(error));
        setStatus(ATTENDANCE_STATUS.ERROR);
      }
    };

    loadAttendance();

    return () => {
      cancelled = true;
    };
  }, [courseOfferingId, token, reloadKey]);

  const handleRetry = () => {
    setAttendance(null);
    setErrorMessage("");
    setStatus(ATTENDANCE_STATUS.LOADING);
    setReloadKey((current) => current + 1);
  };

  const handleBack = () => {
    router.back();
  };

  const headerSubtitle =
    subjectName || "Resumen de tu cursada";

  const totals = attendance?.totals ?? EMPTY_TOTALS;
  const sortedRecords = attendance
    ? sortAttendanceRecords(attendance.records)
    : [];
  const totalClasses =
    totals.PRESENT + totals.ABSENT + totals.LATE + totals.JUSTIFIED;
  const attended =
    totals.PRESENT + totals.LATE + totals.JUSTIFIED;
  const attendanceRate =
    totalClasses > 0 ? Math.round((attended / totalClasses) * 100) : 0;

  return (
    <Screen
      header={
        <AppScreenHeader
          title="Asistencia"
          subtitle={headerSubtitle}
          onBack={handleBack}
          compact
        />
      }
      footer={<ScreenFooter onBack={handleBack} />}
    >
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {status === ATTENDANCE_STATUS.LOADING ? (
          <View style={styles.loadingContainer}>
            <Skeleton width="40%" height={16} />
            <Skeleton width="80%" height={24} />
            <Skeleton width="100%" height={200} />
          </View>
        ) : null}

        {status === ATTENDANCE_STATUS.ERROR ? (
          <View style={styles.feedback}>
            <FeedbackState type="error" message={errorMessage} />

            <AppButton title="Reintentar" onPress={handleRetry} />

            <AppButton
              title="Volver"
              variant="secondary"
              onPress={handleBack}
            />
          </View>
        ) : null}

        {status === ATTENDANCE_STATUS.SUCCESS && attendance ? (
          <View style={styles.sections}>
            {/* Resumen general */}
            <AppCard style={styles.summaryCard}>
              <View style={styles.summaryHeader}>
                <Text style={styles.summaryTitle}>Tu asistencia</Text>
                <Text style={styles.percentageValue}>
                  {attendanceRate}%
                </Text>
              </View>
              <View style={styles.progressBarContainer}>
                <View style={styles.progressBarTrack}>
                  <View
                    style={[
                      styles.progressBarFill,
                      {
                        width: `${attendanceRate}%`,
                      },
                    ]}
                  />
                </View>
                <Text style={styles.percentageLabel}>
                  {attended} de {totalClasses} clases
                </Text>
</View>

              {/* Sándwich de estados de asistencia - tarjetas apiladas */}
              <View style={styles.sandwichContainer}>
                {ATTENDANCE_TYPES.map((type) => {
                  const count = totals[type.key];
                  const percentage =
                    totalClasses > 0
                      ? Math.round((count / totalClasses) * 100)
                      : 0;
                  return (
                    <AppCard
                      key={type.key}
                      style={styles.attendanceCard}
                    >
                      <View style={styles.attendanceCardContent}>
                        <View style={styles.attendanceCardLeft}>
                          <StatusBadge
                            label={type.icon}
                            tone={type.tone}
                          />
                          <Text style={styles.attendanceLabel}>
                            {type.label}
                          </Text>
                          <Text style={styles.attendanceCount}>
                            {count} clase{count !== 1 ? "s" : ""}
                          </Text>
                        </View>
                        <View style={styles.attendanceCardRight}>
                          <Text style={styles.attendancePercentage}>
                            {count} ({percentage}%)
                          </Text>
                          <View style={styles.miniProgressContainer}>
                            <View style={styles.miniProgressTrack}>
                              <View
                                style={[
                                  styles.miniProgressFill,
                                  {
                                    width: `${percentage}%`,
                                  },
                                ]}
                              />
                            </View>
                          </View>
                        </View>
                      </View>
                    </AppCard>
                  );
                })}
              </View>
            </AppCard>

              {/* Historial */}
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>Historial</Text>
                  <Text style={styles.sectionCount}>
                    {sortedRecords.length === 1
                      ? "1 registro"
                      : `${sortedRecords.length} registros`}
                  </Text>
                </View>

                {sortedRecords.length === 0 ? (
                  <AppCard>
                    <Text style={styles.emptyText}>
                      Todavía no hay registros de asistencia.
                    </Text>
                  </AppCard>
                ) : (
                  <View style={styles.list}>
                    {sortedRecords.map((record, index) => (
                      <AppCard
                        key={
                          record.id ??
                          record.classSessionId ??
                          `record-${index}`
                        }
                        title={getRecordDateLabel(record)}
                        subtitle={getRecordTopic(record)}
                      >
                        <StatusBadge
                          label={getAttendanceStatusLabel(record.status)}
                          tone={getAttendanceStatusTone(record.status)}
                        />

                        {getRecordObservation(record) ? (
                          <Text style={styles.observation}>
                            Observación: {getRecordObservation(record)}
                          </Text>
                        ) : null}
                      </AppCard>
                    ))}
                  </View>
                )}
              </View>
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
    paddingHorizontal: theme.spacing.lg,
  },

  sections: {
    gap: theme.spacing.md,
  },

  summaryCard: {
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.md,
    borderRadius: theme.radius.none,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },

  summaryHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: theme.spacing.md,
  },

  summaryTitle: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: theme.spacing.sm,
  },

  percentageContainer: {
    alignItems: "center",
    marginBottom: theme.spacing.md,
  },

  percentageValue: {
    fontSize: theme.fontSize.xl,
    fontWeight: "800",
    color: theme.colors.navy,
  },

  percentageLabel: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.xs,
  },

  progressBarContainer: {
    width: "100%",
    height: 8,
    backgroundColor: theme.colors.border,
    borderRadius: theme.radius.md,
    overflow: "hidden",
    marginTop: theme.spacing.sm,
  },

  progressBarTrack: {
    backgroundColor: theme.colors.border,
    height: 8,
  },

  progressBarFill: {
    height: "100%",
    backgroundColor: theme.colors.accent,
    borderRadius: theme.radius.md,
  },

  totalsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing.sm,
  },

  totalCard: {
    flexBasis: "47%",
    flexGrow: 1,
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.md,
    borderRadius: theme.radius.none,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: "center",
    justifyContent: "center",
  },

  totalValue: {
    fontSize: theme.fontSize.xl,
    fontWeight: "800",
    color: theme.colors.navy,
  },

  section: {
    gap: theme.spacing.sm,
  },

  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: theme.spacing.sm,
  },

  sectionTitle: {
    color: theme.colors.primary,
    fontSize: theme.fontSize.lg,
    fontWeight: "700",
  },

  sectionCount: {
    color: theme.colors.textSecondary,
    fontSize: theme.fontSize.sm,
  },

  list: {
    gap: theme.spacing.sm,
  },

  observation: {
    color: theme.colors.textSecondary,
    fontSize: theme.fontSize.sm,
  },

emptyText: {
    color: theme.colors.textSecondary,
    textAlign: "center",
  },

  feedback: {
    gap: theme.spacing.sm,
    paddingTop: theme.spacing.md,
  },

loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: theme.spacing.lg,
  },

  /* Estilos para el sándwich de asistencia */
  sandwichContainer: {
    gap: theme.spacing.xs,
    marginTop: theme.spacing.sm,
  },

  attendanceCard: {
    padding: theme.spacing.sm,
    borderRadius: theme.radius.none,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },

  attendanceCardContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  attendanceCardLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.xs,
    flex: 1,
  },

  attendanceLabel: {
    fontSize: theme.fontSize.sm,
    fontWeight: "600",
    color: theme.colors.text,
  },

  attendanceCount: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textSecondary,
  },

  attendanceCardRight: {
    alignItems: "flex-end",
    gap: 2,
  },

  attendancePercentage: {
    fontSize: theme.fontSize.sm,
    fontWeight: "600",
    color: theme.colors.text,
  },

  miniProgressContainer: {
    width: 80,
    height: 4,
  },

  miniProgressTrack: {
    ...StyleSheet.absoluteFill,
    backgroundColor: theme.colors.surface,
    borderRadius: 2,
  },

  miniProgressFill: {
    ...StyleSheet.absoluteFill,
    backgroundColor: theme.colors.accent,
    borderRadius: 2,
  },
});