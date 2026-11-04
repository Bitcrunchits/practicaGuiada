import { useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";

import { AppButton } from "@/components/ui/AppButton";
import { AppCard } from "@/components/ui/AppCard";
import { AppScreenHeader } from "@/components/ui/AppScreenHeader";
import { Chip } from "@/components/ui/Chip";
import { FeedbackState } from "@/components/ui/FeedbackState";
import { Screen } from "@/components/ui/Screen";
import { ScreenFooter } from "@/components/ui/ScreenFooter";
import { Skeleton } from "@/components/ui/Skeleton";
import { theme } from "@/constants/theme";
import { useSession } from "@/features/auth/useSession";
import { getMyStudyPlan } from "@/features/student/services/student.service";
import { StudentStudyPlanResponse } from "@/features/student/student.types";
import { SubjectCard } from "@/components/student/SubjectCard";

const PLAN_STATUS = {
  LOADING: "loading",
  SUCCESS: "success",
  ERROR: "error",
} as const;

type PlanStatus = (typeof PLAN_STATUS)[keyof typeof PLAN_STATUS];

function getAcademicYearLabel(year: unknown): string {
  if (typeof year === "number" && Number.isFinite(year)) return String(year);
  if (typeof year === "string" && year.trim()) return year.trim();
  return "";
}

function getCareerLabel(plan: StudentStudyPlanResponse["data"]): string {
  return `${plan.career?.name ?? "Carrera"} · ${plan.studyPlan?.name ?? plan.studyPlan?.code ?? "Plan"}`;
}

function buildYearGroups(items: StudentStudyPlanResponse["data"]["items"]) {
  const groups: Record<number, typeof items> = {};

  for (const item of items) {
    const year = item.year;
    if (!groups[year]) groups[year] = [];
    groups[year].push(item);
  }

  return Object.entries(groups)
    .map(([year, subjects]) => ({
      year: Number(year),
      subjects: subjects.sort((a, b) => a.sortOrder - b.sortOrder),
    }))
    .sort((a, b) => a.year - b.year);
}

function getStatusSummary(items: StudentStudyPlanResponse["data"]["items"]) {
  const counts = {
    enrolled: 0,
    regular: 0,
    passed: 0,
    notEnrolled: 0,
  };

  for (const item of items) {
    const status = item.enrollmentStatus?.trim().toUpperCase() ?? "NOT_ENROLLED";
    if (status === "ACTIVE" || status === "ENROLLED" || status === "IN_PROGRESS") counts.enrolled++;
    else if (status === "REGULAR") counts.regular++;
    else if (status === "PROMOTED" || status === "PASSED" || status === "COMPLETED") counts.passed++;
    else counts.notEnrolled++;
  }

  return counts;
}

export default function CareerPlanScreen() {
  const { token } = useSession();
  const params = useLocalSearchParams();
  const careerId = (Array.isArray(params.careerId) ? params.careerId[0] : params.careerId) ?? "";

  const [status, setStatus] = useState<PlanStatus>(PLAN_STATUS.LOADING);
  const [errorMessage, setErrorMessage] = useState("");
  const [plan, setPlan] = useState<StudentStudyPlanResponse["data"] | null>(null);
  const [expandedYears, setExpandedYears] = useState<Record<number, boolean>>({});
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;

    const loadPlan = async () => {
      setStatus(PLAN_STATUS.LOADING);
      setErrorMessage("");
      setPlan(null);

      if (!token || !careerId) {
        setErrorMessage("No pudimos identificar la carrera.");
        setStatus(PLAN_STATUS.ERROR);
        return;
      }

      try {
        const response = await getMyStudyPlan(token);

        if (cancelled) return;

        if (!response.data || response.data.career.id !== careerId) {
          setErrorMessage("La carrera no coincide con tu plan.");
          setStatus(PLAN_STATUS.ERROR);
          return;
        }

        setPlan(response.data);

        const yearGroups = buildYearGroups(response.data.items);
        const initialExpanded: Record<number, boolean> = {};
        yearGroups.forEach((g) => (initialExpanded[g.year] = true));
        setExpandedYears(initialExpanded);
        setStatus(PLAN_STATUS.SUCCESS);
      } catch {
        if (cancelled) return;
        setErrorMessage("No pudimos cargar el plan de estudios. Revisá tu conexión y volvé a intentarlo.");
        setStatus(PLAN_STATUS.ERROR);
      }
    };

    loadPlan();

    return () => {
      cancelled = true;
    };
  }, [careerId, token, reloadKey]);

  const handleRetry = () => {
    setStatus(PLAN_STATUS.LOADING);
    setErrorMessage("");
    setReloadKey((k) => k + 1);
  };

  const handleBack = () => router.back();

  const handleToggleYear = (year: number) => {
    setExpandedYears((prev) => ({ ...prev, [year]: !prev[year] }));
  };

  const handleSubjectPress = (item: { id: string; year: number; subjectId: string }) => {
    router.push({
      pathname: `/(private)/student/careers/${careerId}/${item.year}/${item.subjectId}`,
      params: { careerId, year: String(item.year), subjectId: item.subjectId },
    });
  };

  if (status === PLAN_STATUS.LOADING) {
    return (
      <Screen
        header={<AppScreenHeader title="Plan de estudios" onBack={handleBack} />}
        footer={<ScreenFooter onBack={handleBack} />}
      >
        <View style={styles.loadingContainer}>
          <Skeleton width="40%" height={20} />
          <Skeleton width="60%" height={14} />
        </View>
      </Screen>
    );
  }

  if (status === PLAN_STATUS.ERROR || !plan) {
    return (
      <Screen
        header={<AppScreenHeader title="Plan de estudios" onBack={handleBack} />}
        footer={<ScreenFooter onBack={handleBack} />}
      >
        <View style={styles.errorContainer}>
          <FeedbackState
            type="error"
            message={errorMessage || "No pudimos cargar el plan de estudios."}
          />
          <AppButton title="Reintentar" onPress={handleRetry} />
          <AppButton title="Volver" variant="secondary" onPress={handleBack} />
        </View>
      </Screen>
    );
  }

  const yearGroups = buildYearGroups(plan.items);
  const statusSummary = getStatusSummary(plan.items);

  return (
    <Screen
      header={
          <AppScreenHeader
            title="Plan de estudios"
            subtitle={getCareerLabel(plan)}
            meta={getAcademicYearLabel(plan.academicYear?.year)}
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
        <View style={styles.headerInfo}>
          <Text style={styles.careerName}>{plan.career?.name ?? "Carrera"}</Text>
          <Text style={styles.planInfo}>
            {plan.studyPlan?.code ?? plan.studyPlan?.name} · {plan.academicYear ? `Año ${plan.academicYear.year}` : ""}
          </Text>
        </View>

        <View style={styles.chipContainer}>
          {statusSummary.enrolled > 0 && <Chip label={`${statusSummary.enrolled} Inscriptas`} tone="present" />}
          {statusSummary.regular > 0 && <Chip label={`${statusSummary.regular} Regulares`} tone="info" />}
          {statusSummary.passed > 0 && <Chip label={`${statusSummary.passed} Aprobadas`} tone="success" />}
          {statusSummary.notEnrolled > 0 && <Chip label={`${statusSummary.notEnrolled} Sin inscribir`} tone="neutral" />}
        </View>

        {plan.items.length === 0 ? (
          <AppCard title="Sin materias en el plan">
            <Text style={styles.emptyText}>
              No hay materias configuradas para este plan.
            </Text>
          </AppCard>
        ) : (
          <View>
            {yearGroups.map((group) => {
              const isExpanded = expandedYears[group.year] ?? true;
              return (
                <View key={group.year} style={styles.yearSection}>
                  <Pressable style={styles.yearHeader} onPress={() => handleToggleYear(group.year)}>
                    <Text style={styles.yearTitle}>
                      {group.year}° Año
                    </Text>
                    <Text style={styles.yearCount}>
                      {group.subjects.length} materias
                    </Text>
                    <Text style={styles.chevron}>
                      {isExpanded ? "▲" : "▼"}
                    </Text>
                  </Pressable>

                  {isExpanded && (
                    <View style={styles.subjectList}>
                      {group.subjects.map((item) => (
                        <SubjectCard
                          key={item.id}
                          subject={{
                            ...item.subject,
                            enrollmentStatus: item.enrollmentStatus,
                          }}
                          onPress={() => handleSubjectPress(item)}
                        />
                      ))}
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  content: {
    paddingTop: 16,
    paddingBottom: 32,
    gap: 16,
    paddingHorizontal: 24,
  },
  headerInfo: {
    gap: 8,
    marginBottom: 16,
  },
  careerName: {
    fontSize: 20,
    fontWeight: "700",
    color: theme.colors.ink,
  },
  planInfo: {
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
  chipContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 16,
  },
  yearSection: {
    marginBottom: 24,
  },
  yearHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: theme.colors.surfaceMuted,
    borderRadius: 8,
  },
  yearTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: theme.colors.navy,
  },
  yearCount: {
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
  chevron: {
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
  subjectList: {
    marginTop: 8,
    gap: 8,
  },
  emptyText: {
    color: theme.colors.textSecondary,
    textAlign: "center",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
});
