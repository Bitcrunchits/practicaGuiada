import { StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";

import { AppButton } from "@/components/ui/AppButton";
import { useSession } from "@/features/auth/useSession";

export default function AdminHomeScreen() {
  const { signOut } = useSession();

  const handleLogout = async () => {
    await signOut();
    router.replace("/login");
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Pantalla del Administrador</Text>

      <AppButton
        title="Cerrar sesión"
        onPress={handleLogout}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
    gap: 20,
  },

  title: {
    fontSize: 24,
    fontWeight: "700",
  },
});