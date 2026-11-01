import { useCallback, useEffect, useRef, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";

import { AppButton } from "@/components/ui/AppButton";
import { AppCard } from "@/components/ui/AppCard";
import { AppInput } from "@/components/ui/AppInput";
import { AppScreenHeader } from "@/components/ui/AppScreenHeader";
import { FeedbackState } from "@/components/ui/FeedbackState";
import { Screen } from "@/components/ui/Screen";
import { ScreenFooter } from "@/components/ui/ScreenFooter";
import { Skeleton } from "@/components/ui/Skeleton";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { theme } from "@/constants/theme";
import { ApiError } from "@/lib/api/api.client";
import {
  formatSessionDate,
  getTodayIsoDate,
  toIsoDateOnly,
} from "@/lib/format/date";
import { useSession } from "@/features/auth/useSession";
import {
  closeClassSession,
  getCourseOfferingClassSessions,
  reopenClassSession,
} from "@/features/teacher/services/teacher.service";
import type { ClassSession } from "@/features/teacher/services/teacher.types";

const SCREEN_STATUS = {
  LOADING: "loading",
  SUCCESS: "success",
  ERROR: "error",
} as const;

type ScreenStatus = (typeof SCREEN_STATUS)[keyof typeof SCREEN_STATUS];

type ActionFeedback = {
  type: "success" | "error";
  message: string;
};

type PendingAction = "close" | "reopen" | null;

type OfferingRouteParams = {
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

function canTeacherReopen(date: unknown): boolean {
  const isoDate = toIsoDateOnly(date);

  if (!/^\d{4}-\d{2}-\d{2}$/.test(isoDate)) {
    return false;
  }

  const [year, month, day] = isoDate.split("-").map(Number);
  const classDate = new Date(year, month - 1, day);

  if (
    classDate.getFullYear() !== year ||
    classDate.getMonth() !== month - 1 ||
    classDate.getDate() !== day
  ) {
    return false;
  }

  classDate.setDate(classDate.getDate() + 1);

  const limit = [
    classDate.getFullYear(),
    String(classDate.getMonth() + 1).padStart(2, "0"),
    String(classDate.getDate()).padStart(2, "0"),
  ].join("-");

  return getTodayIsoDate() <= limit;
}

function getActionErrorMessage(
  error: unknown,
  action: "close" | "reopen"
): string {
  if (error instanceof ApiError) {
    if (error.status === 403) {
      return "No tenés permisos para esta acción.";
    }

    if (error.status === 404) {
      return "No encontramos la clase.";
    }

    if (action === "reopen" && error.status === 409) {
      return "La clase ya está abierta.";
    }

    const serverMessage = error.message.trim();

    if (serverMessage) {
      return serverMessage;
    }
  }

  return action === "close"
    ? "No pudimos cerrar la clase. Volvé a intentarlo."
    : "No pudimos reabrir la clase. Volvé a intentarlo.";
}

export default function OfferingHubScreen() {
  const { token } = useSession();
  const params = useLocalSearchParams<OfferingRouteParams>();

  const offeringId = getSingleParam(params.offeringId);
  const subjectName = getSingleParam(params.subjectName);
  const commission = getSingleParam(params.commission);

  const [status, setStatus] = useState<ScreenStatus>(
    SCREEN_STATUS.LOADING
  );
  const [errorMessage, setErrorMessage] = useState("");
  const [todaySession, setTodaySession] = useState<ClassSession | null>(
    null
  );
  const [actionMessage, setActionMessage] =
    useState<ActionFeedback | null>(null);
  const [pendingAction, setPendingAction] = useState<PendingAction>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [reopenReason, setReopenReason] = useState("");
  const [reopenReasonError, setReopenReasonError] = useState("");

  const requestIdRef = useRef(0);
  const isMountedRef = useRef(true);
  const hasLoadedRef = useRef(false);
  const isActionLoadingRef = useRef(false);

  useEffect(() => {
    isMountedRef.current = true;

    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const loadTodaySession = useCallback(async () => {
    const requestId = ++requestIdRef.current;

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

    if (!hasLoadedRef.current) {
      setStatus(SCREEN_STATUS.LOADING);
    }

    setErrorMessage("");

    try {
      const response = await getCourseOfferingClassSessions(
        offeringId,
        token
      );

      if (
        !isMountedRef.current ||
        requestIdRef.current !== requestId ||
        isActionLoadingRef.current
      ) {
        return;
      }

      if (!Array.isArray(response.data)) {
        setErrorMessage(
          "La respuesta del servidor no es válida. Volvé a intentarlo."
        );
        setStatus(SCREEN_STATUS.ERROR);
        return;
      }

      const today = getTodayIsoDate();
      const sessionForToday =
        response.data.find(
          (session) => toIsoDateOnly(session.date) === today
        ) ?? null;

      setTodaySession(sessionForToday);
      setStatus(SCREEN_STATUS.SUCCESS);
      hasLoadedRef.current = true;
      setActionMessage(null);
      setPendingAction(null);
      setReopenReason("");
      setReopenReasonError("");
    } catch {
      if (
        !isMountedRef.current ||
        requestIdRef.current !== requestId ||
        isActionLoadingRef.current
      ) {
        return;
      }

      setErrorMessage(
        "No pudimos cargar las clases de esta cursada. Revisá tu conexión y volvé a intentarlo."
      );
      setStatus(SCREEN_STATUS.ERROR);
    }
  }, [offeringId, token]);

  useFocusEffect(
    useCallback(() => {
      void loadTodaySession();

      return () => {
        requestIdRef.current += 1;
      };
    }, [loadTodaySession])
  );

  const handleBack = () => {
    router.back();
  };

  const handleRetry = () => {
    hasLoadedRef.current = false;
    void loadTodaySession();
  };

  const handleGoToCreateSession = () => {
    router.push({
      pathname:
        "/(private)/teacher/attendance/[offeringId]/create-session",
      params: { offeringId, subjectName, commission },
    });
  };

  const handleGoToAttendance = () => {
    if (!todaySession) {
      return;
    }

    router.push({
      pathname: "/(private)/teacher/attendance/session/[sessionId]",
      params: {
        sessionId: todaySession.id,
        subjectName,
        commission,
      },
    });
  };

  const handleGoToEditSession = () => {
    if (!todaySession) {
      return;
    }

    router.push({
      pathname:
        "/(private)/teacher/attendance/[offeringId]/edit-session",
      params: {
        offeringId,
        sessionId: todaySession.id,
        subjectName,
        commission,
      },
    });
  };

  const handleStartClose = () => {
    setActionMessage(null);
    setPendingAction("close");
  };

  const handleStartReopen = () => {
    setActionMessage(null);
    setReopenReason("");
    setReopenReasonError("");
    setPendingAction("reopen");
  };

  const handleCancelAction = () => {
    if (actionLoading) {
      return;
    }

    setPendingAction(null);
    setReopenReason("");
    setReopenReasonError("");
  };

  const handleConfirmClose = async () => {
    if (!todaySession || !token || isActionLoadingRef.current) {
      return;
    }

    requestIdRef.current += 1;
    isActionLoadingRef.current = true;
    setActionLoading(true);
    setActionMessage(null);

    try {
      const response = await closeClassSession(todaySession.id, token);

      if (!isMountedRef.current) {
        return;
      }

      requestIdRef.current += 1;
      setTodaySession(response.data);
      setPendingAction(null);
      setActionMessage({
        type: "success",
        message: "La clase quedó cerrada.",
      });
    } catch (error) {
      if (!isMountedRef.current) {
        return;
      }

      setActionMessage({
        type: "error",
        message: getActionErrorMessage(error, "close"),
      });
    } finally {
      isActionLoadingRef.current = false;

      if (isMountedRef.current) {
        setActionLoading(false);
      }
    }
  };

  const handleConfirmReopen = async () => {
    if (!todaySession || !token || isActionLoadingRef.current) {
      return;
    }

    const trimmedReason = reopenReason.trim();

    if (!trimmedReason) {
      setReopenReasonError("Ingresá el motivo de la reapertura.");
      return;
    }

    setReopenReasonError("");
    requestIdRef.current += 1;
    isActionLoadingRef.current = true;
    setActionLoading(true);
    setActionMessage(null);

    try {
      const response = await reopenClassSession(
        todaySession.id,
        { reason: trimmedReason },
        token
      );

      if (!isMountedRef.current) {
        return;
      }

      requestIdRef.current += 1;
      setTodaySession(response.data);
      setPendingAction(null);
      setReopenReason("");
      setActionMessage({
        type: "success",
        message: "La clase quedó reabierta.",
      });
    } catch (error) {
      if (!isMountedRef.current) {
        return;
      }

      setActionMessage({
        type: "error",
        message: getActionErrorMessage(error, "reopen"),
      });
    } finally {
      isActionLoadingRef.current = false;

      if (isMountedRef.current) {
        setActionLoading(false);
      }
    }
  };

  const isOpen = todaySession?.status === "OPEN";
  const trimmedTopic = todaySession?.topic?.trim() ?? "";
  const topicLabel = trimmedTopic || "Sin tema registrado";
  const notes = todaySession?.notes?.trim() ?? "";
  const canReopen = todaySession
    ? canTeacherReopen(todaySession.date)
    : false;

  return (
    <Screen
      header={
        <AppScreenHeader
          title="Detalle de la cursada"
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
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Clase de hoy</Text>

          {actionMessage ? (
            <FeedbackState
              type={actionMessage.type}
              message={actionMessage.message}
            />
          ) : null}

          {status === SCREEN_STATUS.LOADING ? (
            <View style={styles.skeletonCard}>
              <Skeleton width="45%" height={18} />
              <Skeleton width="75%" height={14} />
              <Skeleton width="100%" height={40} />
            </View>
          ) : null}

          {status === SCREEN_STATUS.ERROR ? (
            <View style={styles.feedback}>
              <FeedbackState type="error" message={errorMessage} />

              <AppButton title="Reintentar" onPress={handleRetry} />
            </View>
          ) : null}

          {status === SCREEN_STATUS.SUCCESS && !todaySession ? (
            <AppCard
              title="No hay clase creada para hoy"
              subtitle="Creá la clase del día para poder tomar asistencia."
            >
              <AppButton
                title="Crear clase del día"
                onPress={handleGoToCreateSession}
              />
            </AppCard>
          ) : null}

          {status === SCREEN_STATUS.SUCCESS && todaySession ? (
            <AppCard>
              <View style={styles.sessionHeader}>
                <Text style={styles.sessionDate}>
                  {formatSessionDate(todaySession.date)}
                </Text>

                <StatusBadge
                  label={isOpen ? "Abierta" : "Cerrada"}
                  tone={isOpen ? "present" : "neutral"}
                />
              </View>

              <Text style={styles.sessionTopic}>{topicLabel}</Text>

              {notes ? (
                <Text style={styles.sessionNotes}>{notes}</Text>
              ) : null}

              {isOpen && !trimmedTopic ? (
                <FeedbackState
                  type="info"
                  message="Cargá el tema de la clase antes de cerrarla."
                />
              ) : null}

              <AppButton
                title={isOpen ? "Tomar asistencia" : "Ver asistencia"}
                onPress={handleGoToAttendance}
              />

              <AppButton
                title="Editar clase"
                variant="secondary"
                onPress={handleGoToEditSession}
              />

              {isOpen ? (
                pendingAction === "close" ? (
                  <View style={styles.panel}>
                    <FeedbackState
                      type="info"
                      message="¿Cerrar la clase? No se podrá tomar asistencia hasta reabrirla."
                    />

                    <AppButton
                      title="Confirmar cierre"
                      variant="danger"
                      loading={actionLoading}
                      disabled={actionLoading}
                      onPress={handleConfirmClose}
                    />

                    <AppButton
                      title="Cancelar"
                      variant="secondary"
                      disabled={actionLoading}
                      onPress={handleCancelAction}
                    />
                  </View>
                ) : (
                  <AppButton
                    title="Cerrar clase"
                    variant="secondary"
                    disabled={!trimmedTopic}
                    onPress={handleStartClose}
                  />
                )
              ) : canReopen ? (
                pendingAction === "reopen" ? (
                  <View style={styles.panel}>
                    <AppInput
                      label="Motivo"
                      placeholder="Motivo de la reapertura"
                      value={reopenReason}
                      error={reopenReasonError}
                      onChangeText={(value) => {
                        setReopenReason(value);
                        setReopenReasonError("");
                        setActionMessage(null);
                      }}
                    />

                    <AppButton
                      title="Confirmar reapertura"
                      loading={actionLoading}
                      disabled={actionLoading}
                      onPress={handleConfirmReopen}
                    />

                    <AppButton
                      title="Cancelar"
                      variant="secondary"
                      disabled={actionLoading}
                      onPress={handleCancelAction}
                    />
                  </View>
                ) : (
                  <AppButton
                    title="Reabrir clase"
                    variant="secondary"
                    onPress={handleStartReopen}
                  />
                )
              ) : (
                <FeedbackState
                  type="info"
                  message="Solo staff puede reabrir una clase de días anteriores."
                />
              )}
            </AppCard>
          ) : null}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Consulta</Text>

          <AppButton
            title="Alumnos inscriptos"
            variant="secondary"
            onPress={() =>
              router.push({
                pathname:
                  "/(private)/teacher/attendance/[offeringId]/students",
                params: { offeringId, subjectName, commission },
              })
            }
          />

          <AppButton
            title="Consultar clases"
            variant="secondary"
            onPress={() =>
              router.push({
                pathname:
                  "/(private)/teacher/attendance/[offeringId]/sessions",
                params: { offeringId, subjectName, commission },
              })
            }
          />

          <AppButton
            title="Consultar asistencias"
            variant="secondary"
            onPress={() =>
              router.push({
                pathname:
                  "/(private)/teacher/attendance/[offeringId]/attendance-summary",
                params: { offeringId, subjectName, commission },
              })
            }
          />
        </View>
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

  section: {
    gap: theme.spacing.sm,
  },

  sectionTitle: {
    color: theme.colors.primary,
    fontSize: theme.fontSize.lg,
    fontWeight: "700",
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

  sessionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: theme.spacing.sm,
  },

  sessionDate: {
    flex: 1,
    color: theme.colors.navy,
    fontSize: theme.fontSize.md,
    fontWeight: "700",
  },

  sessionTopic: {
    color: theme.colors.text,
    fontSize: theme.fontSize.md,
    fontWeight: "600",
    lineHeight: 22,
  },

  sessionNotes: {
    color: theme.colors.textSecondary,
    fontSize: theme.fontSize.sm,
    lineHeight: 20,
  },

  panel: {
    gap: theme.spacing.sm,
  },
});
