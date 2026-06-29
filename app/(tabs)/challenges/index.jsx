import { useEffect, useState, useCallback } from "react";
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, StyleSheet, TextInput, Image, SectionList } from "react-native";
import { useRouter, useFocusEffect } from "expo-router";
import { Databases, Query } from "react-native-appwrite";
import Toast from 'react-native-toast-message';
import client from "../../../lib/appwrite/client";
import { useAuth } from "../../../context/authContext";
import { useChat } from "../../../hooks/useChat";
import ChatService from "../../../lib/appwrite/chat";
import { Ionicons } from "@expo/vector-icons";

const DATABASE_ID = process.env.EXPO_PUBLIC_APPWRITE_DATABASE_ID;
const USERS_COLLECTION_ID = "users";
const databases = new Databases(client);

export default function ChallengesScreen() {
  const [allUsers, setAllUsers] = useState([]);
  const [recentChats, setRecentChats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const { user: currentUser } = useAuth();

  const router = useRouter();
  const { startChat, loading: chatLoading } = useChat();

  // Fetch users and chats together every time screen is focused
  useFocusEffect(
    useCallback(() => {
      if (currentUser) fetchData();
    }, [currentUser])
  );

  const fetchData = async () => {
    if (!currentUser) return;
    setLoading(true);
    try {
      // currentUser.$id is the database document $id — this is what's stored in chat participants
      const myDbId = currentUser.$id;
      // currentUser.user_id is the Appwrite account UUID — used for the users collection query
      const myAccountId = currentUser.user_id || currentUser.$id;

      // Fetch all other users (excluding self)
      const resp = await databases.listDocuments(DATABASE_ID, USERS_COLLECTION_ID, [
        Query.notEqual("user_id", myAccountId),
        Query.limit(100),
      ]);
      const filteredUsers = resp.documents.filter(
        (u) => u.$id !== myDbId && u.user_id !== myAccountId
      );

      // Build a lookup map: database $id → user object
      const userById = {};
      filteredUsers.forEach((u) => { userById[u.$id] = u; });

      // Fetch my chats sorted by last message time (uses myDbId since that's what's in participants)
      const chats = await ChatService.getUserChats(myDbId);

      // For each chat, resolve the other participant's user info
      const populatedChats = await Promise.all(
        chats.map(async (chat) => {
          // The other participant's database $id
          const otherId = chat.participants.find((p) => p !== myDbId);
          if (!otherId) return null;

          // Look up in our already-fetched user map first
          let otherUser = userById[otherId];
          if (!otherUser) {
            // Fallback: fetch directly by document $id
            try {
              const res = await databases.getDocument(DATABASE_ID, USERS_COLLECTION_ID, otherId);
              otherUser = res;
            } catch (_) {}
          }
          if (!otherUser) return null;
          return { ...chat, otherUser };
        })
      );

      const validChats = populatedChats.filter(Boolean);
      const chattedUserIds = new Set(validChats.map((c) => c.otherUser.$id));

      setRecentChats(validChats);
      // Show remaining players (not yet in any chat) in the Players section
      setAllUsers(filteredUsers.filter((u) => !chattedUserIds.has(u.$id)));
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleChallenge = (opponent) => {
    router.push({
      pathname: "/challenges/create",
      params: {
        opponentId: opponent.$id,
        opponentName: opponent.username || opponent.name || "Unknown",
      },
    });
  };

  const handleOpenChat = async (opponent) => {
    const chat = await startChat(opponent.$id);
    if (chat) {
      router.push({
        pathname: `/chat/${chat.$id}`,
        params: {
          targetUserId: opponent.$id,
          targetUserName: opponent.username || opponent.name || "Opponent",
        },
      });
    } else {
      Toast.show({ type: "error", text1: "Error", text2: "Could not open chat." });
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: "center" }]}>
        <ActivityIndicator size="large" color="#FF3366" />
      </View>
    );
  }

  const filterUsers = (list) => {
    if (!searchQuery) return list;
    const q = searchQuery.toLowerCase();
    return list.filter((u) => {
      const nameMatch = (u.username?.toLowerCase() || "").includes(q) || (u.name?.toLowerCase() || "").includes(q);
      const gameIdMatch = (u.game_id?.toLowerCase() || "").includes(q);
      return nameMatch || gameIdMatch;
    });
  };

  const filterChats = (list) => {
    if (!searchQuery) return list;
    const q = searchQuery.toLowerCase();
    return list.filter((c) => {
      const u = c.otherUser;
      return (u?.username?.toLowerCase() || "").includes(q) || (u?.name?.toLowerCase() || "").includes(q);
    });
  };

  const filteredChats = filterChats(recentChats);
  const filteredPlayers = filterUsers(allUsers);

  const formatTime = (iso) => {
    if (!iso) return "";
    const d = new Date(iso);
    const now = new Date();
    const isToday = d.toDateString() === now.toDateString();
    return isToday
      ? d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      : d.toLocaleDateString([], { month: "short", day: "numeric" });
  };

  const renderChatItem = ({ item }) => {
    const u = item.otherUser;
    return (
      <TouchableOpacity style={styles.chatRow} onPress={() => handleOpenChat(u)} activeOpacity={0.7}>
        <View style={styles.avatarWrap}>
          {u?.avatar ? (
            <Image source={{ uri: u.avatar }} style={styles.chatAvatar} />
          ) : (
            <Ionicons name="person-circle" size={44} color="#FF3366" />
          )}
          <View style={styles.onlineDot} />
        </View>
        <View style={styles.chatInfo}>
          <View style={styles.chatTopRow}>
            <Text style={styles.chatName} numberOfLines={1}>{u?.username || u?.name || "Unknown"}</Text>
            <Text style={styles.chatTime}>{formatTime(item.last_message_time)}</Text>
          </View>
          <Text style={styles.lastMessage} numberOfLines={1}>
            {item.last_message || "No messages yet"}
          </Text>
        </View>
        <TouchableOpacity style={styles.challengeChip} onPress={() => handleChallenge(u)}>
          <Ionicons name="game-controller" size={12} color="#fff" />
          <Text style={styles.challengeChipText}>1v1</Text>
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  const renderPlayerItem = ({ item }) => (
    <View style={styles.playerRow}>
      <View style={styles.playerLeft}>
        {item.avatar ? (
          <Image source={{ uri: item.avatar }} style={styles.playerAvatar} />
        ) : (
          <Ionicons name="person-circle" size={36} color="#FF3366" />
        )}
        <View style={styles.playerInfo}>
          <Text style={styles.playerName} numberOfLines={1}>{item.username || item.name || "Unknown"}</Text>
          <Text style={styles.playerMeta} numberOfLines={1}>
            {item.game_id ? `ID: ${item.game_id}` : "No game ID"} · W:{item.wins || 0} L:{item.losses || 0}
          </Text>
        </View>
      </View>
      <View style={styles.playerActions}>
        <TouchableOpacity style={styles.chatTextBtn} onPress={() => handleOpenChat(item)} disabled={chatLoading}>
          <Text style={styles.chatBtnText}>Chat</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.challengeTextBtn} onPress={() => handleChallenge(item)}>
          <Text style={styles.challengeBtnText}>Challenge</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderSectionHeader = ({ section }) => (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionHeaderText}>{section.title}</Text>
      {section.count > 0 && (
        <View style={styles.countBadge}>
          <Text style={styles.countBadgeText}>{section.count}</Text>
        </View>
      )}
    </View>
  );

  const sections = [];
  if (filteredChats.length > 0) {
    sections.push({ title: "Recent Chats", data: filteredChats, count: filteredChats.length, isChat: true });
  }
  if (filteredPlayers.length > 0) {
    sections.push({ title: "Players", data: filteredPlayers, count: filteredPlayers.length, isChat: false });
  }

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>1v1</Text>
        <TouchableOpacity
          style={styles.myChallengesBtn}
          onPress={() => router.push("/challenges/my_challenges")}
        >
          <Text style={styles.myChallengesText}>My Challenges</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.searchContainer}>
        <Ionicons name="search" size={16} color="#888" style={{ marginRight: 8 }} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search players..."
          placeholderTextColor="#666"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      <SectionList
        sections={sections}
        keyExtractor={(item) => item.$id}
        renderSectionHeader={renderSectionHeader}
        renderItem={({ item, section }) =>
          section.isChat ? renderChatItem({ item }) : renderPlayerItem({ item })
        }
        ListEmptyComponent={
          <View style={styles.emptyWrap}>
            <Ionicons name="people-outline" size={48} color="#333" />
            <Text style={styles.emptyText}>No players found.</Text>
          </View>
        }
        stickySectionHeadersEnabled={false}
        contentContainerStyle={{ paddingBottom: 30 }}
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
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 12,
  },
  title: { fontSize: 26, fontWeight: "bold", color: "#fff" },
  myChallengesBtn: {
    backgroundColor: "#1E1E1E",
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#333",
  },
  myChallengesText: { color: "#00FF66", fontWeight: "bold", fontSize: 13 },

  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 16,
    marginBottom: 12,
    backgroundColor: "#1E1E1E",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: "#2a2a2a",
  },
  searchInput: { flex: 1, color: "#fff", fontSize: 14 },

  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  sectionHeaderText: { fontSize: 13, fontWeight: "700", color: "#888", textTransform: "uppercase", letterSpacing: 0.8 },
  countBadge: {
    backgroundColor: "#FF3366",
    borderRadius: 10,
    paddingHorizontal: 7,
    paddingVertical: 2,
    marginLeft: 8,
  },
  countBadgeText: { fontSize: 11, color: "#fff", fontWeight: "bold" },

  // Chat row
  chatRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#1a1a1a",
  },
  avatarWrap: { position: "relative", marginRight: 12 },
  chatAvatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: "#333" },
  onlineDot: {
    position: "absolute",
    bottom: 1,
    right: 1,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#00FF66",
    borderWidth: 2,
    borderColor: "#121212",
  },
  chatInfo: { flex: 1, marginRight: 8 },
  chatTopRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 3 },
  chatName: { fontSize: 15, fontWeight: "700", color: "#fff", flex: 1, marginRight: 8 },
  chatTime: { fontSize: 11, color: "#666" },
  lastMessage: { fontSize: 13, color: "#777" },
  challengeChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FF336620",
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: "#FF336640",
    gap: 4,
  },
  challengeChipText: { fontSize: 11, color: "#FF3366", fontWeight: "bold" },

  // Player row
  playerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#1a1a1a",
  },
  playerLeft: { flexDirection: "row", alignItems: "center", flex: 1, gap: 10 },
  playerAvatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: "#333" },
  playerInfo: { flex: 1 },
  playerName: { fontSize: 15, fontWeight: "600", color: "#fff" },
  playerMeta: { fontSize: 12, color: "#666", marginTop: 2 },
  playerActions: { flexDirection: "row", gap: 8 },
  chatTextBtn: {
    backgroundColor: "#007AFF20",
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#007AFF40",
  },
  chatBtnText: { color: "#007AFF", fontWeight: "bold", fontSize: 12 },
  challengeTextBtn: {
    backgroundColor: "#FF336620",
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#FF336640",
  },
  challengeBtnText: { color: "#FF3366", fontWeight: "bold", fontSize: 12 },

  emptyWrap: { alignItems: "center", marginTop: 60, gap: 12 },
  emptyText: { color: "#555", fontSize: 15 },
});
