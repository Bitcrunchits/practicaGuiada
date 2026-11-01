import { useEffect, useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import { Skeleton } from "@/components/ui/Skeleton";

import { AppButton } from "@/components/ui/AppButton";
import { theme } from "@/constants/theme";
import { useSession } from "@/features/auth/useSession";
import { getMySubject } from "@/features/student/services/student.service";
import { StudentSubjectDetail } from "@/features/student/student.types";

export default function StudentSubjectScreen() {
  const { token } = useSession();

  // Recuperamos los parámetros de la ruta.
  const { careerId, year, subjectId } = useLocalSearchParams<{
    careerId: string;
    year: string;
    subjectId: string;
  }>();

  const [subjectData, setSubjectData] =
    useState<StudentSubjectDetail | null>(null);

  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadSubject = async () => {
      if (!token || !subjectId) {
        setIsLoading(false);
        return;
      }

      try {
        const response = await getMySubject(subjectId, token);

        setSubjectData(response.data);
      } catch (error) {
        console.error("ERROR SUBJECT DETAIL:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadSubject();
  }, [token, subjectId]);

  // ------------------------------------------------
  // Cargando
  // ------------------------------------------------

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Encabezado */}
        <View style={styles.skeletonHeader}>
          <Skeleton width="75%" height={28} borderRadius={8} />
          <Skeleton width="30%" height={16} borderRadius={6} />
        </View>

        {/* Información */}
        <View style={styles.card}>
          <Skeleton width="40%" height={20} borderRadius={6} />
          <Skeleton width="65%" height={14} borderRadius={5} />
          <Skeleton width="50%" height={14} borderRadius={5} />
          <Skeleton width="60%" height={14} borderRadius={5} />
          <Skeleton width="55%" height={14} borderRadius={5} />
          <Skeleton width="70%" height={14} borderRadius={5} />
        </View>

        {/* Mi cursada */}
        <View style={styles.card}>
          <Skeleton width="35%" height={20} borderRadius={6} />
          <Skeleton width="45%" height={14} borderRadius={5} />
          <Skeleton width="70%" height={14} borderRadius={5} />
          <Skeleton width="60%" height={14} borderRadius={5} />
          <Skeleton width="40%" height={14} borderRadius={5} />
        </View>

        {/* Asistencia */}
        <View style={styles.skeletonAction}>
          <View style={styles.skeletonActionContent}>
            <Skeleton width="45%" height={20} borderRadius={6} />
            <Skeleton width="65%" height={14} borderRadius={5} />
          </View>

          <Skeleton width={10} height={28} borderRadius={4} />
        </View>
      </ScrollView>
    </SafeAreaView>
    );
  }

  // ------------------------------------------------
  // Sin datos
  // ------------------------------------------------

  if (!subjectData) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}>
          <Text style={styles.errorTitle}>
            No se pudo cargar la materia
          </Text>

          <AppButton
            title="Volver"
            onPress={() => router.back()}
          />
        </View>
      </SafeAreaView>
    );
  }

  // ------------------------------------------------
  // Datos de la materia
  // ------------------------------------------------

  const {
    subject,
    academicYear,
    myEnrollment,
  } = subjectData;

  // Si el alumno está inscripto,
  // obtenemos su cursada.
  const offering = myEnrollment?.courseOffering;

  // ------------------------------------------------
  // Pantalla
  // ------------------------------------------------

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Encabezado */}

        <View style={styles.header}>
          <Text style={styles.title}>
            {subject.name}
          </Text>

          <Text style={styles.subjectCode}>
            {subject.code}
          </Text>
        </View>

        {/* Información de la materia */}

        <View style={styles.card}>
          <Text style={styles.cardTitle}>
            Información
          </Text>

          <Text style={styles.info}>
            Año de carrera: {subject.year}°
          </Text>

          <Text style={styles.info}>
            {subject.semester === 0
              ? "Materia anual"
              : `Semestre: ${subject.semester}`}
          </Text>

          <Text style={styles.info}>
            Horas semanales: {subject.weeklyHours}
          </Text>

          <Text style={styles.info}>
            Horas totales: {subject.totalHours}
          </Text>

          <Text style={styles.info}>
            Ciclo lectivo: {academicYear.name}
          </Text>
        </View>

        {/* Mi cursada */}

        {offering ? (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>
              Mi cursada
            </Text>

            <Text style={styles.info}>
              Comisión: {offering.commission}
            </Text>

            <Text style={styles.info}>
              Docente: {offering.teacher.firstName}{" "}
              {offering.teacher.lastName}
            </Text>

            <Text style={styles.info}>
              Horario: {offering.startTime} -{" "}
              {offering.endTime}
            </Text>

            <Text style={styles.info}>
              Aula: {offering.classroom}
            </Text>

            <Text style={styles.info}>
              Asistencia mínima:{" "}
              {offering.minAttendancePercent}%
            </Text>

            <Text style={styles.info}>
              Regularidad:{" "}
              {offering.regularMinAverage}
            </Text>

            {offering.promoteEnabled && (
              <Text style={styles.info}>
                Promoción:{" "}
                {offering.promoteMinAverage}
              </Text>
            )}
          </View>
        ) : (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>
              Estado de cursada
            </Text>

            <Text style={styles.info}>
              No estás inscripto en una cursada de esta
              materia.
            </Text>
          </View>
        )}

        {/* ASISTENCIA
            Solo aparece si el alumno tiene una cursada.
        */}

        {offering && (
          <Pressable
            style={styles.actionCard}
            onPress={() =>
              router.push({
                pathname:
                  "/(private)/student/careers/[careerId]/[year]/[subjectId]/attendance",

                params: {
                  careerId,
                  year,
                  subjectId,

                  // Este ID viene del backend.
                  // No está escrito manualmente.
                  courseOfferingId: offering.id,

                  subjectName: subject.name,
                },
              })
            }
          >
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>
                Asistencia
              </Text>

              <Text style={styles.actionDescription}>
                Mínimo requerido:{" "}
                {offering.minAttendancePercent}%
              </Text>
            </View>

            <Text style={styles.arrow}>
              ›
            </Text>
          </Pressable>
        )}

        {/* Volver */}

        <View style={styles.footer}>
          <AppButton
            title="Volver"
            onPress={() => router.back()}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// --------------------------------------------------
