import { useEffect, useRef, useState } from "react";
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
import { getMyStudyPlan } from "@/features/student/services/student.service";
import { StudentStudyPlanResponse } from "@/features/student/student.types";

const CAREERS_STATUS = {
  LOADING: "loading",
  SUCCESS: "success",
  ERROR: "error",
} as const;

type CareersStatus = (typeof CAREERS_STATUS)[keyof typeof CAREERS_STATUS];

export default function StudentCareersScreen() {
  const { token, signOut } = useSession();

  const [status, setStatus] = useState<CareersStatus>(CAREERS_STATUS.LOADING);
  const [errorMessage, setErrorMessage] = useState("");
  const [plan, setPlan] = useState<StudentStudyPlanResponse["data"] | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [logoutError, setLogoutError] = useState("");
  const [isSigningOut, setIsSigningOut] = useState(false);
  const signOutInFlight = useRef(false);

  useEffect(() => {
    let cancelled = false;

    const loadPlan = async () => {
      if (!token) {
        setErrorMessage("No pudimos validar tu sesión. Volvé a iniciar sesión.");
        setStatus(CAREERS_STATUS.ERROR);
        return;
      }

      setStatus(CAREERS_STATUS.LOADING);
      setErrorMessage("");

      try {
        const response = await getMyStudyPlan(token);

        if (cancelled) return;

        if (!response.data) {
          setErrorMessage("No se encontró tu plan de estudios.");
          setStatus(CAREERS_STATUS.ERROR);
          return;
        }

        setPlan(response.data);
        setStatus(CAREERS_STATUS.SUCCESS);
      } catch {
        if (cancelled) return;
        setErrorMessage("No pudimos cargar tus carreras. Revisá tu conexión y volvé a intentarlo.");
        setStatus(CAREERS_STATUS.ERROR);
      }
    };

    loadPlan();

    return () => {
      cancelled = true;
    };
  }, [token, reloadKey]);

  const handleRetry = () => {
    setStatus(CAREERS_STATUS.LOADING);
    setErrorMessage("");
    setReloadKey((k) => k + 1);
  };

  const handleLogout = async () => {
    if (signOutInFlight.current) return;
    signOutInFlight.current = true;
    setIsSigningOut(true);
    setLogoutError("");

    try {
      await signOut();
    } catch {
      setLogoutError("No se pudo cerrar la sesión. Intenta nuevamente.");
      setIsSigningOut(false);
      signOutInFlight.current = false;
      return;
    }

    router.replace("/login");
  };

  const handleBack = () => router.back();

  const handleCareerPress = (careerId: string) => {
    router.push({
      pathname: "/(private)/student/careers/[careerId]",
      params: { careerId },
    });
  };

  if (status === CAREERS_STATUS.LOADING) {
    return (
      <Screen
        header={
          <AppScreenHeader title="Mis carreras" onBack={handleBack} compact />
        }
        footer={<ScreenFooter onBack={handleBack} />}
      >
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.list}>
            <View style={styles.skeletonCard}>
              <Skeleton width="50%" height={22} />
              <Skeleton width="70%" height={14} />
            </View>
          </View>
        </ScrollView>
      </Screen>
    );
  }

  if (status === CAREERS_STATUS.ERROR) {
    return (
      <Screen
        header={
          <AppScreenHeader title="Mis carreras" onBack={handleBack} />
        }
        footer={<ScreenFooter onBack={handleBack} />}
      >
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.errorContainer}>
            <FeedbackState type="error" message={errorMessage} />
            <AppButton title="Reintentar" onPress={handleRetry} />
            <AppButton title="Volver" variant="secondary" onPress={handleBack} />
          </View>
        </ScrollView>
      </Screen>
    );
  }

  if (!plan) {
    return (
      <Screen
        header={
          <AppScreenHeader title="Mis carreras" onBack={handleBack} />
        }
        footer={<ScreenFooter onBack={handleBack} />}
      >
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.errorContainer}>
            <FeedbackState type="error" message="No se encontró tu plan de estudios." />
            <AppButton title="Volver" onPress={handleBack} />
          </View>
        </ScrollView>
      </Screen>
    );
  }

  return (
      <Screen
        header={
          <AppScreenHeader
            title="Mis carreras"
            subtitle={plan.career?.name ?? "Carrera"}
            meta={plan.academicYear ? `Año ${plan.academicYear.year}` : "Alumno"}
            onBack={handleBack}
            compact
          />
        }
        footer={<ScreenFooter onBack={handleBack} />}
      >
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <AppCard
          title="Plan de estudios"
          subtitle={`${plan.items.length} materias en ${new Set(plan.items.map((i) => i.year)).size} años`}
          onPress={() => handleCareerPress(plan.career.id)}
        >
          <View style={styles.planInfo}>
            <Text style={styles.planDetail}>Carrera: {plan.career?.name}</Text>
            <Text style={styles.planDetail}>Plan: {plan.studyPlan?.name ?? plan.studyPlan?.code}</Text>
            <Text style={styles.planDetail}>
              Año académico: {plan.academicYear?.year ?? "—"}
            </Text>
          </View>
          <View style={styles.planActions}>
            <AppButton title="Ver plan completo" onPress={() => handleCareerPress(plan.career.id)} />
          </View>
        </AppCard>

        <AppCard title="Inscripciones" subtitle="Materias en las que estás inscripto" onPress={() => router.push("/(private)/student/enrollments")} />

        <AppCard title="Mesas finales" subtitle="Mesas disponibles" tone="muted" />

        <AppCard title="Mi perfil" subtitle="Datos personales y académicos" tone="muted" />

        <View style={styles.spacer} />

        {logoutError ? (
          <View
            accessible
            accessibilityRole="alert"
            accessibilityLiveRegion="polite"
            accessibilityLabel={logoutError}
          >
            <FeedbackState type="error" message={logoutError} />
          </View>
        ) : null}

        <AppButton title="Cerrar sesión" variant="secondary" onPress={handleLogout} loading={isSigningOut} />
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingTop: theme.spacing.md,
    paddingBottom: theme.spacing.xl,
    gap: theme.spacing.md,
    flexGrow: 1,
    paddingHorizontal: theme.spacing.lg,
  },
  spacer: {
    flex: 1,
    minHeight: theme.spacing.lg,
  },
  planInfo: {
    gap: theme.spacing.xs,
    marginTop: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
  },
  planDetail: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
  },
  planActions: {
    marginTop: theme.spacing.sm,
  },
  list: {
    gap: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
  },
  skeletonCard: {
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.md,
    borderRadius: theme.radius.none,
    borderWidth: 1,
    borderColor: theme.colors.border,
    gap: theme.spacing.sm,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: theme.spacing.lg,
  },
});
