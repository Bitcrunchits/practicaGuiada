import { Text, View } from "react-native";
import { useNetwork } from "@/network/useNetwork";
import { useSafeAreaInsets } from "react-native-safe-area-context";


export function OfflineBanner() {
    const { isOnline } = useNetwork();
    const inset = useSafeAreaInsets();

    if (isOnline) {
        return null;
    }

    return (
        <View
            style={{
                position: "absolute",
                top: inset.top,
                left: 0,
                right: 0,
                zIndex: 9999,
                elevation: 9999,
                backgroundColor: "#D32F2F",
                paddingVertical: 2,
                paddingHorizontal: 16,
                alignItems: "center",
            }}
        >
            <Text
                style={{
                    color: "#FFFFFF",
                    fontWeight: "600",
                }}
            >
                Sin conexión a Internet
            </Text>
        </View>
    );
}