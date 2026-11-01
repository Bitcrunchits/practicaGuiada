import { StyleSheet, Text, View } from "react-native";
import { useNetwork } from "@/network/useNetwork";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { theme } from "@/constants/theme";

export function OfflineBanner() {
    const { isOnline } = useNetwork();
    const inset = useSafeAreaInsets();

    if (isOnline) {
        return null;
    }

    return (
        <View
            style={[
                styles.banner,
                { top: inset.top },
            ]}
        >
            <Text style={styles.text}>
                Sin conexión a Internet
            </Text>
        </View>
    );
}

const styles = StyleSheet.create({
    banner: {
        position: "absolute",
        left: 0,
        right: 0,
        zIndex: 9999,
        elevation: 9999,
        backgroundColor: theme.colors.error,
        paddingVertical: 6,
        paddingHorizontal: 16,
        alignItems: "center",
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.ink,
    },

    text: {
        color: theme.colors.white,
        fontSize: 12,
        fontWeight: "700",
        letterSpacing: 0.5,
        textTransform: "uppercase",
    },
});
