import { useEffect, useState } from "react";
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, Image, ScrollView, Modal } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Toast from 'react-native-toast-message';
import { SafeAreaView } from "react-native-safe-area-context";
import challengesApi from "../../../lib/appwrite/challengesApi";
import ConfirmModal from "../../../components/ConfirmModal";

export default function AdminTeamChallengesScreen() {
  const [challenges, setChallenges] = useState([]);
  const [results, setResults] = useState({}); // challengeId -> result doc
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("ongoing");

  const [confirmModal, setConfirmModal] = useState({
    visible: false,
    title: "",
    message: "",
    onConfirm: () => {},
  });

  const [imageModal, setImageModal] = useState({ visible: false, url: "" });

  useEffect(() => {
    loadData();
  }, [filter]);

  const loadData = async () => {
    setLoading(true);
    try {
      const resp = await challengesApi.getTeamChallengesByStatus(filter);
      setChallenges(resp.documents);

      // For ongoing, fetch results
      const resultsMap = {};
      if (filter === "ongoing") {
        for (const chal of resp.documents) {
          const res = await challengesApi.getMatchResults(chal.$id);
          if (res.documents.length > 0) {
            resultsMap[chal.$id] = res.documents[0];
          }
        }
      }
      setResults(resultsMap);
    } catch (error) {
      console.error(error);
      Toast.show({ type: 'error', text1: 'Error', text2: 'Failed to load team challenges.' });
    } finally {
      setLoading(false);
    }
  };

  const handleResolve = (challenge, winnerId, winnerName) => {
    setConfirmModal({
      visible: true,
      title: "Confirm Winner",
      message: `Are you sure you want to declare ${winnerName} as the winner?\n\nPrize pool of ₹${challenge.prize_pool} will be credited.`,
      onConfirm: async () => {
        try {
          await challengesApi.completeTeamChallengeAdmin({
            challengeId: challenge.$id,
            winnerId,
            prize: challenge.prize_pool || 0
          });
          Toast.show({ type: 'success', text1: 'Match Resolved', text2: `${winnerName} has been credited.` });
          loadData();
        } catch (error) {
          Toast.show({ type: 'error', text1: 'Payout Error', text2: 'Failed to process win.' });
        }
      }
    });
  };

  const renderChallenge = ({ item }) => {
    const result = results[item.$id];
    const challengerName = "Creator"; // Ideally fetch user names if needed, but Appwrite relations usually nested
    const opponentName = "Opponent";

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View>
            <Text style={styles.gameName}>{item.game_name}</Text>
            <Text style={styles.metaText}>{item.mode} • {item.map}</Text>
          </View>
          <View style={styles.prizeBadge}>
            <Text style={styles.prizeText}>₹{item.prize_pool || (item.challenge_price * 1.8)}</Text>
          </View>
        </View>

        <View style={styles.vsContainer}>
           <Text style={styles.pName}>{item.creator_id?.username || "Challenger"}</Text>
           <Text style={styles.vsLabel}>VS</Text>
           <Text style={styles.pName}>{item.selected_opponent_id?.username || "Opponent"}</Text>
        </View>

        {filter === "ongoing" && (
          <View style={styles.proofSection}>
            <Text style={styles.sectionTitle}>Verification Proofs:</Text>
            <View style={styles.proofGrid}>
               <View style={styles.proofItem}>
                  <Text style={styles.proofLabel}>Challenger</Text>
                  {result?.challenger_screenshot ? (
                    <TouchableOpacity onPress={() => setImageModal({ visible: true, url: result.challenger_screenshot })}>
                      <Image source={{ uri: result.challenger_screenshot }} style={styles.screenshot} resizeMode="cover" />
                    </TouchableOpacity>
                  ) : (
                    <View style={styles.noProof}><Text style={styles.noProofText}>Pending</Text></View>
                  )}
               </View>
               <View style={styles.proofItem}>
                  <Text style={styles.proofLabel}>Opponent</Text>
                  {result?.opponent_screenshot ? (
                    <TouchableOpacity onPress={() => setImageModal({ visible: true, url: result.opponent_screenshot })}>
                      <Image source={{ uri: result.opponent_screenshot }} style={styles.screenshot} resizeMode="cover" />
                    </TouchableOpacity>
                  ) : (
                    <View style={styles.noProof}><Text style={styles.noProofText}>Pending</Text></View>
                  )}
               </View>
            </View>

            <View style={styles.actionRow}>
               <TouchableOpacity 
                 style={[styles.actionBtn, { backgroundColor: '#00FF66' }]}
                 onPress={() => handleResolve(item, item.creator_id?.$id || item.creator_id, "Challenger")}
               >
                 <Text style={styles.actionBtnText}>Creator Won</Text>
               </TouchableOpacity>
               <TouchableOpacity 
                 style={[styles.actionBtn, { backgroundColor: '#FF3366' }]}
                 onPress={() => handleResolve(item, item.selected_opponent_id?.$id || item.selected_opponent_id, "Opponent")}
               >
                 <Text style={styles.actionBtnText}>Opponent Won</Text>
               </TouchableOpacity>
            </View>
          </View>
        )}

        {filter === "completed" && (
          <View style={styles.winnerInfo}>
             <Ionicons name="trophy" size={20} color="#FFD700" />
             <Text style={styles.winnerText}>Winner: {item.winner_id === item.creator_id ? "Challenger" : "Opponent"}</Text>
          </View>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Team Results</Text>
        <View style={styles.tabs}>
           {["ongoing", "completed"].map(t => (
             <TouchableOpacity 
              key={t} 
              style={[styles.tab, filter === t && styles.tabActive]}
              onPress={() => setFilter(t)}
             >
               <Text style={[styles.tabText, filter === t && styles.tabTextActive]}>
                 {t.charAt(0).toUpperCase() + t.slice(1)}
               </Text>
             </TouchableOpacity>
           ))}
        </View>
      </View>

      {loading ? (
        <View style={styles.loading}>
          <ActivityIndicator size="large" color="#FF3366" />
        </View>
      ) : (
        <FlatList
          data={challenges}
          keyExtractor={i => i.$id}
          renderItem={renderChallenge}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyText}>No matches found.</Text>
            </View>
          }
        />
      )}

      {/* Confirmation Modal */}
      <ConfirmModal
        visible={confirmModal.visible}
        title={confirmModal.title}
        message={confirmModal.message}
        onConfirm={() => {
          setConfirmModal(prev => ({ ...prev, visible: false }));
          confirmModal.onConfirm();
        }}
        onCancel={() => setConfirmModal(prev => ({ ...prev, visible: false }))}
      />

      {/* Image Preview Modal */}
      <Modal visible={imageModal.visible} transparent animationType="fade">
        <TouchableOpacity 
          style={styles.fullImageOverlay} 
          onPress={() => setImageModal({ visible: false, url: "" })}
        >
          <Image source={{ uri: imageModal.url }} style={styles.fullImage} resizeMode="contain" />
          <TouchableOpacity style={styles.closeFullImage} onPress={() => setImageModal({ visible: false, url: "" })}>
             <Ionicons name="close-circle" size={40} color="#FFF" />
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#121212" },
  header: { padding: 16, borderBottomWidth: 1, borderBottomColor: "#333" },
  title: { fontSize: 24, fontWeight: "bold", color: "#FFF", marginBottom: 12 },
  tabs: { flexDirection: "row", backgroundColor: "#1e1e1e", borderRadius: 8, padding: 4 },
  tab: { flex: 1, paddingVertical: 8, alignItems: "center", borderRadius: 6 },
  tabActive: { backgroundColor: "#333" },
  tabText: { color: "#888", fontWeight: "600" },
  tabTextActive: { color: "#FFF" },

  loading: { flex: 1, justifyContent: "center" },
  list: { padding: 16 },
  empty: { marginTop: 100, alignItems: "center" },
  emptyText: { color: "#666", fontSize: 16 },

  card: { backgroundColor: "#1e1e1e", borderRadius: 12, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: "#333" },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 },
  gameName: { fontSize: 18, fontWeight: "bold", color: "#FFF" },
  metaText: { color: "#888", fontSize: 12, marginTop: 2 },
  prizeBadge: { backgroundColor: "#00FF6620", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6, borderWidth: 1, borderColor: "#00FF6630" },
  prizeText: { color: "#00FF66", fontWeight: "bold", fontSize: 14 },

  vsContainer: { flexDirection: "row", alignItems: "center", justifyContent: "center", paddingVertical: 10, backgroundColor: "#0005", borderRadius: 8, marginBottom: 16 },
  pName: { color: "#FFF", fontSize: 14, fontWeight: "500", flex: 1, textAlign: "center" },
  vsLabel: { color: "#FF3366", fontWeight: "bold", marginHorizontal: 12 },

  proofSection: { borderTopWidth: 1, borderTopColor: "#333", paddingTop: 16 },
  sectionTitle: { color: "#AAA", fontSize: 12, fontWeight: "bold", marginBottom: 10, textTransform: "uppercase" },
  proofGrid: { flexDirection: "row", gap: 12, marginBottom: 20 },
  proofItem: { flex: 1 },
  proofLabel: { color: "#666", fontSize: 10, marginBottom: 6, textAlign: "center" },
  screenshot: { width: '100%', height: 120, borderRadius: 8, backgroundColor: '#000' },
  noProof: { width: '100%', height: 120, borderRadius: 8, backgroundColor: '#121212', justifyContent: "center", alignItems: "center", borderStyle: "dashed", borderWidth: 1, borderColor: "#333" },
  noProofText: { color: "#444", fontSize: 12 },

  actionRow: { flexDirection: "row", gap: 10 },
  actionBtn: { flex: 1, paddingVertical: 12, borderRadius: 8, alignItems: "center" },
  actionBtnText: { color: "#000", fontWeight: "bold", fontSize: 13 },

  winnerInfo: { flexDirection: "row", alignItems: "center", justifyContent: "center", backgroundColor: "#FFD70010", padding: 12, borderRadius: 8 },
  winnerText: { color: "#FFD700", fontWeight: "bold", marginLeft: 8 },

  fullImageOverlay: { flex: 1, backgroundColor: "#000E", justifyContent: "center", alignItems: "center" },
  fullImage: { width: '90%', height: '80%' },
  closeFullImage: { position: "absolute", top: 50, right: 20 },
});
