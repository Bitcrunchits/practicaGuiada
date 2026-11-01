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
import { useSession } from "@/features/auth/useSession";
import { getCourseOfferingStudents } from "@/features/teacher/services/teacher.service";
import type { CourseOfferingStudent } from "@/features/teacher/services/teacher.types";

const SCREEN_STATUS = {
  LOADING: "loading",
  SUCCESS: "success",
  ERROR: "error",
} as const;

type ScreenStatus = (typeof SCREEN_STATUS)[keyof typeof SCREEN_STATUS];

type StudentsRouteParams = {
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

function getStudentSubtitle(student: CourseOfferingStudent): string {
  const parts = [
    student.studentNumber ? `Legajo: ${student.studentNumber}` : "",
    student.documentNumber ? `DNI: ${student.documentNumber}` : "",
  ].filter(Boolean);

  return parts.length > 0 ? parts.join(" · ") : "Sin datos de legajo";
}

export default function OfferingStudentsScreen() {
  const { token } = useSession();
  const params = useLocalSearchParams<StudentsRouteParams>();

  const offeringId = getSingleParam(params.offeringId);
  const subjectName = getSingleParam(params.subjectName);
  const commission = getSingleParam(params.commission);

  const [students, setStudents] = useState<CourseOfferingStudent[]>([]);
  const [status, setStatus] = useState<ScreenStatus>(
    SCREEN_STATUS.LOADING
  );
  const [errorMessage, setErrorMessage] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;

    const loadStudents = async () => {
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
        const response = await getCourseOfferingStudents(
          offeringId,
          token
        );

        if (cancelled) {
          return;
        }

        if (!Array.isArray(response.data)) {
          setErrorMessage(
            "La respuesta del servidor no es válida. Volvé a intentarlo."
          );
          setStatus(SCREEN_STATUS.ERROR);
          return;
        }

        setStudents(response.data);
        setStatus(SCREEN_STATUS.SUCCESS);
      } catch {
        if (cancelled) {
          return;
        }

        setErrorMessage(
          "No pudimos cargar los alumnos de esta cursada. Revisá tu conexión y volvé a intentarlo."
        );
        setStatus(SCREEN_STATUS.ERROR);
      }
    };

    loadStudents();

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

  return (
    <Screen
      header={
        <AppScreenHeader
          title="Alumnos inscriptos"
          subtitle={getHeaderSubtitle(subjectName, commission)}
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
        <Text style={styles.sectionTitle}>Alumnos</Text>

        {status === SCREEN_STATUS.LOADING ? (
          <View style={styles.list}>
            {SKELETON_ROWS.map((row) => (
              <View key={row} style={styles.skeletonCard}>
                <Skeleton width="65%" height={18} />
                <Skeleton width="85%" height={14} />
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

        {status === SCREEN_STATUS.SUCCESS && students.length === 0 ? (
          <AppCard
            title="No hay alumnos inscriptos"
            subtitle="Cuando existan alumnos inscriptos en esta cursada, aparecerán aquí."
          />
        ) : null}

        {status === SCREEN_STATUS.SUCCESS && students.length > 0 ? (
          <View style={styles.list}>
            {students.map((student) => (
              <AppCard
                key={student.id}
                title={`${student.firstName} ${student.lastName}`}
                subtitle={getStudentSubtitle(student)}
              />
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
});
