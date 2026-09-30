import { useEffect, useState } from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import {
  CareerCardSkeleton,
  Skeleton,
} from "@/components/ui/Skeleton";

import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";

import { AppButton } from "@/components/ui/AppButton";
import { theme } from "@/constants/theme";
import { useSession } from "@/features/auth/useSession";

import { getMyStudyPlan } from "@/features/student/services/student.service";
import { StudentStudyPlanData } from "@/features/student/student.types";

export default function StudentCareersScreen() {
  const { token } = useSession();

  const [studyData, setStudyData] =
    useState<StudentStudyPlanData | null>(null);

  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadStudyPlan = async () => {
      if (!token) {
        setIsLoading(false);
        return;
      }

      try {
        const response = await getMyStudyPlan(token);

        setStudyData(response.data);
      } catch (error) {
        console.error("ERROR STUDY PLAN:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadStudyPlan();
  }, [token]);

  if (isLoading) {
    return (
       <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>

        {/* Simula "Mis carreras" */}
        <View style={{ marginBottom: theme.spacing.md }}>
          <Skeleton
            width="45%"
            height={26}
            borderRadius={8}
          />
        </View>

        {/* Simula la carrera */}
        <CareerCardSkeleton />

      </View>
    </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>

        <Text style={styles.title}>
          Mis carreras
        </Text>

        {studyData ? (
          <Pressable
            style={styles.card}
            onPress={() =>
              router.push({
                pathname: "/(private)/student/careers/[careerId]",
                params: {
                  careerId: studyData.career.id,
                },
              })
            }
          >

            

            <View style={styles.cardContent}>
              <Text style={styles.careerName}>
                {studyData.career.name}
              </Text>

              <Text style={styles.careerCode}>
                {studyData.career.code}
              </Text>

              <Text style={styles.plan}>
                {studyData.studyPlan.name}
              </Text>
            </View>

            <Text style={styles.arrow}>
              ›
            </Text>

          </Pressable>
        ) : (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>
              No se encontró información académica.
            </Text>
          </View>
        )}

        <View style={styles.spacer} />

        <AppButton
          title="Volver"
          onPress={() => router.back()}
        />

      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },

  container: {
    flex: 1,
    padding: theme.spacing.lg,
  },


  title: {
    fontSize: theme.fontSize.xl,
    fontWeight: "700",
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
  },

  card: {
    flexDirection: "row",
    alignItems: "center",

    backgroundColor: theme.colors.surface,

    padding: theme.spacing.md,

    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },

  icon: {
    fontSize: 26,
    marginRight: theme.spacing.md,
  },

  cardContent: {
    flex: 1,
  },

  careerName: {
    fontSize: theme.fontSize.md,
    fontWeight: "700",
    color: theme.colors.primary,
  },

  careerCode: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.xs,
  },

  plan: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.text,
    marginTop: theme.spacing.xs,
  },

  arrow: {
    fontSize: 28,
    color: theme.colors.textSecondary,
    marginLeft: theme.spacing.sm,
  },

  emptyCard: {
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.md,
    borderRadius: theme.radius.lg,
  },

  emptyText: {
    color: theme.colors.textSecondary,
  },

  spacer: {
    flex: 1,
  },
});
