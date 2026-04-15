import { useEffect, useState } from "react";
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, StyleSheet, TextInput } from "react-native";
import { useRouter } from "expo-router";
import { Databases, Query } from "react-native-appwrite";
import Toast from 'react-native-toast-message';
import client from "../../../lib/appwrite/client";
import { useAuth } from "../../../context/authContext";
import { useChat } from "../../../hooks/useChat";

const DATABASE_ID = process.env.EXPO_PUBLIC_APPWRITE_DATABASE_ID;
const USERS_COLLECTION_ID = "users";
const databases = new Databases(client);

export default function ChallengesScreen() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const { user: currentUser } = useAuth();

  const router = useRouter();
  const { startChat, loading: chatLoading } = useChat();

  useEffect(() => {
    fetchUsers();
  }, [currentUser]);

  const fetchUsers = async () => {
    if (!currentUser) return;
    try {
      // Use the account ID if available (user_id field), otherwise fallback to $id
      const currentAccountId = currentUser.user_id || currentUser.$id;
      
      const resp = await databases.listDocuments(DATABASE_ID, USERS_COLLECTION_ID, [
        Query.notEqual("user_id", currentAccountId),
        Query.notEqual("$id", currentUser.$id),
        Query.limit(50),
      ]);

      // Double-check filtering on client side for robustness
      const filteredUsers = resp.documents.filter(
        (u) => u.$id !== currentUser.$id && u.user_id !== currentAccountId
      );
      // console.log("Filtered Users : ", filteredUsers);
      setUsers(filteredUsers);
    } catch (error) {
      // console.log("Error fetching users:", error);
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

  const handleChat = async (opponent) => {
    const chat = await startChat(opponent.$id);
    if (chat) {
      router.push({
        pathname: `/chat/${chat.$id}`,
        params: { targetUserId: opponent.$id }
      });
    } else {
      Toast.show({ type: 'error', text1: 'Error', text2: 'Could not create or open chat.' });
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: "center" }]}>
        <ActivityIndicator size="large" color="#FF3366" />
      </View>
    );
  }

  const displayedUsers = users.filter((u) => {
    // console.log("User : ", u.game_id);
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    const nameMatch = (u.username?.toLowerCase() || "").includes(q) || (u.name?.toLowerCase() || "").includes(q);
    const gameIdMatch = (u.game_id?.toLowerCase() || "").includes(q);
    // console.log("Name Match : ", nameMatch);
    // console.log("Game ID Match : ", gameIdMatch);
    return nameMatch || gameIdMatch;
  });

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

      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search by name or game ID..."
          placeholderTextColor="#888"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      <FlatList
        data={displayedUsers}
        keyExtractor={(item) => item.$id}
        contentContainerStyle={{ padding: 15 }}
        ListEmptyComponent={
          <Text style={styles.emptyText}>No other players found.</Text>
        }
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.userInfo}>
              <Text style={styles.username}>{item.username || item.name || "Unknown Player"}</Text>
              {!!item.game_id && <Text style={styles.gameId}>Game ID: {item.game_id}</Text>}
              <Text style={styles.stats}>
                🏆 Wins: {item.wins || 0} | 💔 Losses: {item.losses || 0} | ⚔️ Matches: {item.total_matches || 0}
              </Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <TouchableOpacity 
                style={styles.chatBtn}
                onPress={() => handleChat(item)}
                disabled={chatLoading}
              >
                <Text style={styles.btnText}>{chatLoading ? '...' : 'Chat'}</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.challengeBtn}
                onPress={() => handleChallenge(item)}
              >
                <Text style={styles.btnText}>Challenge</Text>
              </TouchableOpacity>
            </View>
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
  searchContainer: {
    paddingHorizontal: 15,
    marginBottom: 10,
  },
  searchInput: {
    backgroundColor: "#1e1e1e",
    color: "#fff",
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#333",
  },
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
  gameId: { fontSize: 13, color: "#FFA500", marginBottom: 4, fontWeight: "500" },
  stats: { fontSize: 12, color: "#aaa" },
  challengeBtn: { 
    backgroundColor: "#FF3366", 
    paddingHorizontal: 18, 
    paddingVertical: 10, 
    borderRadius: 8, 
    marginLeft: 10 
  },
  chatBtn: { 
    backgroundColor: "#007AFF", 
    paddingHorizontal: 18, 
    paddingVertical: 10, 
    borderRadius: 8, 
    marginLeft: 10 
  },
  btnText: { color: "#fff", fontWeight: "bold" },
  emptyText: { color: "#888", textAlign: "center", marginTop: 40 },
});
