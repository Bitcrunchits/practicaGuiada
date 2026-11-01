import { useEffect, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";

import { AppButton } from "@/components/ui/AppButton";
import { AppCard } from "@/components/ui/AppCard";
import { AppScreenHeader } from "@/components/ui/AppScreenHeader";
import { FeedbackState } from "@/components/ui/FeedbackState";
import { Screen } from "@/components/ui/Screen";
import { Skeleton } from "@/components/ui/Skeleton";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { theme } from "@/constants/theme";
import { ApiError } from "@/lib/api/api.client";
import { useSession } from "@/features/auth/useSession";
import { getMyEnrollments } from "@/features/student/services/student.service";
import {
  StudentEnrollment,
  StudentEnrollmentAcademicYear,
  StudentEnrollmentCondition,
  StudentEnrollmentCourseOffering,
  StudentEnrollmentShift,
  StudentEnrollmentSubject,
} from "@/features/student/student.types";

const ENROLLMENTS_STATUS = {
  LOADING: "loading",
  SUCCESS: "success",
  ERROR: "error",
} as const;

type EnrollmentsStatus =
  (typeof ENROLLMENTS_STATUS)[keyof typeof ENROLLMENTS_STATUS];

type ActiveEnrollmentItem = {
  enrollment: StudentEnrollment;
  offering: StudentEnrollmentCourseOffering;
  subject: StudentEnrollmentSubject;
  academicYear: StudentEnrollmentAcademicYear;
};

type AttendanceRoute = {
  pathname: "/(private)/student/careers/[careerId]/[year]/[subjectId]/attendance";
  params: {
    careerId: string;
    year: string;
    subjectId: string;
    courseOfferingId: string;
    subjectName: string;
  };
};

const SHIFT_LABELS: Record<StudentEnrollmentShift, string> = {
  MORNING: "Mañana",
  AFTERNOON: "Tarde",
  EVENING: "Noche",
  VIRTUAL: "Virtual",
  MIXED: "Mixta",
};

const CONDITION_LABELS: Record<StudentEnrollmentCondition, string> = {
  IN_PROGRESS: "En curso",
  REGULAR: "Regular",
  NOT_REGULAR: "No regular",
  PROMOTED: "Promocionada",
  ABANDONED: "Abandonada",
};

const SKELETON_ROWS = [1, 2, 3, 4];

function getTrimmedString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function getAcademicYearLabel(year: unknown): string {
  if (typeof year === "number" && Number.isFinite(year)) {
    return String(year);
  }

  if (typeof year === "string" && year.trim().length > 0) {
    return year.trim();
  }

  return "";
}

function normalizeActiveEnrollment(
  enrollment: StudentEnrollment
): ActiveEnrollmentItem | null {
  if (!enrollment || enrollment.status !== "ACTIVE") {
    return null;
  }

  const offering = enrollment.courseOffering;

  if (!offering) {
    return null;
  }

  const subject = offering.subject;
  const academicYear = offering.academicYear;

  if (!subject || !academicYear) {
    return null;
  }

  return {
    enrollment,
    offering,
    subject,
    academicYear,
  };
}

function getSubjectTitle(subject: StudentEnrollmentSubject): string {
  return getTrimmedString(subject.name) || "Materia sin nombre";
}

function getEnrollmentSubtitle(item: ActiveEnrollmentItem): string {
  const parts: string[] = [];
  const commission = getTrimmedString(item.offering.commission);
  const academicYear = getAcademicYearLabel(item.academicYear.year);

  if (commission) {
    parts.push(`Comisión ${commission}`);
  }

  if (academicYear) {
    parts.push(academicYear);
  }

  return parts.length > 0 ? parts.join(" · ") : "Cursada sin datos";
}

function getTeacherName(
  teacher: StudentEnrollmentCourseOffering["teacher"]
): string {
  if (!teacher) {
    return "";
  }

  return [
    getTrimmedString(teacher.firstName),
    getTrimmedString(teacher.lastName),
  ]
    .filter(Boolean)
    .join(" ");
}

function getShiftLabel(shift: StudentEnrollmentShift): string {
  return SHIFT_LABELS[shift] ?? "";
}

function getConditionLabel(condition: StudentEnrollmentCondition): string {
  return CONDITION_LABELS[condition] ?? "";
}

function getAttendanceRoute(
  item: ActiveEnrollmentItem
): AttendanceRoute | null {
  const careerId = getTrimmedString(item.subject.careerId);
  const subjectId = getTrimmedString(item.subject.id);
  const courseOfferingId = getTrimmedString(item.offering.id);

  if (
    !careerId ||
    !subjectId ||
    !courseOfferingId ||
    typeof item.subject.year !== "number" ||
    !Number.isFinite(item.subject.year)
  ) {
    return null;
  }

  return {
    pathname:
      "/(private)/student/careers/[careerId]/[year]/[subjectId]/attendance",
    params: {
      careerId,
      year: String(item.subject.year),
      subjectId,
      courseOfferingId,
      subjectName: getTrimmedString(item.subject.name),
    },
  };
}

function getEnrollmentsErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.status === 401) {
      return "Tu sesión expiró. Volvé a iniciar sesión.";
    }

    if (error.status === 403) {
      return "No tenés permisos para ver tus inscripciones.";
    }

    if (error.status === 404) {
      return "No encontramos tus inscripciones.";
    }
  }

  return "No pudimos cargar tus inscripciones. Revisá tu conexión y volvé a intentarlo.";
}

