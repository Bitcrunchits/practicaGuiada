import { Redirect } from "expo-router";

import { useSession } from "@/features/auth/useSession";

export default function Index() {
  const { isAuthenticated } = useSession();

  if (isAuthenticated) {
    return <Redirect href="/(private)" />;
  } 
  return <Redirect href="/login" />;
}
