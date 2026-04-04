import { View, Text, StyleSheet, TouchableOpacity, FlatList, ActivityIndicator, RefreshControl } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useState, useCallback } from "react";
import { useRouter, useFocusEffect } from "expo-router";
import { useAuth } from "../../../context/authContext";
import challengesApi from "../../../lib/appwrite/challengesApi";
import { Ionicons } from "@expo/vector-icons";
import Alert from "react-native-toast-message";

export default function ChallengesFeed() {
  const { user } = useAuth();
  const router = useRouter();
  const [challenges, setChallenges] = useState([]);
  const [participations, setParticipations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [processingId, setProcessingId] = useState(null);
  const [activeTab, setActiveTab] = useState("all"); // Modes: all (open), my (created), joined (accepted)

  const fetchChallenges = async () => {
    try {
      const response = await challengesApi.listChallenges();
      setChallenges(response.documents);
      
      if (user?.$id) {
         const partsRes = await challengesApi.getMyParticipations(user.$id);
         setParticipations(partsRes.documents.map(p => p.challenge_id));
      }
    } catch (error) {
      console.error("Failed to load challenges", error);
      Alert.show({ type: "error", text1: "Error loading challenges", text2: error.message });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchChallenges();
    }, [user?.$id])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchChallenges();
  };

  // Filtering Logic
  const filteredChallenges = challenges.filter(item => {
    const isCreator = item.creator_id === user?.$id;
    const hasAccepted = participations.includes(item.$id);

    if (activeTab === "my") return isCreator;
    if (activeTab === "joined") return hasAccepted && !isCreator;
    // Default "All" tab shows Open challenges created by others
    return item.status === "open" && !isCreator && !hasAccepted;
  });

  const handleAcceptChallenge = async (challenge) => {
    // ... same as before
    if (!user?.$id) return;
    try {
      setProcessingId(challenge.$id);
      const result = await challengesApi.acceptChallenge({
        challengeId: challenge.$id,
        userId: user.$id,
        price: challenge.challenge_price,
      });

      if (result.success) {
        Alert.show({ type: "success", text1: "Challenge Accepted!", text2: "Amount deducted from wallet." });
        router.push(`/challenge/${challenge.$id}`);
      } else if (result.error === "low_balance") {
        Alert.show({
          type: "error",
          text1: "Insufficient Balance",
          text2: "Please deposit funds first. Tap to go to Wallet.",
          onPress: () => router.push("/wallet/deposit")
        });
      }
    } catch (error) {
      if (error.message.includes("Insufficient wallet balance")) {
        // Redundant with API check but safe
        Alert.show({
          type: "error",
          text1: "Insufficient Balance",
          text2: "Please deposit funds first. Tap to go to Wallet.",
          onPress: () => router.push("/wallet/deposit")
        });
      } else {
        Alert.show({ type: "error", text1: "Action Failed", text2: error.message });
      }
    } finally {
      setProcessingId(null);
    }
  };

  const renderItem = ({ item }) => {
    const isCreator = item.creator_id === user?.$id;
    const isOpen = item.status === "open";
    const hasAccepted = participations.includes(item.$id);
    
    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.gameTitle}>{item.game_name} ({item.mode})</Text>
          <View style={[styles.statusBadge, { backgroundColor: isOpen ? '#4caf5020' : '#ff980020' }]}>
            <Text style={[styles.statusText, { color: isOpen ? '#4caf50' : '#ff9800' }]}>
              {item.status.toUpperCase()}
            </Text>
          </View>
        </View>

        <View style={styles.detailsRow}>
          <Text style={styles.detailText}>🗺️ Map: {item.map}</Text>
          <Text style={styles.priceText}>💰 ₹{item.challenge_price}</Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.challengerText}>👤 Challenger: {item.creator_name}</Text>
          {item.game_ids && item.game_ids.length > 0 && (
            <Text style={styles.gameIdText}>🆔 IDs: {item.game_ids.join(", ")}</Text>
          )}
        </View>

        <View style={styles.actionsBox}>
           <View style={{ flexDirection: 'row', gap: 10 }}>
              <TouchableOpacity 
                style={[styles.btn, isCreator ? styles.manageBtn : styles.viewBtn, { flex: 1 }]} 
                onPress={() => router.push(`/challenge/${item.$id}`)}
              >
                <Text style={styles.btnText}>
                  {isCreator ? "Manage" : "Participants"}
                </Text>
              </TouchableOpacity>

              {isOpen && !isCreator && !hasAccepted && (
                 <TouchableOpacity 
                    style={[styles.btn, styles.primaryBtn, { flex: 1 }, processingId === item.$id && styles.disabledBtn]} 
                    disabled={processingId === item.$id}
                    onPress={() => handleAcceptChallenge(item)}
                  >
                    {processingId === item.$id ? (
                       <ActivityIndicator color="#FFF" size="small"/>
                    ) : (
                       <Text style={styles.btnText}>Accept</Text>
                    )}
                 </TouchableOpacity>
              )}

              {hasAccepted && !isCreator && (
                 <View style={[styles.btn, styles.acceptedBtn, { flex: 0.7, opacity: 0.9 }]}>
                    <Text style={styles.btnText}>ACCEPTED</Text>
                 </View>
              )}
           </View>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#FF1A1A" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.headerTitle}>Challenges</Text>

      {/* Tab Selector */}
      <View style={styles.tabBar}>
        <TouchableOpacity 
          style={[styles.tabItem, activeTab === "all" && styles.activeTabItem]} 
          onPress={() => setActiveTab("all")}
        >
          <Text style={[styles.tabText, activeTab === "all" && styles.activeTabText]}>Open</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.tabItem, activeTab === "my" && styles.activeTabItem]} 
          onPress={() => setActiveTab("my")}
        >
          <Text style={[styles.tabText, activeTab === "my" && styles.activeTabText]}>My Challenges</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.tabItem, activeTab === "joined" && styles.activeTabItem]} 
          onPress={() => setActiveTab("joined")}
        >
          <Text style={[styles.tabText, activeTab === "joined" && styles.activeTabText]}>Joined</Text>
        </TouchableOpacity>
      </View>

      {filteredChallenges.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Nothing found here.</Text>
        </View>
      ) : (
        <FlatList
          data={filteredChallenges}
          keyExtractor={(item) => item.$id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#FF1A1A" />}
        />
      )}

      {/* FAB only in My Challenges tab */}
      {activeTab === "my" && (
        <TouchableOpacity 
          style={styles.fab} 
          onPress={() => router.push("/create_challenge")}
          activeOpacity={0.8}
        >
          <Ionicons name="add" size={32} color="#FFF" />
        </TouchableOpacity>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#121212" },
  centerContainer: { flex: 1, backgroundColor: "#121212", justifyContent: "center", alignItems: "center" },
  headerTitle: { fontSize: 24, fontWeight: "bold", color: "#FFF", padding: 16 },
  list: { paddingHorizontal: 16, paddingBottom: 100 },
  card: { backgroundColor: "#1E1E1E", borderRadius: 12, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: "#333" },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  gameTitle: { fontSize: 18, fontWeight: "bold", color: "#FFF" },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 },
  statusText: { fontSize: 12, fontWeight: "bold" },
  detailsRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 16 },
  detailText: { color: "#AAA", fontSize: 14 },
  priceText: { color: "#4caf50", fontSize: 16, fontWeight: "bold" },
  infoRow: { marginBottom: 16, gap: 4 },
  challengerText: { color: "#FFF", fontSize: 14, fontWeight: "600" },
  gameIdText: { color: "#AAA", fontSize: 13 },
  actionsBox: { borderTopWidth: 1, borderTopColor: "#333", paddingTop: 16 },
  btn: { paddingVertical: 12, borderRadius: 8, alignItems: "center" },
  primaryBtn: { backgroundColor: "#FF3366" },
  manageBtn: { backgroundColor: "#007AFF" },
  acceptedBtn: { backgroundColor: "#007AFF" },
  viewBtn: { backgroundColor: "#444" },
  disabledBtn: { opacity: 0.5 },
  btnText: { color: "#FFF", fontSize: 16, fontWeight: "bold" },
  fab: { position: "absolute", bottom: 24, right: 24, width: 64, height: 64, borderRadius: 32, backgroundColor: "#FF3366", justifyContent: "center", alignItems: "center", shadowColor: "#FF3366", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.5, shadowRadius: 8, elevation: 8 },
  emptyContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  emptyText: { color: "#888", fontSize: 16 },
  tabBar: { flexDirection: "row", paddingHorizontal: 16, marginBottom: 16, gap: 10 },
  tabItem: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 20, backgroundColor: "#1E1E1E", borderWidth: 1, borderColor: "#333" },
  activeTabItem: { backgroundColor: "#FF3366cc", borderColor: "#FF3366" },
  tabText: { color: "#AAA", fontSize: 14, fontWeight: "600" },
  activeTabText: { color: "#FFF" },
});
