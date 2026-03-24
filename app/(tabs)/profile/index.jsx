import { View, Text, Button, TouchableOpacity, ActivityIndicator, Alert } from "react-native";
import { useAuth } from "../../../context/authContext";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import supportService from "../../../lib/appwrite/support";
import { useState } from "react";

export default function Profile() {
  const { logout, user } = useAuth();
  const router = useRouter();
  const [loadingSupport, setLoadingSupport] = useState(false);

  const handleLogout = async () => {
    await logout();
    router.replace("/(auth)/login");
  };

  const handleSupportPress = async () => {
    if (!user?.$id) return;
    
    try {
      setLoadingSupport(true);
      const ticket = await supportService.getOrCreateActiveTicket(user.$id);
      router.push(`/(support)/${ticket.$id}`);
    } catch (error) {
      console.error("Support navigation failed:", error);
      Alert.alert("Error", "Could not open support. Please try again later.");
    } finally {
      setLoadingSupport(false);
    }
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
            borderColor: '#2A2A40',
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
          onPress={handleSupportPress}
          disabled={loadingSupport}
        >
          <Text style={{ color: 'white', fontSize: 16 }}>🎧 Support / Help Center</Text>
          <Text style={{ color: 'white', fontSize: 16 }}>{user?.name}</Text>
          {loadingSupport && <ActivityIndicator color="#FF1A1A" size="small" />}
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