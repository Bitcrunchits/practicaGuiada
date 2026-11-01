import { useEffect, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";

import { AppButton } from "@/components/ui/AppButton";
import { AppCard } from "@/components/ui/AppCard";
import { AppScreenHeader } from "@/components/ui/AppScreenHeader";
import { FeedbackState } from "@/components/ui/FeedbackState";
import { Screen } from "@/components/ui/Screen";
import { ScreenFooter } from "@/components/ui/ScreenFooter";
import { Skeleton } from "@/components/ui/Skeleton";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { theme } from "@/constants/theme";
import { useSession } from "@/features/auth/useSession";
import { getTeacherById } from "@/features/teacher/services/teacher.service";
import { TeacherProfile } from "@/features/teacher/services/teacher.types";

const PROFILE_STATUS = {
  LOADING: "loading",
  SUCCESS: "success",
  ERROR: "error",
} as const;

type ProfileStatus = (typeof PROFILE_STATUS)[keyof typeof PROFILE_STATUS];

const SKELETON_ROWS = [1, 2, 3, 4];

export default function TeacherProfileScreen() {
  const { user, token } = useSession();

  const [profile, setProfile] = useState<TeacherProfile | null>(null);
  const [status, setStatus] = useState<ProfileStatus>(
    PROFILE_STATUS.LOADING
  );
  const [errorMessage, setErrorMessage] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;

    const loadProfile = async () => {
      if (!token || !user?.profile?.id) {
        setErrorMessage(
          "No pudimos validar tu sesión. Volvé a iniciar sesión."
        );
        setStatus(PROFILE_STATUS.ERROR);
        return;
      }

      setStatus(PROFILE_STATUS.LOADING);
      setErrorMessage("");

      try {
        const response = await getTeacherById(
          user.profile.id,
          token
        );

        if (cancelled) {
          return;
        }

        setProfile(response.data);
        setStatus(PROFILE_STATUS.SUCCESS);
      } catch {
        if (cancelled) {
          return;
        }

        setErrorMessage(
          "No pudimos cargar tu perfil. Revisá tu conexión y volvé a intentarlo."
        );
        setStatus(PROFILE_STATUS.ERROR);
      }
    };

    loadProfile();

    return () => {
      cancelled = true;
    };
  }, [token, user?.profile?.id, reloadKey]);

  const handleRetry = () => {
    setStatus(PROFILE_STATUS.LOADING);
    setErrorMessage("");
    setReloadKey((current) => current + 1);
  };

  const handleBack = () => {
    router.back();
  };

  const sessionName = [
    user?.profile?.firstName,
    user?.profile?.lastName,
  ]
    .filter(Boolean)
    .join(" ");

  const fullName = profile
    ? `${profile.firstName} ${profile.lastName}`.trim()
    : sessionName || "Profesor";

  return (
    <Screen
      header={
        <AppScreenHeader
          title="Mi perfil"
          subtitle={fullName}
          meta="Profesor"
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
        {status === PROFILE_STATUS.LOADING ? (
          <View style={styles.list}>
            <View style={styles.skeletonCard}>
              <Skeleton width="55%" height={18} />

              {SKELETON_ROWS.map((row) => (
                <View key={row} style={styles.skeletonField}>
                  <Skeleton width="30%" height={12} />
                  <Skeleton width="55%" height={16} />
                </View>
              ))}
            </View>

            <View style={styles.skeletonCard}>
              <Skeleton width="50%" height={18} />
              <Skeleton width="25%" height={24} />
            </View>
          </View>
        ) : null}

        {status === PROFILE_STATUS.ERROR ? (
          <View style={styles.feedback}>
            <FeedbackState type="error" message={errorMessage} />

            <AppButton title="Reintentar" onPress={handleRetry} />
          </View>
        ) : null}

        {status === PROFILE_STATUS.SUCCESS && profile ? (
          <View style={styles.list}>
            <AppCard title="Información personal">
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
            </AppCard>

            <AppCard title="Estado de la cuenta">
              <StatusBadge
                label={profile.isActive ? "Activo" : "Inactivo"}
                tone={profile.isActive ? "present" : "neutral"}
              />
            </AppCard>
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
    gap: theme.spacing.md,
  },

  list: {
    gap: theme.spacing.md,
  },

  field: {
    gap: theme.spacing.xs,
  },

  label: {
    color: theme.colors.textSecondary,
    fontSize: theme.fontSize.sm,
  },

  value: {
    color: theme.colors.text,
    fontSize: theme.fontSize.md,
    fontWeight: "500",
  },

  feedback: {
    paddingTop: theme.spacing.md,
    gap: theme.spacing.sm,
  },

  skeletonCard: {
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.md,
    borderRadius: theme.radius.none,
    borderWidth: 1,
    borderColor: theme.colors.border,
    gap: theme.spacing.md,
  },

  skeletonField: {
    gap: theme.spacing.xs,
  },
});
