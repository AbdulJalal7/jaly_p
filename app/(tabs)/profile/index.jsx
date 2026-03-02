import { View, Text, Button } from "react-native";
import { useAuth } from "../../../context/authContext";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";


export default function Profile() {
  const { logout } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
    router.replace("/(auth)/login");
  };

  return (
    <SafeAreaView style={{ flex: 1 }}>
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      <Text style={{ fontSize: 24, marginBottom: 20 }}>Profile</Text>
      <Button title="Logout" onPress={handleLogout} />
    </View>
    </SafeAreaView>
  );
}
    