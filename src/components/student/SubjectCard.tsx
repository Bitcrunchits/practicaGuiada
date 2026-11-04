import { StyleSheet, Text, View } from "react-native";

import { AppCard } from "@/components/ui/AppCard";
import { Chip } from "@/components/ui/Chip";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { theme } from "@/constants/theme";
import {
  StudentEnrollmentCondition,
  StudentEnrollmentStatus,
} from "@/features/student/student.types";

interface SubjectCardProps {
  subject: {
    id: string;
    name: string;
    code: string;
    year: number;
    semester: number;
    weeklyHours: number;
    totalHours: number;
    isActive: boolean;
    enrollmentStatus?: string;
    myEnrollment?: {
      status: StudentEnrollmentStatus;
      condition: StudentEnrollmentCondition;
      courseOffering?: {
        id: string;
        commission: string;
        shift: string;
        dayOfWeek?: number | null;
        startTime?: string | null;
        endTime?: string | null;
        classroom?: string | null;
        teacher?: { firstName: string; lastName: string } | null;
      } | null;
    } | null;
    enrollmentPeriodOpen?: boolean;
  };
  onPress?: () => void;
}

const SHIFT_LABELS: Record<string, string> = {
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

const ENROLLMENT_STATUS_LABELS: Record<string, { label: string; tone: "present" | "info" | "success" | "warning" | "neutral" | "absent" }> = {
  ACTIVE: { label: "INSCRIPTO", tone: "present" },
  ENROLLED: { label: "INSCRIPTO", tone: "present" },
  IN_PROGRESS: { label: "EN CURSO", tone: "present" },
  REGULAR: { label: "REGULAR", tone: "info" },
  PROMOTED: { label: "PROMOCIONADA", tone: "success" },
  PASSED: { label: "APROBADA", tone: "success" },
  COMPLETED: { label: "APROBADA", tone: "success" },
  NOT_REGULAR: { label: "NO REGULAR", tone: "warning" },
  ABANDONED: { label: "ABANDONADA", tone: "neutral" },
  DROPPED: { label: "ABANDONADA", tone: "neutral" },
  VOID: { label: "ANULADA", tone: "neutral" },
  NOT_ENROLLED: { label: "SIN INSCRIBIR", tone: "neutral" },
};

function getTrimmed(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function getStatusBadgeConfig(status?: string) {
  const rawStatus = status?.trim() ?? "";
  if (!rawStatus) return { label: "SIN INSCRIBIR", tone: "neutral" as const };
  const normalizedStatus = rawStatus.toUpperCase();
  const config = ENROLLMENT_STATUS_LABELS[normalizedStatus];
  return config ?? { label: rawStatus, tone: "neutral" as const };
}

function getConditionLabel(condition: StudentEnrollmentCondition): string {
  return CONDITION_LABELS[condition] ?? condition;
}

function getShiftLabel(shift: string): string {
  return SHIFT_LABELS[shift] ?? shift;
}

export function SubjectCard({
  subject,
  onPress,
}: SubjectCardProps) {
  const enrollment = subject.myEnrollment;
  const offering = enrollment?.courseOffering;

  const statusConfig = getStatusBadgeConfig(subject.enrollmentStatus);
  const normalizedPlanStatus = subject.enrollmentStatus?.trim().toUpperCase() ?? "";
  const isEnrolled = enrollment && enrollment.status === "ACTIVE";
  const condition = enrollment?.condition;

  return (
    <AppCard
      title={getTrimmed(subject.name) || "Materia sin nombre"}
      subtitle={`${subject.code} • ${subject.weeklyHours} hs semanales`}
      onPress={onPress}
      style={styles.card}
    >
      <View style={styles.headerRow}>
        <Chip label={statusConfig.label} tone={statusConfig.tone} />
        <Text style={styles.yearBadge}>{subject.year}° Año</Text>
      </View>

      {subject.semester > 0 && (
        <Text style={styles.semester}>
          Semestre {subject.semester === 1 ? "1°" : "2°"}
        </Text>
      )}

      <View style={styles.divider} />

      {subject.isActive ? null : (
        <Text style={styles.inactiveLabel}>Materia inactiva</Text>
      )}

      {isEnrolled && offering ? (
        <View style={styles.enrolledInfo}>
          <Text style={styles.detail}>
            Comisión {getTrimmed(offering.commission)}
          </Text>
          <Text style={styles.detail}>
            Turno {getShiftLabel(offering.shift)}
          </Text>
          {offering.teacher && (
            <Text style={styles.detail}>
              Docente: {getTrimmed(offering.teacher.firstName)} {getTrimmed(offering.teacher.lastName)}
            </Text>
          )}
          {offering.dayOfWeek != null && offering.startTime && offering.endTime && (
            <Text style={styles.detail}>
              {["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"][offering.dayOfWeek]} {getTrimmed(offering.startTime)} - {getTrimmed(offering.endTime)}
            </Text>
          )}
          {offering.classroom && (
            <Text style={styles.detail}>
              Aula: {getTrimmed(offering.classroom)}
            </Text>
          )}
        </View>
      ) : subject.enrollmentPeriodOpen ? (
        <Text style={styles.notEnrolled}>
          Período de inscripción abierto
        </Text>
      ) : normalizedPlanStatus === "" || normalizedPlanStatus === "NOT_ENROLLED" ? (
        <Text style={styles.notEnrolled}>
          Sin inscribir
        </Text>
      ) : null}

      {condition && (
        <View style={styles.conditionRow}>
          <Text style={styles.conditionLabel}>Condición:</Text>
          <StatusBadge label={getConditionLabel(condition)} tone="neutral" />
        </View>
      )}
    </AppCard>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: theme.spacing.md,
    gap: theme.spacing.xs,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: theme.spacing.xs,
  },
  yearBadge: {
    fontSize: theme.fontSize.xs,
    fontWeight: "600",
    color: theme.colors.textSecondary,
    backgroundColor: theme.colors.surfaceMuted,
    paddingHorizontal: theme.spacing.xs,
    paddingVertical: 1,
    borderRadius: theme.radius.sm,
  },
  semester: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.xs,
  },
  divider: {
    height: 1,
    backgroundColor: theme.colors.border,
    marginVertical: theme.spacing.xs,
  },
  enrolledInfo: {
    gap: 2,
    marginTop: theme.spacing.xs,
  },
  detail: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textSecondary,
  },
  notEnrolled: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    fontStyle: "italic",
    marginTop: theme.spacing.xs,
  },
  conditionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.xs,
    marginTop: theme.spacing.xs,
  },
  conditionLabel: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textSecondary,
  },
  inactiveLabel: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textSecondary,
    fontStyle: "italic",
  },
});