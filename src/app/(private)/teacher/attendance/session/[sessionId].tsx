import { useEffect, useRef, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";

import { AppButton } from "@/components/ui/AppButton";
import { AppCard } from "@/components/ui/AppCard";
import { AppScreenHeader } from "@/components/ui/AppScreenHeader";
import { FeedbackState } from "@/components/ui/FeedbackState";
import { Screen } from "@/components/ui/Screen";
import { ScreenFooter } from "@/components/ui/ScreenFooter";
import { Skeleton } from "@/components/ui/Skeleton";
import { theme } from "@/constants/theme";
import {
  ATTENDANCE_STATUS_OPTIONS,
  isAttendanceStatusValue,
  type AttendanceStatusTone,
  type AttendanceStatusValue,
} from "@/features/attendance/attendance.types";
import { useSession } from "@/features/auth/useSession";
import {
  bulkMarkAttendance,
  getClassSession,
  getCourseOfferingStudents,
  getSessionAttendance,
  updateAttendance,
} from "@/features/teacher/services/teacher.service";
import type {
  AttendanceRecord,
  ClassSession,
  CourseOfferingStudent,
  MarkAttendanceInput,
} from "@/features/teacher/services/teacher.types";
import { ApiError } from "@/lib/api/api.client";
import { formatSessionDate } from "@/lib/format/date";
import attendanceDraftStorage, {
  type AttendanceDraftScope,
} from "@/lib/storage/attendance-draft";

const SCREEN_STATUS = { LOADING: "loading", SUCCESS: "success", ERROR: "error" } as const;

type ScreenStatus = (typeof SCREEN_STATUS)[keyof typeof SCREEN_STATUS];

type RouteParams = {
  sessionId?: string | string[];
  subjectName?: string | string[];
  commission?: string | string[];
};

type StatusMap = Record<string, AttendanceStatusValue | undefined>;

type SaveFeedback = { type: "success" | "error" | "info"; message: string };

const SKELETON_ROWS = [1, 2, 3, 4];

const TONE_COLORS: Record<AttendanceStatusTone, { color: string; background: string }> = {
  present: { color: theme.colors.success, background: theme.colors.successBackground },
  absent: { color: theme.colors.error, background: theme.colors.errorBackground },
  late: { color: theme.colors.warning, background: theme.colors.warningBackground },
  justified: { color: theme.colors.info, background: theme.colors.infoBackground },
};

function getSingleParam(value: string | string[] | undefined): string {
  return (Array.isArray(value) ? value[0] : value)?.trim() ?? "";
}

function getStudentSubtitle(student: CourseOfferingStudent): string {
  const studentNumber = student.studentNumber?.trim() ?? "";
  const documentNumber = student.documentNumber?.trim() ?? "";
  const parts = [
    studentNumber ? `Legajo: ${studentNumber}` : "",
    documentNumber ? `DNI: ${documentNumber}` : "",
  ].filter(Boolean);

  return parts.length > 0 ? parts.join(" · ") : "Sin legajo ni DNI";
}

function getLoadErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.status === 401) return "Tu sesión venció. Volvé a iniciar sesión.";
    if (error.status === 403) return "No tenés permisos para ver la asistencia de esta clase.";
    if (error.status === 404) return "No encontramos la clase o la cursada asociada.";
  }

  return "No pudimos cargar la asistencia. Revisá tu conexión y volvé a intentarlo.";
}

function buildPendingChanges(
  students: CourseOfferingStudent[],
  records: AttendanceRecord[],
  savedStatuses: StatusMap,
  selectedStatuses: StatusMap
) {
  const recordIdByStudent = new Map(
    records.map((record): [string, string] => [record.studentId, record.id])
  );
  const newRecords: MarkAttendanceInput[] = [];
  const updates: { studentId: string; recordId: string; status: AttendanceStatusValue }[] = [];

  for (const student of students) {
    const selectedStatus = selectedStatuses[student.id];

    if (!selectedStatus) continue;

    const recordId = recordIdByStudent.get(student.id);

    if (!recordId) {
      newRecords.push({ studentId: student.id, status: selectedStatus });
    } else if (savedStatuses[student.id] !== selectedStatus) {
      updates.push({ studentId: student.id, recordId, status: selectedStatus });
    }
  }

  return { newRecords, updates };
}

type AttendanceStatusPickerProps = {
  selectedStatus: AttendanceStatusValue | undefined;
  disabled: boolean;
  onSelect: (status: AttendanceStatusValue) => void;
};