export default function StudentEnrollmentsScreen() {
  const { token } = useSession();

  const [enrollments, setEnrollments] = useState<ActiveEnrollmentItem[]>([]);
  const [status, setStatus] = useState<EnrollmentsStatus>(
    ENROLLMENTS_STATUS.LOADING
  );
  const [errorMessage, setErrorMessage] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;

    const loadEnrollments = async () => {
      if (!token) {
        setErrorMessage(
          "No pudimos validar tu sesión. Volvé a iniciar sesión."
        );
        setStatus(ENROLLMENTS_STATUS.ERROR);
        return;
      }

      setStatus(ENROLLMENTS_STATUS.LOADING);
      setErrorMessage("");

      try {
        const response = await getMyEnrollments(token);

        if (cancelled) {
          return;
        }

        if (!Array.isArray(response.data)) {
          setErrorMessage(
            "La respuesta del servidor no es válida. Volvé a intentarlo."
          );
          setStatus(ENROLLMENTS_STATUS.ERROR);
          return;
        }

        const activeEnrollments = response.data
          .filter((enrollment) => enrollment != null)
          .map(normalizeActiveEnrollment)
          .filter(
            (item): item is ActiveEnrollmentItem => item !== null
          );

        setEnrollments(activeEnrollments);
        setStatus(ENROLLMENTS_STATUS.SUCCESS);
      } catch (error) {
        if (cancelled) {
          return;
        }

        setErrorMessage(getEnrollmentsErrorMessage(error));
        setStatus(ENROLLMENTS_STATUS.ERROR);
      }
    };

    loadEnrollments();

    return () => {
      cancelled = true;
    };
  }, [token, reloadKey]);

  const handleRetry = () => {
    setErrorMessage("");
    setStatus(ENROLLMENTS_STATUS.LOADING);
    setReloadKey((current) => current + 1);
  };

  const handleBack = () => {
    router.back();
  };

  return (
    <Screen
      header={
        <AppScreenHeader
          title="Mis inscripciones"
          subtitle="Materias en las que estás inscripto"
          onBack={handleBack}
        />
      }
    >
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {status === ENROLLMENTS_STATUS.LOADING ? (
          <View style={styles.list}>
            {SKELETON_ROWS.map((row) => (
              <View key={row} style={styles.skeletonCard}>
                <Skeleton width="70%" height={18} />
                <Skeleton width="45%" height={14} />
                <Skeleton width="55%" height={14} />
              </View>
            ))}
          </View>
        ) : null}

        {status === ENROLLMENTS_STATUS.ERROR ? (
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

        {status === ENROLLMENTS_STATUS.SUCCESS &&
        enrollments.length === 0 ? (
          <View style={styles.feedback}>
            <AppCard
              title="No tenés inscripciones activas"
              subtitle="Cuando te inscribas en una cursada, aparecerá aquí."
            />

            <AppButton title="Volver" onPress={handleBack} />
          </View>
        ) : null}

        {status === ENROLLMENTS_STATUS.SUCCESS &&
        enrollments.length > 0 ? (
          <View style={styles.list}>
            {enrollments.map((item) => {
              const attendanceRoute = getAttendanceRoute(item);
              const teacherName = getTeacherName(item.offering.teacher);
              const shiftLabel = getShiftLabel(item.offering.shift);
              const conditionLabel = getConditionLabel(
                item.enrollment.condition
              );

              return (
                <AppCard
                  key={item.enrollment.id || item.offering.id}
                  title={getSubjectTitle(item.subject)}
                  subtitle={getEnrollmentSubtitle(item)}
                  onPress={
                    attendanceRoute
                      ? () => router.push(attendanceRoute)
                      : undefined
                  }
                >
                  {teacherName ? (
                    <Text style={styles.detailText}>
                      Docente: {teacherName}
                    </Text>
                  ) : null}

                  {shiftLabel ? (
                    <Text style={styles.detailText}>
                      Turno: {shiftLabel}
                    </Text>
                  ) : null}

                  <View style={styles.badges}>
                    <StatusBadge label="Inscripto" tone="present" />

                    {conditionLabel ? (
                      <StatusBadge
                        label={conditionLabel}
                        tone="neutral"
                      />
                    ) : null}
                  </View>
                </AppCard>
              );
            })}
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
    gap: theme.spacing.sm,
  },

  list: {
    gap: theme.spacing.sm,
  },

  feedback: {
    gap: theme.spacing.sm,
    paddingTop: theme.spacing.md,
  },

  skeletonCard: {
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.md,
    borderRadius: 0,
    borderWidth: 1,
    borderColor: theme.colors.border,
    gap: theme.spacing.sm,
  },

  detailText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
  },

  badges: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing.xs,
  },
});
