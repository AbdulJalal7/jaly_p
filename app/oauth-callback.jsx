import { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';

/**
 * This screen exists solely to "catch" the OAuth redirect deep link.
 *
 * When Google OAuth redirects back to the app via:
 *   jalyp://oauth-callback?userId=...&secret=...
 * Expo Router would otherwise fall through to the (support)/[id].jsx
 * dynamic route and try to fetch a support ticket with id "oauth-callback".
 *
 * By having a named route here, Expo Router routes to THIS screen instead.
 * The actual OAuth session is already being created in auth.js via
 * WebBrowser.openAuthSessionAsync BEFORE Expo Router processes the link,
 * so this screen just shows a loading spinner and then redirects home.
 */
export default function OAuthCallback() {
  const router = useRouter();

  useEffect(() => {
    // The session is already being handled by loginWithOAuth() in auth.js.
    // This screen is just a safe landing page. The AuthProvider will detect
    // the new session and the RootNavigation will redirect to /(tabs)/home.
    const timeout = setTimeout(() => {
      router.replace('/(tabs)/home');
    }, 1000);

    return () => clearTimeout(timeout);
  }, []);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#8A5CF5" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
