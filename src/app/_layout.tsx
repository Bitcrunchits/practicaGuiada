import { Stack } from "expo-router";
import { View } from "react-native";

import { SessionProvider } from "@/features/auth/session.provider";
import { NetworkProvider } from "@/network/NetworkProvider";
import { OfflineBanner } from "@/components/ui/offlineBanner";

export default function RootLayout() {
    return (
        <NetworkProvider>
            <View style={{ flex: 1}}>
            <OfflineBanner />
            
            <SessionProvider>
                <Stack screenOptions={{ headerShown: false }} />
            </SessionProvider>
            </View>
            
        </NetworkProvider>
    );
}

