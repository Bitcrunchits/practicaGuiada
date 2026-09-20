import { useSession } from "@/features/auth/useSession";
import { Stack, Redirect } from "expo-router";
import { ActivityIndicator, View } from "react-native";




export default function PrivateLayout() {
   const { isAuthenticated, isLoading } = useSession();

   if (isLoading) {
      return (
         <View 
         style={{
             flex: 1,
              justifyContent: "center",
               alignItems: "center",
            }}
            >
            <ActivityIndicator size="large" />
         </View>
      );
   }

   if (!isAuthenticated) {
      return <Redirect href="/login" />;
   }

   return <Stack screenOptions={{ headerShown: false }} />;
}