// ESTILOS
// --------------------------------------------------

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },

  content: {
    padding: theme.spacing.lg,
    gap: theme.spacing.md,
  },

  center: {
    flex: 1,
    justifyContent: "center",
    padding: theme.spacing.lg,
    gap: theme.spacing.md,
  },

  
  errorTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: "700",
    color: theme.colors.text,
    textAlign: "center",
  },

  header: {
    marginBottom: theme.spacing.sm,
  },

  title: {
    fontSize: theme.fontSize.xl,
    fontWeight: "700",
    color: theme.colors.text,
  },

  subjectCode: {
    marginTop: theme.spacing.xs,
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
  },

  card: {
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.md,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    gap: theme.spacing.sm,
  },

  cardTitle: {
    fontSize: theme.fontSize.md,
    fontWeight: "700",
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },

  info: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
  },

  // Tarjeta navegable de Asistencia

  actionCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.md,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },

  actionContent: {
    flex: 1,
  },

  actionTitle: {
    fontSize: theme.fontSize.md,
    fontWeight: "700",
    color: theme.colors.primary,
  },

  actionDescription: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.xs,
  },

  arrow: {
    fontSize: 28,
    color: theme.colors.textSecondary,
  },

  footer: {
    marginTop: theme.spacing.md,
  },

  skeletonHeader: {
  gap: theme.spacing.sm,
  marginBottom: theme.spacing.sm,
},

skeletonAction: {
  flexDirection: "row",
  alignItems: "center",
  backgroundColor: theme.colors.surface,
  padding: theme.spacing.md,
  borderRadius: theme.radius.lg,
  borderWidth: 1,
  borderColor: theme.colors.border,
},

skeletonActionContent: {
  flex: 1,
  gap: theme.spacing.sm,
},
});