function AttendanceStatusPicker({
  selectedStatus,
  disabled,
  onSelect,
}: AttendanceStatusPickerProps) {
  return (
    <View style={styles.picker}>
      {ATTENDANCE_STATUS_OPTIONS.map((option) => {
        const isSelected = selectedStatus === option.value;
        const { color, background } = TONE_COLORS[option.tone];

        return (
          <Pressable
            key={option.value}
            onPress={() => onSelect(option.value)}
            disabled={disabled}
            accessibilityRole="button"
            accessibilityLabel={option.label}
            accessibilityState={{ selected: isSelected, disabled }}
            style={[
              styles.chip,
              isSelected && { backgroundColor: background, borderColor: color },
              disabled && styles.chipDisabled,
            ]}
          >
            <Text style={[styles.chipText, isSelected && { color }]}>
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export default function SessionAttendanceScreen() {
  const { token } = useSession();
  const params = useLocalSearchParams<RouteParams>();
  const sessionId = getSingleParam(params.sessionId);
  const subjectName = getSingleParam(params.subjectName);
  const commission = getSingleParam(params.commission);

  const [status, setStatus] = useState<ScreenStatus>(SCREEN_STATUS.LOADING);
  const [errorMessage, setErrorMessage] = useState("");
  const [reloadKey, setReloadKey] = useState(0);
  const [session, setSession] = useState<ClassSession | null>(null);
  const [students, setStudents] = useState<CourseOfferingStudent[]>([]);
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [savedStatuses, setSavedStatuses] = useState<StatusMap>({});
  const [selectedStatuses, setSelectedStatuses] = useState<StatusMap>({});
  const [isSaving, setIsSaving] = useState(false);
  const [saveFeedback, setSaveFeedback] = useState<SaveFeedback | null>(null);
  const [draftStatuses, setDraftStatuses] = useState<StatusMap>({});
  const [draftLoaded, setDraftLoaded] = useState(false);
  const isSavingRef = useRef(false);

  useEffect(() => {
    let cancelled = false;

    const loadAttendance = async () => {
      const fail = (message: string) => {
        setErrorMessage(message);
        setStatus(SCREEN_STATUS.ERROR);
      };

      if (!sessionId) return fail("No pudimos identificar la clase. Volvé a la lista y elegí una de nuevo.");
      if (!token) return fail("No pudimos validar tu sesión. Volvé a iniciar sesión.");

      setStatus(SCREEN_STATUS.LOADING);
      setErrorMessage("");

      try {
        const sessionResponse = await getClassSession(sessionId, token);
        if (cancelled) return;
        const loadedSession = sessionResponse.data;
        const [studentsResponse, attendanceResponse] = await Promise.all([
          getCourseOfferingStudents(loadedSession.courseOfferingId, token),
          getSessionAttendance(sessionId, token),
        ]);
        if (cancelled) return;

        if (!Array.isArray(studentsResponse.data) || !Array.isArray(attendanceResponse.data)) {
          return fail("La respuesta del servidor no es válida. Volvé a intentarlo.");
        }

        const nextSavedStatuses: StatusMap = {};
        attendanceResponse.data.forEach((record) => {
          if (isAttendanceStatusValue(record.status)) nextSavedStatuses[record.studentId] = record.status;
        });

        const draftScopeForLoad: AttendanceDraftScope = {
          teacherId: loadedSession.createdByTeacherId,
          courseOfferingId: loadedSession.courseOfferingId,
          sessionId,
        };
        const draft = await attendanceDraftStorage.getDraft(draftScopeForLoad);
        if (cancelled) return;

        const nextDraftStatuses: StatusMap = {};
        Object.entries(draft ?? {}).forEach(([studentId, entry]) => {
          if (isAttendanceStatusValue(entry.status)) nextDraftStatuses[studentId] = entry.status;
        });

        setSession(loadedSession);
        setStudents(studentsResponse.data);
        setRecords(attendanceResponse.data);
        setSavedStatuses(nextSavedStatuses);
        setDraftStatuses(nextDraftStatuses);
        setSelectedStatuses((current) =>
          Object.keys(current).length === 0 ? { ...nextSavedStatuses, ...nextDraftStatuses } : current
        );
        setDraftLoaded(true);
        setStatus(SCREEN_STATUS.SUCCESS);
      } catch (error) {
        if (!cancelled) fail(getLoadErrorMessage(error));
      }
    };

    loadAttendance();
    return () => {
      cancelled = true;
    };
  }, [sessionId, token, reloadKey]);

  const isClosed = session?.status === "CLOSED";
  const markedCount = students.filter((student) => Boolean(selectedStatuses[student.id])).length;
  const pendingChanges = buildPendingChanges(students, records, savedStatuses, selectedStatuses);
  const hasChanges = pendingChanges.newRecords.length > 0 || pendingChanges.updates.length > 0;
  const canSave = !isClosed && !isSaving && markedCount > 0 && hasChanges;
  const recordByStudentId = new Map(records.map((record): [string, AttendanceRecord] => [record.studentId, record]));

  const draftScope = session
    ? {
        teacherId: session.createdByTeacherId,
        courseOfferingId: session.courseOfferingId,
        sessionId,
      }
    : null;

  const handleRetry = () => {
    setErrorMessage("");
    setStatus(SCREEN_STATUS.LOADING);
    setReloadKey((current) => current + 1);
  };

  const handleSelectStatus = (studentId: string, value: AttendanceStatusValue) => {
    if (isClosed || isSaving || !draftScope) return;
    setSelectedStatuses((current) => ({ ...current, [studentId]: value }));
    setSaveFeedback(null);
    void attendanceDraftStorage.updateDraft(draftScope, studentId, {
      studentId,
      status: value,
      lastModifiedAt: new Date().toISOString(),
    });
    setDraftStatuses((current) => ({ ...current, [studentId]: value }));
  };

  const handleMarkAllPresent = () => {
    if (isClosed || isSaving) return;
    const nextStatuses: StatusMap = {};
    students.forEach((student) => { nextStatuses[student.id] = "PRESENT"; });
    setSelectedStatuses(nextStatuses);
    setSaveFeedback(null);
    if (!draftScope) return;
    const nextDrafts: StatusMap = {};
    students.forEach((student) => {
      nextDrafts[student.id] = "PRESENT";
      void attendanceDraftStorage.updateDraft(draftScope, student.id, {
        studentId: student.id,
        status: "PRESENT",
        lastModifiedAt: new Date().toISOString(),
      });
    });
    setDraftStatuses(nextDrafts);
  };

  const handleSave = async () => {
    if (isSavingRef.current) return;

    if (!sessionId || !token || !draftScope) {
      setSaveFeedback({ type: "error", message: "No pudimos validar la clase o tu sesión. Volvé a intentarlo." });
      return;
    }

    if (isClosed) return;
    if (markedCount === 0) {
      setSaveFeedback({ type: "info", message: "Marcá al menos un estudiante para guardar." });
      return;
    }

    const changes = buildPendingChanges(students, records, savedStatuses, selectedStatuses);
    if (changes.newRecords.length === 0 && changes.updates.length === 0) {
      setSaveFeedback({ type: "info", message: "No hay cambios para guardar." });
      return;
    }

    isSavingRef.current = true;
    setIsSaving(true);
    setSaveFeedback(null);

    // Consultá al servidor antes de reenviar (reintento manual). No sobrescribir
    // registros del servidor cuando el estado esté incierto: se conserva el borrador.
    let serverStatuses: StatusMap = {};
    let serverQueryFailed = false;
    try {
      const attendanceResponse = await getSessionAttendance(sessionId, token);
      if (Array.isArray(attendanceResponse.data)) {
        attendanceResponse.data.forEach((record) => {
          if (isAttendanceStatusValue(record.status)) serverStatuses[record.studentId] = record.status;
        });
      }
    } catch {
      serverQueryFailed = true;
    }

    let conflictDetected = false;
    if (!serverQueryFailed) {
      for (const update of changes.updates) {
        const serverStatus = serverStatuses[update.studentId];
        if (serverStatus !== undefined && serverStatus !== update.status) {
          conflictDetected = true;
          break;
        }
      }
      if (!conflictDetected) {
        for (const record of changes.newRecords) {
          if (serverStatuses[record.studentId] !== undefined) {
            conflictDetected = true;
            break;
          }
        }
      }
    }

    if (conflictDetected || serverQueryFailed) {
      setSaveFeedback({
        type: "error",
        message: "No se pudo guardar en el servidor. Tus cambios siguen guardados en este dispositivo.",
      });
      setIsSaving(false);
      isSavingRef.current = false;
      return;
    }

    let failureCount = 0;
    let savedAnyChange = false;

    if (changes.newRecords.length > 0) {
      try {
        await bulkMarkAttendance(sessionId, changes.newRecords, token);
        savedAnyChange = true;
      } catch { failureCount += 1; }
    }

    for (const update of changes.updates) {
      try {
        await updateAttendance(update.recordId, { status: update.status }, token);
        savedAnyChange = true;
      } catch { failureCount += 1; }
    }

    if (failureCount > 0) {
      setSaveFeedback({
        type: "error",
        message: "No se pudo guardar en el servidor. Tus cambios siguen guardados en este dispositivo.",
      });
      // El borrador local se conserva: no se elimina ni se recarga la pantalla.
    } else {
      await attendanceDraftStorage.deleteConfirmedDraft(draftScope).catch(() => {});
      setDraftStatuses({});
      setSavedStatuses({ ...savedStatuses, ...selectedStatuses });
      setSaveFeedback({ type: "success", message: "Asistencia guardada correctamente." });
      if (savedAnyChange) setReloadKey((current) => current + 1);
    }

    setIsSaving(false);
    isSavingRef.current = false;
  };

  const sessionTopic = typeof session?.topic === "string" ? session.topic.trim() : "";
  const headerSubtitle = session ? `${formatSessionDate(session.date)} · ${sessionTopic || "Sin tema registrado"}` : undefined;
  const headerMeta = [subjectName, commission ? `Comisión ${commission}` : ""].filter(Boolean).join(" · ") || undefined;

  return (
    <Screen
      header={
        <AppScreenHeader
          title="Asistencia de la clase"
          subtitle={headerSubtitle}
          meta={headerMeta}
          onBack={() => router.back()}
        />
      }
      footer={<ScreenFooter onBack={() => router.back()} />}
    >
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        {status === SCREEN_STATUS.LOADING ? (
          <View style={styles.list}>
            {SKELETON_ROWS.map((row) => (
              <View key={row} style={styles.skeletonCard}>
                <Skeleton width="65%" height={18} />
                <Skeleton width="85%" height={14} />
                <Skeleton width="100%" height={40} />
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
          <AppCard title="No hay alumnos inscriptos" subtitle="Cuando existan alumnos inscriptos en esta cursada, aparecerán aquí." />
        ) : null}

        {status === SCREEN_STATUS.SUCCESS && students.length > 0 ? (
          <>
            <Text style={styles.summary}>
              {students.length} alumnos · {markedCount} marcados
            </Text>

            {draftLoaded && Object.keys(draftStatuses).length > 0 && !isClosed ? (
              <FeedbackState type="info" message="Borrador guardado en este dispositivo. Pendiente de enviar." />
            ) : null}

            {isClosed ? (
              <FeedbackState type="info" message="La clase está cerrada. La asistencia se muestra en modo lectura." />
            ) : (
              <AppButton title="Marcar todos presentes" variant="secondary" disabled={isSaving} onPress={handleMarkAllPresent} />
            )}

            {!isClosed && markedCount === 0 ? (
              <FeedbackState type="info" message="Marcá al menos un estudiante para guardar." />
            ) : null}

            {!isClosed && markedCount > 0 && markedCount < students.length ? (
              <FeedbackState type="info" message="Solo se guardarán los estudiantes que marcaste." />
            ) : null}

            <View style={styles.list}>
              {students.map((student) => {
                const record = recordByStudentId.get(student.id);
                const observation = typeof record?.observation === "string" ? record.observation.trim() : "";

                return (
                  <AppCard key={student.id} title={`${student.firstName} ${student.lastName}`} subtitle={getStudentSubtitle(student)}>
                    <AttendanceStatusPicker
                      selectedStatus={selectedStatuses[student.id]}
                      disabled={isClosed || isSaving}
                      onSelect={(value) => handleSelectStatus(student.id, value)}
                    />
                    {observation ? <Text style={styles.observation}>Observación: {observation}</Text> : null}
                  </AppCard>
                );
              })}
            </View>

            {saveFeedback ? <FeedbackState type={saveFeedback.type} message={saveFeedback.message} /> : null}

            {!isClosed ? (
              <AppButton title="Guardar asistencia" loading={isSaving} disabled={!canSave} onPress={handleSave} />
            ) : null}
          </>
        ) : null}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  content: { paddingTop: theme.spacing.md, paddingBottom: theme.spacing.xl, gap: theme.spacing.md },
  list: { gap: theme.spacing.sm },
  skeletonCard: { backgroundColor: theme.colors.surface, padding: theme.spacing.md, borderRadius: 0, borderWidth: 1, borderColor: theme.colors.border, gap: theme.spacing.sm },
  feedback: { paddingTop: theme.spacing.md, gap: theme.spacing.sm },
  summary: { color: theme.colors.text, fontSize: theme.fontSize.md, fontWeight: "600" },
  picker: { flexDirection: "row", flexWrap: "wrap", gap: theme.spacing.sm },
  chip: { minHeight: 40, justifyContent: "center", paddingHorizontal: theme.spacing.md, paddingVertical: theme.spacing.sm, borderRadius: 0, borderWidth: 1, borderColor: theme.colors.borderSubtle, backgroundColor: theme.colors.surfaceMuted },
  chipDisabled: { opacity: 0.55 },
  chipText: { fontSize: theme.fontSize.sm, fontWeight: "700", color: theme.colors.textSecondary },
  observation: { color: theme.colors.textSecondary, fontSize: theme.fontSize.sm, lineHeight: 20 },
});
