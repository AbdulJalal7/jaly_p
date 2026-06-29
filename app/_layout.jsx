import { Stack, useRouter, useSegments } from "expo-router";
import { useEffect } from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { AuthProvider, useAuth } from "../context/authContext";
import { View, ActivityIndicator, LogBox } from "react-native";
import Toast from "react-native-toast-message";
import { StatusBar } from "expo-status-bar";

LogBox.ignoreLogs([
  "Realtime got disconnected",
  "INVALID_STATE_ERR",
  "Software caused connection abort"
]);

function RootNavigation() {
  const { user, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    const inAuthGroup = segments[0] === "(auth)";
    // Don't redirect while on the OAuth callback page — the session is being created
    const inOAuthCallback = segments[0] === "oauth-callback";

    // 🚫 Not logged in → redirect to login (but not if on OAuth callback)
    if (!user && !inAuthGroup && !inOAuthCallback) {
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
      <StatusBar style="light" />
      <AuthProvider>
        <RootNavigation />
      </AuthProvider>
      <Toast />
    </SafeAreaProvider>
  );
}