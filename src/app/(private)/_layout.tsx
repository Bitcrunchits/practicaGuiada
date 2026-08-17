import { useSession } from "@/features/auth/useSession";
import { Stack, Redirect } from "expo-router";




export default function PrivateLayout() {
   const { isAuthenticated } = useSession();

   if (!isAuthenticated) {
      return <Redirect href="/login" />;
   }

   return <Stack screenOptions={{ headerShown: false }} />;
}