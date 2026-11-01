import { ReactNode } from "react";
import {
  StyleSheet,
  View,
  ViewStyle,
} from "react-native";

import { SafeAreaView } from "react-native-safe-area-context";

import { theme } from "@/constants/theme";

type ScreenProps = {
  header?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  style?: ViewStyle;
};

export function Screen({
  header,
  children,
  footer,
  style,
}: ScreenProps) {
  return (
    <SafeAreaView style={styles.safeArea}>
      {header}
      <View style={[styles.container, style]}>
        {children}
      </View>
      {footer ? <View style={styles.footer}>{footer}</View> : null}
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
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.md,
    backgroundColor: theme.colors.background,
  },

  footer: {
    backgroundColor: theme.colors.background,
  },
});
