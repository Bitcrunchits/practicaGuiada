import { ScrollView, StyleSheet, View } from "react-native";
import { router } from "expo-router";

import { AppButton } from "@/components/ui/AppButton";
import { AppCard } from "@/components/ui/AppCard";
import { AppScreenHeader } from "@/components/ui/AppScreenHeader";
import { Screen } from "@/components/ui/Screen";
import { ScreenFooter } from "@/components/ui/ScreenFooter";
import { useSession } from "@/features/auth/useSession";

export default function StudentHomeScreen() {
  const { user, signOut } = useSession();

  const handleLogout = async () => {
    await signOut();
    router.replace("/login");
  };

  const handleBack = () => router.back();

  const studentName = user?.profile?.firstName ?? "Alumno";

return (
    <Screen
      header={
        <AppScreenHeader
          title="Portal del Alumno"
          subtitle={studentName}
          meta="Alumno"
          compact
          onBack={handleBack}
        />
      }
      footer={<ScreenFooter onBack={handleBack} />}
    >
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <AppCard
          title="Mis carreras"
          subtitle="Plan de estudios e inscripciones"
          onPress={() => router.push("/(private)/student/careers")}
        />

        <AppCard
          title="Inscripciones"
          subtitle="Materias en las que estás inscripto"
          onPress={() => router.push("/(private)/student/enrollments")}
        />

        <AppCard
          title="Mesas finales"
          subtitle="Mesas disponibles"
          tone="muted"
        />

        <AppCard
          title="Mi perfil"
          subtitle="Datos personales y académicos"
          tone="muted"
        />

        <View style={styles.spacer} />

        <AppButton
          title="Cerrar sesión"
          variant="secondary"
          onPress={handleLogout}
        />
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingTop: 20,
    paddingBottom: 24,
    gap: 12,
    flexGrow: 1,
  },

  spacer: {
    flex: 1,
    minHeight: 24,
  },
});
