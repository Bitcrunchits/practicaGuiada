import { ReactNode } from "react";
import {
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from "react-native";

import { theme } from "@/constants/theme";

type AppCardTone = "default" | "navy" | "muted";

type AppCardProps = {
  children?: ReactNode;
  title?: string;
  subtitle?: string;
  onPress?: () => void;
  tone?: AppCardTone;
  style?: StyleProp<ViewStyle>;
};

export function AppCard({
  children,
  title,
  subtitle,
  onPress,
  tone = "default",
  style,
}: AppCardProps) {
  const isNavy = tone === "navy";
  const isMuted = tone === "muted";

  const content = (
    <>
      {title || subtitle ? (
        <View style={styles.headerRow}>
          <View style={styles.headerContent}>
            {title ? (
              <Text
                style={[
                  styles.title,
                  isNavy && styles.titleNavy,
                  isMuted && styles.titleMuted,
                ]}
              >
                {title}
              </Text>
            ) : null}

            {subtitle ? (
              <Text
                style={[
                  styles.subtitle,
                  isNavy && styles.subtitleNavy,
                  isMuted && styles.subtitleMuted,
                ]}
              >
                {subtitle}
              </Text>
            ) : null}
          </View>

          {onPress ? (
            <Text style={[styles.chevron, isNavy && styles.chevronNavy]}>
              ›
            </Text>
          ) : null}
        </View>
      ) : null}

      {children}
    </>
  );

  const cardStyle = [
    styles.card,
    isNavy && styles.cardNavy,
    isMuted && styles.cardMuted,
    style,
  ];

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={title ?? subtitle}
        style={({ pressed }) => [
          cardStyle,
          !isMuted && styles.cardPressable,
          pressed && styles.cardPressed,
        ]}
      >
        {content}
      </Pressable>
    );
  }

  return <View style={cardStyle}>{content}</View>;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 0,
    padding: 16,
    gap: 12,
  },

  cardPressable: {
    borderLeftWidth: 3,
    borderLeftColor: theme.colors.primary,
  },

  cardPressed: {
    opacity: 0.82,
  },

  cardNavy: {
    backgroundColor: theme.colors.navy,
    borderColor: theme.colors.navyDark,
  },

  cardMuted: {
    backgroundColor: theme.colors.surfaceMuted,
    borderColor: theme.colors.borderSubtle,
  },

  headerRow: {
    flexDirection: "row",
    alignItems: "center",
  },

  headerContent: {
    flex: 1,
  },

  title: {
    fontSize: 16,
    fontWeight: "700",
    color: theme.colors.navy,
  },

  titleNavy: {
    color: theme.colors.white,
  },

  titleMuted: {
    color: theme.colors.text,
  },

  subtitle: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    marginTop: 2,
    lineHeight: 18,
  },

  subtitleNavy: {
    color: "#C9D6E3",
  },

  subtitleMuted: {
    color: theme.colors.textSecondary,
  },

  chevron: {
    fontSize: 24,
    color: theme.colors.primary,
    marginLeft: 12,
    alignSelf: "center",
  },

  chevronNavy: {
    color: theme.colors.white,
  },
});
