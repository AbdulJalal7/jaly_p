import { useEffect, useState } from "react";
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { Databases, Query } from "react-native-appwrite";
import client from "../../../lib/appwrite/client";
import { useAuth } from "../../../context/authContext";

const DATABASE_ID = "6992ce540025a687a83e";
const USERS_COLLECTION_ID = "users";
const databases = new Databases(client);

export default function ChallengesScreen() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user: currentUser } = useAuth();
  const router = useRouter();

  useEffect(() => {
    fetchUsers();
  }, [currentUser]);

  const fetchUsers = async () => {
    if (!currentUser) return;
    try {
      // NOTE: Query.notEqual will ensure the user cannot challenge themselves
      const resp = await databases.listDocuments(DATABASE_ID, USERS_COLLECTION_ID, [
        Query.notEqual("user_id", currentUser.$id),
        Query.limit(50),
      ]);
      setUsers(resp.documents);
    } catch (error) {
      console.log("Error fetching users:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleChallenge = (opponent) => {
    router.push({
      pathname: "/challenges/create",
      params: { 
        opponentId: opponent.$id, 
        opponentName: opponent.username || opponent.name || "Unknown"
      }
    });
  };

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: "center" }]}>
        <ActivityIndicator size="large" color="#FF3366" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>1v1 Players</Text>
        <TouchableOpacity 
          style={styles.myChallengesBtn} 
          onPress={() => router.push("/challenges/my_challenges")}
        >
          <Text style={styles.myChallengesText}>My Challenges</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={users}
        keyExtractor={(item) => item.$id}
        contentContainerStyle={{ padding: 15 }}
        ListEmptyComponent={
          <Text style={styles.emptyText}>No other players found.</Text>
        }
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.userInfo}>
              <Text style={styles.username}>{item.username || item.name || "Unknown Player"}</Text>
              <Text style={styles.stats}>
                🏆 Wins: {item.wins || 0} | 💔 Losses: {item.losses || 0} | ⚔️ Matches: {item.total_matches || 0}
              </Text>
            </View>
            <TouchableOpacity 
              style={styles.challengeBtn}
              onPress={() => handleChallenge(item)}
            >
              <Text style={styles.btnText}>Challenge</Text>
            </TouchableOpacity>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#121212" },
  headerRow: { 
    flexDirection: "row", 
    justifyContent: "space-between", 
    alignItems: "center", 
    padding: 20,
    marginTop: 40 // Safe area offset
  },
  title: { fontSize: 24, fontWeight: "bold", color: "#fff" },
  myChallengesBtn: { 
    backgroundColor: "#333", 
    paddingHorizontal: 15, 
    paddingVertical: 8, 
    borderRadius: 8 
  },
  myChallengesText: { color: "#00FF66", fontWeight: "bold" },
  card: { 
    backgroundColor: "#1e1e1e", 
    padding: 15, 
    marginVertical: 8, 
    borderRadius: 12, 
    flexDirection: "row", 
    justifyContent: "space-between", 
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#333"
  },
  userInfo: { flex: 1 },
  username: { fontSize: 18, fontWeight: "600", color: "#fff", marginBottom: 4 },
  stats: { fontSize: 12, color: "#aaa" },
  challengeBtn: { 
    backgroundColor: "#FF3366", 
    paddingHorizontal: 18, 
    paddingVertical: 10, 
    borderRadius: 8, 
    marginLeft: 10 
  },
  btnText: { color: "#fff", fontWeight: "bold" },
  emptyText: { color: "#888", textAlign: "center", marginTop: 40 },
});
