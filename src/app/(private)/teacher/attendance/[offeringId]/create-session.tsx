import { useEffect, useRef, useState } from "react";
import { ScrollView, StyleSheet } from "react-native";
import { router, useLocalSearchParams } from "expo-router";

import { AppButton } from "@/components/ui/AppButton";
import { AppCard } from "@/components/ui/AppCard";
import { AppInput } from "@/components/ui/AppInput";
import { AppScreenHeader } from "@/components/ui/AppScreenHeader";
import { FeedbackState } from "@/components/ui/FeedbackState";
import { Screen } from "@/components/ui/Screen";
import { ScreenFooter } from "@/components/ui/ScreenFooter";
import { theme } from "@/constants/theme";
import { ApiError } from "@/lib/api/api.client";
import { getTodayIsoDate } from "@/lib/format/date";
import { useSession } from "@/features/auth/useSession";
import { createClassSession } from "@/features/teacher/services/teacher.service";

type CreateSessionRouteParams = {
  offeringId?: string | string[];
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

export default function CreateSessionScreen() {
  const { token } = useSession();
  const params = useLocalSearchParams<CreateSessionRouteParams>();

  const offeringId = getSingleParam(params.offeringId);
  const subjectName = getSingleParam(params.subjectName);
  const commission = getSingleParam(params.commission);

  const [formDate, setFormDate] = useState(getTodayIsoDate);
  const [formTopic, setFormTopic] = useState("");
  const [formNotes, setFormNotes] = useState("");
  const [formDateError, setFormDateError] = useState("");
  const [formTopicError, setFormTopicError] = useState("");
  const [formError, setFormError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCreated, setIsCreated] = useState(false);
  const [createdSessionId, setCreatedSessionId] = useState("");
  const isSubmittingRef = useRef(false);
  const isMountedRef = useRef(true);

  const hasContext = Boolean(offeringId && token);

  useEffect(() => {
    isMountedRef.current = true;

    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const handleBack = () => {
    router.back();
  };

  const handleTakeAttendance = () => {
    if (!createdSessionId) {
      return;
    }

    router.replace({
      pathname: "/(private)/teacher/attendance/session/[sessionId]",
      params: {
        sessionId: createdSessionId,
        subjectName,
        commission,
      },
    });
  };

  const handleCreateSession = async () => {
    if (isSubmittingRef.current) {
      return;
    }

    const trimmedDate = formDate.trim();
    const trimmedTopic = formTopic.trim();
    const dateMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(trimmedDate);
    let nextDateError = "";

    if (!dateMatch) {
      nextDateError = "Ingresá la fecha con el formato AAAA-MM-DD.";
    } else {
      const year = Number(dateMatch[1]);
      const month = Number(dateMatch[2]);
      const day = Number(dateMatch[3]);
      const candidate = new Date(year, month - 1, day);
      const isRealDate =
        candidate.getFullYear() === year &&
        candidate.getMonth() === month - 1 &&
        candidate.getDate() === day;

      if (!isRealDate) {
        nextDateError = "Ingresá una fecha válida.";
      }
    }

    const nextTopicError = trimmedTopic
      ? ""
      : "Ingresá el tema de la clase.";

    setFormDateError(nextDateError);
    setFormTopicError(nextTopicError);
    setFormError("");

    if (nextDateError || nextTopicError) {
      return;
    }

    if (!offeringId || !token) {
      setFormError(
        "No pudimos validar la cursada o tu sesión. Volvé a intentarlo."
      );
      return;
    }

    isSubmittingRef.current = true;
    setIsSubmitting(true);

    try {
      const response = await createClassSession(
        offeringId,
        {
          date: trimmedDate,
          topic: trimmedTopic,
          notes: formNotes.trim(),
        },
        token
      );

      if (!isMountedRef.current) {
        return;
      }

      setCreatedSessionId(response.data.id);
      setIsCreated(true);
    } catch (error) {
      if (!isMountedRef.current) {
        return;
      }

      if (error instanceof ApiError && error.status === 409) {
        setFormError(
          "Ya existe una clase registrada para esa fecha en esta cursada."
        );
      } else {
        const serverMessage =
          error instanceof ApiError && error.message.trim().length > 0
            ? error.message.trim()
            : "";

        setFormError(
          serverMessage
            ? `No pudimos crear la clase. ${serverMessage}`
            : "No pudimos crear la clase. Revisá los datos y volvé a intentarlo."
        );
      }
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
          title="Crear clase del día"
          subtitle={getHeaderSubtitle(subjectName, commission)}
          meta="Libro de clase"
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
        {isCreated ? (
          <AppCard>
            <FeedbackState
              type="success"
              message="La clase del día quedó registrada."
            />

            <AppButton
              title="Tomar asistencia"
              onPress={handleTakeAttendance}
            />

            <AppButton
              title="Volver a la cursada"
              variant="secondary"
              onPress={handleBack}
            />
          </AppCard>
        ) : (
          <AppCard>
            {!hasContext ? (
              <FeedbackState
                type="error"
                message="No pudimos validar la cursada o tu sesión. Volvé a intentarlo."
              />
            ) : null}

            <AppInput
              label="Fecha"
              placeholder="AAAA-MM-DD"
              value={formDate}
              autoCapitalize="none"
              autoCorrect={false}
              error={formDateError}
              onChangeText={(value) => {
                setFormDate(value);
                setFormDateError("");
                setFormError("");
              }}
            />

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
              title="Crear clase"
              loading={isSubmitting}
              disabled={
                isSubmitting ||
                !hasContext ||
                Boolean(formDateError) ||
                Boolean(formTopicError)
              }
              onPress={handleCreateSession}
            />
          </AppCard>
        )}
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
});
