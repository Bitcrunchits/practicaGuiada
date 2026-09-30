import { Redirect } from "expo-router";
import { useSession } from "@/features/auth/useSession";

export default function PrivateIndex() {
  const { user } = useSession();

 if (user?.role === "ADMIN") {
  return <Redirect href="/(private)/admin" />;
}

  if (user?.role === "TEACHER") {
    return <Redirect href="/(private)/teacher" />;
  }

  if (user?.role === "STUDENT") {
    return <Redirect href="/(private)/student" />;
  }
  

  return null;
}
