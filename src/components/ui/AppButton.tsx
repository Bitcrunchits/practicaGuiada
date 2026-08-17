import {
    ActivityIndicator,
    Pressable,
    StyleSheet,
    Text,
} from "react-native";

import { theme } from "@/constants/theme";

type AppButtonProps = {
    title: string;
    onPress: () => void;
    loading?: boolean;
    disabled?: boolean;
};

export function AppButton({
    title,
    onPress,
    loading = false,
    disabled = false,
}: AppButtonProps) {
    const isDisabled = disabled || loading;
    
    return (
        <Pressable
            onPress={onPress}
            disabled={isDisabled}
            style={({ pressed }) => [
                styles.button,
                pressed && styles.buttonPressed,
                isDisabled && styles.buttonDisabled,
            ]}
        >
            {loading ? (
                <ActivityIndicator color={theme.colors.white} />
            ) : (
                <Text style={styles.text}>{title}</Text>
            )}
        </Pressable>
    );
}

const styles = StyleSheet.create({
    button: {
        width: "100%",
        minHeight: 52,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: theme.colors.primary,
        borderRadius: theme.radius.md,
        paddingHorizontal: theme.spacing.md,
    },

    buttonPressed: {
        opacity: 0.85,
    },

    buttonDisabled: {
        opacity: 0.5,
    },

    text: {
        color: theme.colors.white,
        fontSize: theme.fontSize.md,
        fontWeight: "600",
    },
});
