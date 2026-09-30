import { useEffect, useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { router } from "expo-router";
import { Skeleton } from "@/components/ui/Skeleton";

import { AppButton } from "@/components/ui/AppButton";
import { useSession } from "@/features/auth/useSession";
import { getTeacherById } from "@/features/teacher/services/teacher.service";
import { TeacherProfile } from "@/features/teacher/teacher.types";
import { theme } from "@/constants/theme";

export default function TeacherProfileScreen() {
  const { user, token } = useSession();

  const [profile, setProfile] = useState<TeacherProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadProfile = async () => {
      if (!token || !user?.profile?.id) {
        setIsLoading(false);
        return;
      }

      try {
        const response = await getTeacherById(
          user.profile.id,
          token
        );

        setProfile(response.data);
      } catch (error) {
        console.error("ERROR TEACHER PROFILE:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadProfile();
  }, [token, user?.profile?.id]);

  if (isLoading) {
    return (
      <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.container}
    >
      {/* Encabezado */}
      <View style={styles.skeletonHeader}>
        <Skeleton width="25%" height={14} borderRadius={5} />
        <Skeleton width="65%" height={28} borderRadius={7} />
        <Skeleton width="25%" height={18} borderRadius={5} />
      </View>

      {/* Información personal */}
      <View style={styles.card}>
        <Skeleton width="55%" height={22} borderRadius={6} />

        <View style={styles.skeletonFields}>
          <View style={styles.skeletonField}>
            <Skeleton width="30%" height={13} borderRadius={5} />
            <Skeleton width="45%" height={18} borderRadius={5} />
          </View>

          <View style={styles.skeletonField}>
            <Skeleton width="25%" height={13} borderRadius={5} />
            <Skeleton width="35%" height={18} borderRadius={5} />
          </View>

          <View style={styles.skeletonField}>
            <Skeleton width="20%" height={13} borderRadius={5} />
            <Skeleton width="70%" height={18} borderRadius={5} />
          </View>

          <View style={styles.skeletonField}>
            <Skeleton width="25%" height={13} borderRadius={5} />
            <Skeleton width="50%" height={18} borderRadius={5} />
          </View>
        </View>
      </View>

      {/* Estado */}
      <View style={styles.card}>
        <Skeleton width="50%" height={22} borderRadius={6} />

        <View style={styles.skeletonStatus}>
          <Skeleton width={10} height={10} borderRadius={5} />
          <Skeleton width="25%" height={18} borderRadius={5} />
        </View>
      </View>
    </ScrollView>
    );
  }

  if (!profile) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>
          No se pudo cargar el perfil.
        </Text>

        <AppButton
          title="Volver"
          onPress={() => router.back()}
        />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.container}
    >
      {/* Encabezado */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>
          Mi perfil
        </Text>

        <Text style={styles.headerName}>
          {profile.firstName} {profile.lastName}
        </Text>

        <Text style={styles.headerRole}>
          Profesor
        </Text>
      </View>

      {/* Información personal */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>
          Información personal
        </Text>

        <View style={styles.field}>
          <Text style={styles.label}>Documento</Text>
          <Text style={styles.value}>
            {profile.documentNumber}
          </Text>
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Legajo</Text>
          <Text style={styles.value}>
            {profile.employeeNumber}
          </Text>
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Email</Text>
          <Text style={styles.value}>
            {profile.email ?? "Sin email"}
          </Text>
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Teléfono</Text>
          <Text style={styles.value}>
            {profile.phone ?? "Sin teléfono"}
          </Text>
        </View>
      </View>

      {/* Estado */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>
          Estado de la cuenta
        </Text>

        <View style={styles.statusRow}>
          <View
            style={[
              styles.statusDot,
              profile.isActive
                ? styles.statusActive
                : styles.statusInactive,
            ]}
          />

          <Text style={styles.statusText}>
            {profile.isActive ? "Activo" : "Inactivo"}
          </Text>
        </View>
      </View>

      <AppButton
        title="Volver"
        onPress={() => router.back()}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },

  container: {
    padding: theme.spacing.lg,
    gap: theme.spacing.md,
  },

  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: theme.spacing.lg,
    gap: theme.spacing.md,
    backgroundColor: theme.colors.background,
  },

  errorText: {
    color: theme.colors.error,
    fontSize: theme.fontSize.md,
  },

  header: {
    backgroundColor: theme.colors.primaryDark,
    padding: theme.spacing.lg,
    borderRadius: theme.radius.lg,
  },

  headerTitle: {
    color: theme.colors.white,
    fontSize: theme.fontSize.sm,
    marginBottom: theme.spacing.sm,
  },

  headerName: {
    color: theme.colors.white,
    fontSize: theme.fontSize.xl,
    fontWeight: "700",
  },

  headerRole: {
    color: theme.colors.accent,
    fontSize: theme.fontSize.md,
    fontWeight: "600",
    marginTop: theme.spacing.xs,
  },

  card: {
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.lg,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },

  sectionTitle: {
    color: theme.colors.primary,
    fontSize: theme.fontSize.lg,
    fontWeight: "700",
    marginBottom: theme.spacing.md,
  },

  field: {
    marginBottom: theme.spacing.md,
  },

  label: {
    color: theme.colors.textSecondary,
    fontSize: theme.fontSize.sm,
    marginBottom: theme.spacing.xs,
  },

  value: {
    color: theme.colors.text,
    fontSize: theme.fontSize.md,
    fontWeight: "500",
  },

  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.sm,
  },

  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },

  statusActive: {
    backgroundColor: theme.colors.success,
  },

  statusInactive: {
    backgroundColor: theme.colors.error,
  },

  statusText: {
    color: theme.colors.text,
    fontSize: theme.fontSize.md,
    fontWeight: "600",
  },

  skeletonHeader: {
  backgroundColor: theme.colors.primaryDark,
  padding: theme.spacing.lg,
  borderRadius: theme.radius.lg,
  gap: theme.spacing.sm,
},

skeletonFields: {
  marginTop: theme.spacing.md,
  gap: theme.spacing.md,
},

skeletonField: {
  gap: theme.spacing.xs,
},

skeletonStatus: {
  flexDirection: "row",
  alignItems: "center",
  gap: theme.spacing.sm,
  marginTop: theme.spacing.md,
},
});