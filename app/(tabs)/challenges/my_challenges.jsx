import { useEffect, useState } from "react";
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from "react-native";
import { useAuth } from "../../../context/authContext";
import challengeService from "../../../lib/appwrite/challenges";

export default function MyChallengesScreen() {
  const { user } = useAuth();
  const [challenges, setChallenges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("pending");

  useEffect(() => {
    loadChallenges();
  }, [user]);

  const loadChallenges = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const data = await challengeService.getUserChallenges(user.$id);
      setChallenges(data);
    } catch (error) {
      console.log("Error loading challenges:", error);
    } finally {
      setLoading(false);
    }
  };

  const getFilteredData = () => {
    return challenges.filter(c => {
      if (filter === "pending") return c.status === "pending";
      if (filter === "active") return c.status === "accepted";
      return ["completed", "rejected", "cancelled", "disputed", "expired"].includes(c.status);
    });
  };

  const isChallenger = (c) => {
    if (!user) return false;
    return (typeof c.challenger_id === 'object' ? c.challenger_id.$id : c.challenger_id) === user.$id;
  };

  const getOpponentName = (c) => {
    const amChallenger = isChallenger(c);
    const op = amChallenger ? c.opponent_id : c.challenger_id;
    return typeof op === 'object' ? (op.username || op.name) : "Opponent Player";
  };

  // 🔴 ACTIONS
  const handleCancel = async (c) => {
    Alert.alert("Cancel Challenge", "You will be refunded immediately.", [
      { text: "No", style: "cancel" },
      { text: "Yes", onPress: async () => {
          try {
            await challengeService.cancelOrRejectChallenge({
              challengeId: c.$id,
              refundUserId: user.$id,
              entryFee: c.entry_fee,
              newStatus: "cancelled"
            });
            Alert.alert("Success", "Challenge cancelled and currency refunded.");
            loadChallenges();
          } catch(e) { Alert.alert("Error", e.message); }
      }}
    ]);
  };

  const handleAccept = async (c) => {
    if (user.wallet_balance < c.entry_fee) {
      return Alert.alert("Insufficient Funds", "Wallet balance must be greater than " + c.entry_fee);
    }
    Alert.alert("Accept Challenge", `₹${c.entry_fee} will be deducted from your wallet to join.`, [
      { text: "Cancel", style: "cancel" },
      { text: "Accept", onPress: async () => {
          try {
            await challengeService.acceptChallenge({
              challengeId: c.$id,
              opponentId: user.$id,
              entryFee: c.entry_fee,
              currentBalance: user.wallet_balance
            });
            Alert.alert("Success", "Challenge accepted!");
            loadChallenges();
          } catch(e) { Alert.alert("Error", e.message); }
      }}
    ]);
  };

  const handleReject = async (c) => {
    Alert.alert("Reject Challenge", "Are you sure?", [
      { text: "No", style: "cancel" },
      { text: "Yes", onPress: async () => {
          try {
            const challengerStr = typeof c.challenger_id === 'object' ? c.challenger_id.$id : c.challenger_id;
            await challengeService.cancelOrRejectChallenge({
              challengeId: c.$id,
              refundUserId: challengerStr,
              entryFee: c.entry_fee,
              newStatus: "rejected"
            });
            Alert.alert("Success", "Challenge rejected. Funds refunded to challenger.");
            loadChallenges();
          } catch(e) { Alert.alert("Error", e.message); }
      }}
    ]);
  };

  const renderItem = ({ item }) => {
    const amChallenger = isChallenger(item);
    
    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.gameTitle}>{item.game} {item.map ? `(${item.map})` : ""}</Text>
          <Text style={[styles.badge, styles[`badge_${item.status}`]]}>{item.status.toUpperCase()}</Text>
        </View>
        
        <Text style={styles.cardBody}>
          <Text style={{color: "#aaa"}}>Match VS:</Text> {getOpponentName(item)}
        </Text>
        <Text style={styles.cardBody}>
          <Text style={{color: "#aaa"}}>Entry:</Text> ₹{item.entry_fee} | <Text style={{color: "#aaa"}}>Prize:</Text> ₹{item.prize}
        </Text>

        {/* Pending Actions */}
        {item.status === "pending" && (
          <View style={styles.actionRow}>
            {amChallenger ? (
              <TouchableOpacity style={[styles.actionBtn, styles.btnRed]} onPress={() => handleCancel(item)}>
                <Text style={styles.btnText}>Cancel Challenge</Text>
              </TouchableOpacity>
            ) : (
              <>
                <TouchableOpacity style={[styles.actionBtn, styles.btnGreen]} onPress={() => handleAccept(item)}>
                  <Text style={styles.btnText}>Accept</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.actionBtn, styles.btnRed]} onPress={() => handleReject(item)}>
                  <Text style={styles.btnText}>Reject</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        )}

        {/* Active Actions */}
        {item.status === "accepted" && (
          <View style={styles.roomBox}>
            <Text style={styles.roomLabel}>Room Assignment:</Text>
            {item.room_id ? (
              <Text style={styles.roomValue}>ID: {item.room_id} | Pass: {item.room_pass}</Text>
            ) : (
              <Text style={styles.roomWait}>Waiting for Admin to provide Room ID...</Text>
            )}
            <Text style={styles.roomSubtitle}>Once completed, the admin will post the results.</Text>
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>My Challenges</Text>
      
      <View style={styles.tabRow}>
        {["pending", "active", "completed"].map(tab => (
          <TouchableOpacity 
            key={tab} 
            style={[styles.tabBtn, filter === tab && styles.tabActive]}
            onPress={() => setFilter(tab)}
          >
            <Text style={[styles.tabText, filter === tab && styles.tabTextActive]}>
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#FF3366" style={{marginTop: 50}} />
      ) : (
        <FlatList
          data={getFilteredData()}
          keyExtractor={i => i.$id}
          contentContainerStyle={{ paddingBottom: 30 }}
          ListEmptyComponent={<Text style={styles.emptyText}>No challenges found.</Text>}
          renderItem={renderItem}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#121212", padding: 15, paddingTop: 50 },
  title: { fontSize: 28, fontWeight: "bold", color: "#fff", marginBottom: 20 },
  tabRow: { flexDirection: "row", marginBottom: 15, backgroundColor: "#1e1e1e", borderRadius: 8, padding: 4 },
  tabBtn: { flex: 1, paddingVertical: 12, alignItems: "center", borderRadius: 6 },
  tabActive: { backgroundColor: "#FF3366" },
  tabText: { color: "#fff", fontWeight: "600" },
  tabTextActive: { color: "#fff", fontWeight: "bold" },
  emptyText: { textAlign: "center", color: "#666", marginTop: 40 },
  
  card: { backgroundColor: "#1e1e1e", padding: 15, borderRadius: 12, marginBottom: 15, borderWidth: 1, borderColor: "#333" },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", marginBottom: 10 },
  gameTitle: { fontSize: 18, fontWeight: "bold", color: "#fff" },
  badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4, fontSize: 10, fontWeight: "bold", overflow: "hidden" },
  badge_pending: { backgroundColor: "#FF9900", color: "#000" },
  badge_accepted: { backgroundColor: "#00FF66", color: "#000" },
  badge_completed: { backgroundColor: "#333", color: "#fff" },
  badge_expired: { backgroundColor: "#333", color: "#aaa" },
  badge_rejected: { backgroundColor: "#FF3333", color: "#fff" },
  badge_cancelled: { backgroundColor: "#555", color: "#ccc" },
  
  cardBody: { fontSize: 14, color: "#fff", marginBottom: 4 },
  actionRow: { flexDirection: "row", marginTop: 15, gap: 10 },
  actionBtn: { flex: 1, paddingVertical: 10, borderRadius: 6, alignItems: "center" },
  btnRed: { backgroundColor: "#FF3366" },
  btnGreen: { backgroundColor: "#00FF66" },
  btnText: { color: "#fff", fontWeight: "bold", textShadowColor: "#000", textShadowOffset: {width: 1, height: 1}, textShadowRadius: 1 },
  
  roomBox: { marginTop: 15, backgroundColor: "#2A2A2A", padding: 12, borderRadius: 8 },
  roomLabel: { color: "#aaa", fontSize: 12, marginBottom: 4 },
  roomValue: { color: "#00FF66", fontSize: 16, fontWeight: "bold" },
  roomWait: { color: "#FF9900", fontStyle: "italic", fontSize: 14 },
  roomSubtitle: { color: "#666", fontSize: 11, marginTop: 8 }
});
