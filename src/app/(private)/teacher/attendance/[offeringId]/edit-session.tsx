import { useEffect, useRef, useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";

import { AppButton } from "@/components/ui/AppButton";
import { AppCard } from "@/components/ui/AppCard";
import { AppInput } from "@/components/ui/AppInput";
import { AppScreenHeader } from "@/components/ui/AppScreenHeader";
import { FeedbackState } from "@/components/ui/FeedbackState";
import { Screen } from "@/components/ui/Screen";
import { ScreenFooter } from "@/components/ui/ScreenFooter";
import { Skeleton } from "@/components/ui/Skeleton";
import { theme } from "@/constants/theme";
import { ApiError } from "@/lib/api/api.client";
import { formatSessionDate } from "@/lib/format/date";
import { useSession } from "@/features/auth/useSession";
import {
  getClassSession,
  updateClassSession,
} from "@/features/teacher/services/teacher.service";
import type { ClassSession } from "@/features/teacher/services/teacher.types";

const SCREEN_STATUS = {
  LOADING: "loading",
  SUCCESS: "success",
  ERROR: "error",
} as const;

type ScreenStatus = (typeof SCREEN_STATUS)[keyof typeof SCREEN_STATUS];

type EditSessionRouteParams = {
  sessionId?: string | string[];
  subjectName?: string | string[];
  commission?: string | string[];
};

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

function getLoadErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.status === 403) {
      return "No tenés permisos para editar esta clase.";
    }

    if (error.status === 404) {
      return "No encontramos la clase.";
    }
  }

  return "No pudimos cargar la clase. Revisá tu conexión y volvé a intentarlo.";
}

function getSubmitErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.status === 403) {
      return "No tenés permisos para editar esta clase.";
    }

    if (error.status === 404) {
      return "No encontramos la clase.";
    }

    const serverMessage = error.message.trim();

    if (serverMessage) {
      return serverMessage;
    }
  }

  return "No pudimos actualizar la clase. Volvé a intentarlo.";
}

export default function EditSessionScreen() {
  const { token } = useSession();
  const params = useLocalSearchParams<EditSessionRouteParams>();

  const sessionId = getSingleParam(params.sessionId);
  const subjectName = getSingleParam(params.subjectName);
  const commission = getSingleParam(params.commission);

  const [status, setStatus] = useState<ScreenStatus>(
    SCREEN_STATUS.LOADING
  );
  const [errorMessage, setErrorMessage] = useState("");
  const [session, setSession] = useState<ClassSession | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [formTopic, setFormTopic] = useState("");
  const [formNotes, setFormNotes] = useState("");
  const [formTopicError, setFormTopicError] = useState("");
  const [formError, setFormError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUpdated, setIsUpdated] = useState(false);
  const isMountedRef = useRef(true);
  const isSubmittingRef = useRef(false);

  useEffect(() => {
    isMountedRef.current = true;

    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    const loadSession = async () => {
      if (!sessionId) {
        setErrorMessage(
          "No pudimos identificar la clase. Volvé a la lista y elegí una de nuevo."
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
        const response = await getClassSession(sessionId, token);

        if (cancelled) {
          return;
        }

        const loadedSession = response.data;

        setSession(loadedSession);
        setFormTopic(
          typeof loadedSession.topic === "string"
            ? loadedSession.topic.trim()
            : ""
        );
        setFormNotes(
          typeof loadedSession.notes === "string"
            ? loadedSession.notes.trim()
            : ""
        );
        setFormTopicError("");
        setFormError("");
        setIsUpdated(false);
        setStatus(SCREEN_STATUS.SUCCESS);
      } catch (error) {
        if (cancelled) {
          return;
        }

        setErrorMessage(getLoadErrorMessage(error));
        setStatus(SCREEN_STATUS.ERROR);
      }
    };

    loadSession();

    return () => {
      cancelled = true;
    };
  }, [sessionId, token, reloadKey]);

  const handleBack = () => {
    router.back();
  };

  const handleRetry = () => {
    setStatus(SCREEN_STATUS.LOADING);
    setErrorMessage("");
    setReloadKey((current) => current + 1);
  };

  const handleSubmit = async () => {
    if (isSubmittingRef.current) {
      return;
    }

    const trimmedTopic = formTopic.trim();
    const nextTopicError = trimmedTopic
      ? ""
      : "Ingresá el tema de la clase.";

    setFormTopicError(nextTopicError);
    setFormError("");

    if (nextTopicError) {
      return;
    }

    if (!sessionId || !token) {
      setFormError(
        "No pudimos validar la clase o tu sesión. Volvé a intentarlo."
      );
      return;
    }

    isSubmittingRef.current = true;
    setIsSubmitting(true);

    try {
      await updateClassSession(
        sessionId,
        { topic: trimmedTopic, notes: formNotes },
        token
      );

      if (!isMountedRef.current) {
        return;
      }

      setIsUpdated(true);
    } catch (error) {
      if (!isMountedRef.current) {
        return;
      }

      setFormError(getSubmitErrorMessage(error));
    } finally {
      isSubmittingRef.current = false;

      if (isMountedRef.current) {
        setIsSubmitting(false);
      }
    }
  };

  return (
    <Screen
      header={
        <AppScreenHeader
          title="Editar clase"
          subtitle={getHeaderSubtitle(subjectName, commission)}
          meta={session ? formatSessionDate(session.date) : undefined}
          onBack={handleBack}
        />
      }
      footer={<ScreenFooter onBack={handleBack} />}
    >
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {status === SCREEN_STATUS.LOADING ? (
          <View style={styles.skeletonCard}>
            <Skeleton width="40%" height={18} />
            <Skeleton width="100%" height={52} />
            <Skeleton width="100%" height={80} />
          </View>
        ) : null}

        {status === SCREEN_STATUS.ERROR ? (
          <View style={styles.feedback}>
            <FeedbackState type="error" message={errorMessage} />

            <AppButton title="Reintentar" onPress={handleRetry} />
          </View>
        ) : null}

        {status === SCREEN_STATUS.SUCCESS && isUpdated ? (
          <AppCard>
            <FeedbackState
              type="success"
              message="La clase quedó actualizada."
            />

            <AppButton
              title="Volver a la clase de hoy"
              onPress={handleBack}
            />
          </AppCard>
        ) : null}

        {status === SCREEN_STATUS.SUCCESS && !isUpdated && session ? (
          <AppCard>
            {session.status === "CLOSED" ? (
              <FeedbackState
                type="info"
                message="La clase está cerrada. Podés corregir el tema y las notas; para tomar asistencia, reabrila."
              />
            ) : null}

            <AppInput
              label="Tema"
              placeholder="Tema de la clase"
              value={formTopic}
              error={formTopicError}
              onChangeText={(value) => {
                setFormTopic(value);
                setFormTopicError("");
                setFormError("");
              }}
            />

            <AppInput
              label="Notas (opcional)"
              placeholder="Observaciones de la clase"
              value={formNotes}
              multiline
              onChangeText={(value) => {
                setFormNotes(value);
                setFormError("");
              }}
            />

            <FeedbackState type="error" message={formError} />

            <AppButton
              title="Guardar cambios"
              loading={isSubmitting}
              disabled={isSubmitting}
              onPress={handleSubmit}
            />
          </AppCard>
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

  skeletonCard: {
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.md,
    borderRadius: theme.radius.none,
    borderWidth: 1,
    borderColor: theme.colors.border,
    gap: theme.spacing.sm,
  },

  feedback: {
    gap: theme.spacing.sm,
  },
});
