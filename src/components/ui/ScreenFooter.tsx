import { StyleSheet, View } from "react-native";

import { AppButton } from "@/components/ui/AppButton";
import { theme } from "@/constants/theme";

type ScreenFooterProps = {
  onBack: () => void;
};

export function ScreenFooter({ onBack }: ScreenFooterProps) {
  return (
    <View style={styles.container}>
      <AppButton
        title="Volver"
        variant="secondary"
        onPress={onBack}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.sm,
    paddingBottom: theme.spacing.md,
    backgroundColor: theme.colors.background,
    borderTopWidth: 1,
    borderTopColor: theme.colors.borderSubtle,
  },
});
