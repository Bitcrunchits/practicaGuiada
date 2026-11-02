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

function getSingleParam(value: string | string[] | undefined): string {
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}

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
    const status = item.enrollmentStatus?.toUpperCase() ?? "NOT_ENROLLED";
    if (status === "ENROLLED" || status === "IN_PROGRESS") counts.enrolled++;
    else if (status === "REGULAR" || status === "PROMOTED" || status === "PASSED" || status === "COMPLETED") counts.passed++;
    else if (status === "REGULAR") counts.regular++;
    else counts.notEnrolled++;
  }

  return counts;
}

export default function CareerPlanScreen() {
  const { token } = useSession();
  const params = useLocalSearchParams();
  const careerId = (Array.isArray(params.careerId) ? params.careerId[0] : params.careerId) ?? "";

  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [errorMessage, setErrorMessage] = useState("");
  const [plan, setPlan] = useState<StudentStudyPlanResponse["data"] | null>(null);
  const [expandedYears, setExpandedYears] = useState<Record<number, boolean>>({});
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;

    const loadPlan = async () => {
      if (!token || !careerId) {
        setErrorMessage("No pudimos identificar la carrera.");
        return;
      }

      setErrorMessage("");

      try {
        const response = await getMyStudyPlan(token);

        if (cancelled) return;

        if (!response.data || response.data.career.id !== careerId) {
          setErrorMessage("La carrera no coincide con tu plan.");
          return;
        }

        setPlan(response.data);

        const yearGroups = buildYearGroups(response.data.items);
        const initialExpanded: Record<number, boolean> = {};
        yearGroups.forEach((g) => (initialExpanded[g.year] = true));
      } catch {
        if (cancelled) return;
        setErrorMessage("No pudimos cargar el plan de estudios. Revisá tu conexión y volvé a intentarlo.");
      }
    };

    loadPlan();

    return () => {
      cancelled = true;
    };
  }, [careerId, token]);

  const handleRetry = () => {
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

  if (!plan) {
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

  const yearGroups = buildYearGroups(plan.items);

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
          {(() => {
            const counts = { enrolled: 0, regular: 0, passed: 0, notEnrolled: 0 };
            for (const item of plan.items) {
              const status = item.enrollmentStatus?.toUpperCase() ?? "NOT_ENROLLED";
              if (status === "ENROLLED" || status === "IN_PROGRESS") counts.enrolled++;
              else if (status === "REGULAR" || status === "PROMOTED" || status === "PASSED" || status === "COMPLETED") counts.passed++;
              else if (status === "REGULAR") counts.regular++;
              else counts.notEnrolled++;
            }
            return (
              <View style={styles.chipContainer}>
                {counts.enrolled > 0 && <Chip label={`${counts.enrolled} Inscriptas`} tone="present" />}
                {counts.regular > 0 && <Chip label={`${counts.regular} Regulares`} tone="info" />}
                {counts.passed > 0 && <Chip label={`${counts.passed} Aprobadas`} tone="success" />}
                {counts.notEnrolled > 0 && <Chip label={`${counts.notEnrolled} Sin inscribir`} tone="neutral" />}
              </View>
            );
          })()}
        </View>

        {plan.items.length === 0 ? (
          <AppCard title="Sin materias en el plan">
            <Text style={styles.emptyText}>
              No hay materias configuradas para este plan.
            </Text>
          </AppCard>
        ) : (
          <View>
            {(() => {
              const yearGroups: Record<number, typeof plan.items> = {};
              for (const item of plan.items) {
                const year = item.year;
                if (!yearGroups[year]) yearGroups[year] = [];
                yearGroups[year].push(item);
              }
              return Object.entries(yearGroups)
                .map(([year, subjects]) => ({
                  year: Number(year),
                  subjects: subjects.sort((a, b) => a.sortOrder - b.sortOrder),
                }))
                .sort((a, b) => a.year - b.year)
                .map((group) => {
                  const isExpanded = true;
                  return (
                    <View key={group.year} style={styles.yearSection}>
                      <Pressable style={styles.yearHeader} onPress={() => {}}>
                        <Text style={styles.yearTitle}>
                          {group.year}° Año
                        </Text>
                        <Text style={styles.yearCount}>
                          {group.subjects.length} materias
                        </Text>
                        <Text style={styles.chevron}>
                          {"▼"}
                        </Text>
                      </Pressable>

                      <View style={styles.subjectList}>
                        {group.subjects.map((item) => (
                          <SubjectCard
                            key={item.id}
                            subject={{
                              ...item.subject,
                              enrollmentStatus: item.enrollmentStatus,
                            }}
                            onPress={() => {}}
                          />
                        ))}
                      </View>
                    </View>
                  );
                })}
            )()}
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
    color: "#0B1220",
  },
  planInfo: {
    fontSize: 14,
    color: "#5B6675",
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
    backgroundColor: "#E9EDF2",
    borderRadius: 8,
  },
  yearTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0E2A47",
  },
  yearCount: {
    fontSize: 14,
    color: "#5B6675",
  },
  chevron: {
    fontSize: 14,
    color: "#5B6675",
  },
  subjectList: {
    marginTop: 8,
    gap: 8,
  },
  emptyText: {
    color: "#5B6675",
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