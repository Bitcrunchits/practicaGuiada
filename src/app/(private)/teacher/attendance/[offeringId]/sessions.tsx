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
import { formatSessionDate } from "@/lib/format/date";
import { useSession } from "@/features/auth/useSession";
import { getCourseOfferingClassSessions } from "@/features/teacher/services/teacher.service";
import type { ClassSession } from "@/features/teacher/services/teacher.types";

const SCREEN_STATUS = {
  LOADING: "loading",
  SUCCESS: "success",
  ERROR: "error",
} as const;

type ScreenStatus = (typeof SCREEN_STATUS)[keyof typeof SCREEN_STATUS];

type SessionsRouteParams = {
  offeringId?: string | string[];
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

function getSessionTopicLabel(topic: unknown): string {
  if (typeof topic !== "string") {
    return "Sin tema registrado";
  }

  const trimmedTopic = topic.trim();

  return trimmedTopic.length > 0 ? trimmedTopic : "Sin tema registrado";
}

function getSessionNotes(notes: unknown): string {
  return typeof notes === "string" ? notes.trim() : "";
}

function sortNewestFirst(sessions: ClassSession[]): ClassSession[] {
  return [...sessions].sort((first, second) =>
    second.date.localeCompare(first.date)
  );
}

export default function OfferingSessionsScreen() {
  const { token } = useSession();
  const params = useLocalSearchParams<SessionsRouteParams>();

  const offeringId = getSingleParam(params.offeringId);
  const subjectName = getSingleParam(params.subjectName);
  const commission = getSingleParam(params.commission);

  const [sessions, setSessions] = useState<ClassSession[]>([]);
  const [status, setStatus] = useState<ScreenStatus>(
    SCREEN_STATUS.LOADING
  );
  const [errorMessage, setErrorMessage] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;

    const loadSessions = async () => {
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
        const response = await getCourseOfferingClassSessions(
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

        setSessions(sortNewestFirst(response.data));
        setStatus(SCREEN_STATUS.SUCCESS);
      } catch {
        if (cancelled) {
          return;
        }

        setErrorMessage(
          "No pudimos cargar las clases de esta cursada. Revisá tu conexión y volvé a intentarlo."
        );
        setStatus(SCREEN_STATUS.ERROR);
      }
    };

    loadSessions();

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
          title="Consultar clases"
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
        <Text style={styles.sectionTitle}>Clases registradas</Text>

        {status === SCREEN_STATUS.LOADING ? (
          <View style={styles.list}>
            {SKELETON_ROWS.map((row) => (
              <View key={row} style={styles.skeletonCard}>
                <Skeleton width="45%" height={18} />
                <Skeleton width="75%" height={14} />
                <Skeleton width="30%" height={12} />
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

        {status === SCREEN_STATUS.SUCCESS && sessions.length === 0 ? (
          <AppCard
            title="No hay clases registradas"
            subtitle="Cuando crees una clase para esta cursada, aparecerá aquí."
          />
        ) : null}

        {status === SCREEN_STATUS.SUCCESS && sessions.length > 0 ? (
          <View style={styles.list}>
            {sessions.map((session) => {
              const notes = getSessionNotes(session.notes);

              return (
                <AppCard
                  key={session.id}
                  title={formatSessionDate(session.date)}
                  subtitle={getSessionTopicLabel(session.topic)}
                >
                  <StatusBadge
                    label={
                      session.status === "CLOSED" ? "Cerrada" : "Abierta"
                    }
                    tone={
                      session.status === "CLOSED" ? "neutral" : "present"
                    }
                  />

                  {notes ? (
                    <Text style={styles.notes}>{notes}</Text>
                  ) : null}
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

  notes: {
    color: theme.colors.textSecondary,
    fontSize: theme.fontSize.sm,
    lineHeight: 20,
  },
});
