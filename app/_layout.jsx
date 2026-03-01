import { Stack, useRouter, useSegments } from "expo-router";
import { useEffect } from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { AuthProvider, useAuth } from "../context/authContext";

function RootNavigation() {
  const { user, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    const inAuthGroup = segments[0] === "(auth)";

    // Not logged in → force login
    if (!user && !inAuthGroup) {
      router.replace("/(auth)/login");
    }

    // Logged in → prevent auth screens
    if (user && inAuthGroup) {
      router.replace("/(tabs)/home");
    }
  }, [user, loading]);

  if (loading) return null;

  return <Stack screenOptions={{ headerShown: false }} />;
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <RootNavigation />
      </AuthProvider>
    </SafeAreaProvider>
  );
}