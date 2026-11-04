import { ReactNode } from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { AppLogo } from "@/components/ui/AppLogo";
import { theme } from "@/constants/theme";

type AppScreenHeaderProps = {
  title: string;
  subtitle?: string;
  meta?: string;
  onBack?: () => void;
  showLogo?: boolean;
  compact?: boolean;
  right?: ReactNode;
};

export function AppScreenHeader({
  title,
  subtitle,
  meta,
  onBack,
  showLogo = false,
  compact = false,
  right,
}: AppScreenHeaderProps) {
  return (
    <View style={styles.container}>
      {showLogo && !compact ? (
        <View style={styles.logoRow}>
          <AppLogo size="small" />
        </View>
      ) : null}

      <View style={[
        styles.navyBlock,
        compact && styles.navyBlockCompact,
      ]}>
        {onBack ? (
          <Pressable
            onPress={onBack}
            accessibilityRole="button"
            accessibilityLabel="Volver"
            style={styles.backButton}
          >
            <Text style={styles.backText}>‹ Volver</Text>
          </Pressable>
        ) : null}

        <View style={styles.titleRow}>
          <View style={styles.titleContent}>
            <Text style={[styles.title, compact && styles.titleCompact]}>
              {title}
            </Text>

            {subtitle ? (
              <Text style={[styles.subtitle, compact && styles.subtitleCompact]}>
                {subtitle}
              </Text>
            ) : null}

            {meta ? <Text style={[styles.meta, compact && styles.metaCompact]}>{meta}</Text> : null}
          </View>

          {right ? <View style={styles.right}>{right}</View> : null}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.surface,
  },

  logoRow: {
    backgroundColor: theme.colors.surface,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.borderSubtle,
  },

  navyBlock: {
    backgroundColor: theme.colors.navy,
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 18,
    borderBottomWidth: 3,
    borderBottomColor: theme.colors.accent,
  },

  navyBlockCompact: {
    paddingTop: 12,
    paddingBottom: 12,
  },

  backButton: {
    alignSelf: "flex-start",
    marginBottom: 12,
  },

  backText: {
    color: theme.colors.white,
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },

  titleRow: {
    flexDirection: "row",
    alignItems: "center",
  },

  titleContent: {
    flex: 1,
  },

  title: {
    fontSize: 26,
    fontWeight: "800",
    color: theme.colors.white,
    lineHeight: 32,
  },

  titleCompact: {
    fontSize: 22,
    lineHeight: 28,
  },

  subtitle: {
    fontSize: 15,
    color: "#D7E1EC",
    marginTop: 4,
    lineHeight: 21,
  },

  subtitleCompact: {
    fontSize: 14,
    marginTop: 2,
    lineHeight: 20,
  },

  meta: {
    fontSize: 11,
    fontWeight: "700",
    color: theme.colors.accent,
    letterSpacing: 1,
    textTransform: "uppercase",
    marginTop: 8,
  },

  metaCompact: {
    fontSize: 10,
    marginTop: 4,
  },

  right: {
    marginLeft: 12,
  },
});
