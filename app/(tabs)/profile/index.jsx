import { View, Text, Button, TouchableOpacity } from "react-native";
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
    <SafeAreaView style={{ flex: 1, backgroundColor: '#0F0F1A' }}>
      <View style={{ flex: 1, padding: 20 }}>
        <Text style={{ fontSize: 24, marginBottom: 30, color: 'white', fontWeight: 'bold' }}>Profile</Text>
        
        <TouchableOpacity 
          style={{
            backgroundColor: '#1C1C2E',
            padding: 16,
            borderRadius: 8,
            marginBottom: 20,
            borderWidth: 1,
            borderColor: '#2A2A40'
          }}
          onPress={() => router.push('/(support)')}
        >
          <Text style={{ color: 'white', fontSize: 16 }}>🎧 Support / Help Center</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={{
            backgroundColor: '#FF1A1A',
            padding: 16,
            borderRadius: 8,
            alignItems: 'center'
          }}
          onPress={handleLogout}
        >
          <Text style={{ color: 'white', fontSize: 16, fontWeight: 'bold' }}>Logout</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}