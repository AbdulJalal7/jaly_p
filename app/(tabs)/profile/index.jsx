import { View, Text, TouchableOpacity, ActivityIndicator, StyleSheet } from "react-native";
import { useAuth } from "../../../context/authContext";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useState } from "react";
import Toast from 'react-native-toast-message';
import supportService from "../../../lib/appwrite/support";
import { Ionicons } from "@expo/vector-icons";

export default function Profile() {
  const { logout, user } = useAuth();
  const router = useRouter();
  
  const [loadingSupport, setLoadingSupport] = useState(false);

  const handleLogout = async () => {
    await logout();
  };

  const handleSupportPress = async () => {
    if (!user?.$id) return;
    try {
      setLoadingSupport(true);
      const ticket = await supportService.getOrCreateActiveTicket(user.$id);
      router.push(`/(support)/${ticket.$id}`);
    } catch (error) {
      console.error("Support navigation failed:", error);
      Toast.show({ type: 'error', text1: 'Error', text2: 'Could not open support. Please try again later.' });
    } finally {
      setLoadingSupport(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#121212" }}>
      <View style={styles.container}>
        <View style={styles.headerTitleRow}>
           <Text style={styles.headerTitle}>My Profile</Text>
        </View>

        <View style={styles.avatarContainer}>
          <Ionicons name="person-circle" size={70} color="#FF3366" />
          <View style={styles.userInfo}>
            <Text style={styles.userName}>{user?.name || "Player"}</Text>
            <Text style={styles.userEmail}>{user?.email}</Text>
            {user?.labels?.includes("admin") && (
              <View style={styles.adminBadge}>
                <Text style={styles.adminBadgeText}>ADMIN</Text>
              </View>
            )}
          </View>
        </View>
        
        <View style={styles.statsCard}>
          <View style={styles.statItem}>
             <Text style={styles.statValue}>Rs {user?.wallet_balance || 0}</Text>
             <Text style={styles.statLabel}>Balance</Text>
          </View>
          <View style={styles.statItem}>
             <Text style={styles.statValue}>{user?.wins || 0}</Text>
             <Text style={styles.statLabel}>Wins</Text>
          </View>
          <View style={styles.statItem}>
             <Text style={styles.statValue}>{user?.total_matches || 0}</Text>
             <Text style={styles.statLabel}>Matches</Text>
          </View>
        </View>

        <View style={styles.actionColumn}>
          <TouchableOpacity 
            style={styles.tournamentsBtn} 
            onPress={() => router.push("/(details)/my_tournaments")}
          >
            <Ionicons name="trophy" size={20} color="#fff" />
            <Text style={styles.btnText}>My Tournaments</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.supportBtn} 
            onPress={handleSupportPress} 
            disabled={loadingSupport}
          >
            <Ionicons name="help-buoy" size={20} color="#fff" />
            <Text style={styles.btnText}>Support Help</Text>
            {loadingSupport && <ActivityIndicator color="#fff" size="small" style={{marginLeft: 5}} />}
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.logoutBtn} 
            onPress={handleLogout}
          >
            <Ionicons name="log-out" size={20} color="#fff" />
            <Text style={styles.btnText}>Logout</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  headerTitleRow: {
    marginBottom: 20,
    marginTop: 10,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#fff",
  },
  avatarContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  userInfo: {
    marginLeft: 15,
    flex: 1,
  },
  userName: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#fff",
  },
  userEmail: {
    fontSize: 14,
    color: "#aaa",
    marginTop: 2,
  },
  adminBadge: {
    backgroundColor: "#ff9800",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    alignSelf: "flex-start",
    marginTop: 5,
  },
  adminBadgeText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "bold",
  },
  statsCard: {
    flexDirection: "row",
    backgroundColor: "#1e1e1e",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#333",
    justifyContent: "space-around",
    marginBottom: 30,
  },
  statItem: {
    alignItems: "center",
  },
  statValue: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#FF3366",
  },
  statLabel: {
    fontSize: 12,
    color: "#888",
    marginTop: 4,
  },
  actionColumn: {
    flexDirection: "column",
    gap: 15,
  },
  tournamentsBtn: {
    flexDirection: "row",
    backgroundColor: "#FF3366",
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  supportBtn: {
    flexDirection: "row",
    backgroundColor: "#2C2C2C",
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  logoutBtn: {
    flexDirection: "row",
    backgroundColor: "#FF1A1A",
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  btnText: {
    color: "#fff",
    fontWeight: "bold",
    marginLeft: 10,
    fontSize: 16,
  },
});