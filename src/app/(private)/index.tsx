import { StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";

import { AppButton } from "@/components/ui/AppButton";
import { Screen } from "@/components/ui/Screen";
import { theme } from "@/constants/theme";
import { useSession } from "@/features/auth/useSession";

export default function HomeScreen() {
  const { user, signOut } = useSession();

  const handleLogout = () => {
    signOut();
    router.replace("/login");
  };

  return (
    <Screen style={styles.screen}>
      <View style={styles.card}>
        <Text style={styles.title}>
          Bienvenido
        </Text>

        <Text style={styles.name}>
          {user?.profile?.firstName} {user?.profile?.lastName}
        </Text>

        <Text style={styles.info}>
          Email: {user?.email}
        </Text>

        <Text style={styles.info}>
          Rol: {user?.role}
        </Text>
      </View>

      <AppButton
        title="Cerrar sesión"
        onPress={handleLogout}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: {
    justifyContent: "center",
  },

  card: {
    width: "100%",
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.xl,

    backgroundColor: theme.colors.surface,

    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.xl,
  },

  title: {
    fontSize: theme.fontSize.lg,
    fontWeight: "700",
    color: theme.colors.textSecondary,
    textAlign: "center",
    marginBottom: theme.spacing.sm,
  },

  name: {
    fontSize: theme.fontSize.xl,
    fontWeight: "800",
    color: theme.colors.text,
    textAlign: "center",
    marginBottom: theme.spacing.lg,
  },

  info: {
    fontSize: theme.fontSize.md,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.sm,
  },
});