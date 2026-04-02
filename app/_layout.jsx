import { Stack, useRouter, useSegments } from "expo-router";
import { useEffect } from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { AuthProvider, useAuth } from "../context/authContext";
import { View, ActivityIndicator } from "react-native";
import Toast from "react-native-toast-message";

function RootNavigation() {
  const { user, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    const inAuthGroup = segments[0] === "(auth)";

    // 🚫 Not logged in → redirect to login
    if (!user && !inAuthGroup) {
      router.replace("/(auth)/login");
      return;
    }

    // 🔒 Logged in → redirect to home if in auth screens or at the root index
    if (user && (inAuthGroup || segments.length === 0 || segments[0] === "index")) {
      router.replace("/(tabs)/home");
      return;
    }
  }, [user, loading, segments]);

  // 🔄 Show loader while checking session
  if (loading) {
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

  return <Stack screenOptions={{ headerShown: false }} />;
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <RootNavigation />
      </AuthProvider>
      <Toast />
    </SafeAreaProvider>
  );
}