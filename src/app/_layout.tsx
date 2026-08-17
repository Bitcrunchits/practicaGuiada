import { Stack } from "expo-router";
import { SessionProvider } from "@/features/auth/session.provider";

export default function RootLayout() {
    return (
        <SessionProvider>
            <Stack screenOptions={{ headerShown: false }} />
        </SessionProvider>
    );
}

