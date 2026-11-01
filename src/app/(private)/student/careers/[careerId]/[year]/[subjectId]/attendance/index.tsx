import { useEffect, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";

import { AppButton } from "@/components/ui/AppButton";
import { AppCard } from "@/components/ui/AppCard";
import { AppScreenHeader } from "@/components/ui/AppScreenHeader";
import { FeedbackState } from "@/components/ui/FeedbackState";
import { Screen } from "@/components/ui/Screen";
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

type AttendanceStatus =
  (typeof ATTENDANCE_STATUS)[keyof typeof ATTENDANCE_STATUS];

type AttendanceRouteParams = {
  courseOfferingId?: string | string[];
  subjectName?: string | string[];
};

const TOTAL_CARDS = [
  { key: "PRESENT", label: "Presentes" },
  { key: "ABSENT", label: "Ausentes" },
  { key: "LATE", label: "Tardanzas" },
  { key: "JUSTIFIED", label: "Justificadas" },
] as const;

const SKELETON_TOTALS = [1, 2, 3, 4];

const EMPTY_TOTALS: StudentAttendanceTotals = {
  PRESENT: 0,
  ABSENT: 0,
  LATE: 0,
  JUSTIFIED: 0,
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
  const recordsCountLabel =
    sortedRecords.length === 1
      ? "1 registro"
      : `${sortedRecords.length} registros`;

  return (
    <Screen
      header={
        <AppScreenHeader
          title="Asistencia"
          subtitle={headerSubtitle}
          onBack={handleBack}
        />
      }
    >
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {status === ATTENDANCE_STATUS.LOADING ? (
          <View style={styles.sections}>
            <View style={styles.totalsGrid}>
              {SKELETON_TOTALS.map((row) => (
                <View key={row} style={styles.skeletonTotalCard}>
                  <Skeleton width="60%" height={16} />
                  <Skeleton width={32} height={28} />
                </View>
              ))}
            </View>

            <View style={styles.skeletonHistoryCard}>
              <Skeleton width="35%" height={20} />
              <Skeleton width="85%" height={14} />
              <Skeleton width="65%" height={14} />
            </View>
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
            <View style={styles.totalsGrid}>
              {TOTAL_CARDS.map((card) => (
                <AppCard
                  key={card.key}
                  title={card.label}
                  style={styles.totalCard}
                >
                  <Text style={styles.totalValue}>
                    {totals[card.key]}
                  </Text>
                </AppCard>
              ))}
            </View>

            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Historial</Text>

                <Text style={styles.sectionCount}>
                  {recordsCountLabel}
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
                  {sortedRecords.map((record, index) => {
                    const observation =
                      getRecordObservation(record);

                    return (
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
                          label={getAttendanceStatusLabel(
                            record.status
                          )}
                          tone={getAttendanceStatusTone(
                            record.status
                          )}
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
  },

  sections: {
    gap: theme.spacing.md,
  },

  totalsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing.sm,
  },

  totalCard: {
    flexBasis: "47%",
    flexGrow: 1,
  },

  totalValue: {
    fontSize: theme.fontSize.xxl,
    fontWeight: "800",
    color: theme.colors.primary,
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
    fontSize: theme.fontSize.sm,
  },

  feedback: {
    gap: theme.spacing.sm,
    paddingTop: theme.spacing.md,
  },

  skeletonTotalCard: {
    flexBasis: "47%",
    flexGrow: 1,
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.md,
    borderRadius: 0,
    borderWidth: 1,
    borderColor: theme.colors.border,
    gap: theme.spacing.sm,
  },

  skeletonHistoryCard: {
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.md,
    borderRadius: 0,
    borderWidth: 1,
    borderColor: theme.colors.border,
    gap: theme.spacing.sm,
  },
});
