import { View, Text, Button } from "react-native";
import { useAuth } from "../../../context/authContext";
import { useRouter } from "expo-router";

export default function Profile() {
  const { logout } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
    router.replace("/(auth)/login");
  };

  return (
    <View>
      <Text>Profile</Text>
      <Button title="Logout" onPress={handleLogout} />
    </View>
  );
}