import { useEffect, useState } from "react";
import { View, Text, FlatList, TouchableOpacity, TextInput, StyleSheet, ActivityIndicator, Image } from "react-native";
import { Databases, Query } from "react-native-appwrite";
import Toast from 'react-native-toast-message';
import ConfirmModal from '../../../components/ConfirmModal';
import client from "../../../lib/appwrite/client";
import challengeService from "../../../lib/appwrite/challenges";

const DATABASE_ID = process.env.EXPO_PUBLIC_APPWRITE_DATABASE_ID;
const CHALLENGES_COLLECTION_ID = "challenges";
const databases = new Databases(client);

const MatchProofs = ({ challengeId, chalName, oppName }) => {
  const [proofs, setProofs] = useState(null);

  useEffect(() => {
    challengeService.getMatchResults(challengeId).then((res) => {
      if (res.documents.length > 0) {
        setProofs(res.documents[0]);
      }
    }).catch(console.error);
  }, [challengeId]);

  if (!proofs) return <Text style={{color: '#888', fontSize: 12, textAlign: 'center', marginVertical: 10}}>No proofs uploaded yet.</Text>;

  return (
    <View style={{flexDirection: "row", gap: 10, marginTop: 10, marginBottom: 15}}>
      <View style={{flex: 1}}>
        <Text style={{color: '#fff', fontSize: 10, marginBottom: 4, textAlign: 'center'}}>{chalName} Proof:</Text>
        {proofs.challenger_screenshot ? (
          <Image source={{uri: proofs.challenger_screenshot}} style={{width: '100%', height: 100, borderRadius: 6, backgroundColor: '#333'}} resizeMode="cover" />
        ) : <Text style={{color: '#666', fontSize: 10, textAlign: 'center'}}>Not uploaded</Text>}
      </View>
      
      <View style={{flex: 1}}>
        <Text style={{color: '#fff', fontSize: 10, marginBottom: 4, textAlign: 'center'}}>{oppName} Proof:</Text>
        {proofs.opponent_screenshot ? (
          <Image source={{uri: proofs.opponent_screenshot}} style={{width: '100%', height: 100, borderRadius: 6, backgroundColor: '#333'}} resizeMode="cover" />
        ) : <Text style={{color: '#666', fontSize: 10, textAlign: 'center'}}>Not uploaded</Text>}
      </View>
    </View>
  );
};

export default function AdminChallengesScreen() {
  const [challenges, setChallenges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("accepted"); // Active battles usually need admin the most

  // Form states per challenge
  const [modalVisible, setModalVisible] = useState(false);
  const [modalConfig, setModalConfig] = useState({
    title: "",
    message: "",
    onConfirm: () => {},
  });

  useEffect(() => {
    loadChallenges();
  }, [filter]);

  const loadChallenges = async () => {
    setLoading(true);
    try {
      const resp = await databases.listDocuments(DATABASE_ID, CHALLENGES_COLLECTION_ID, [
        Query.equal("status", filter),
        Query.orderDesc("$createdAt"),
        Query.limit(100)
      ]);
      
      const populated = await challengeService.populateUsers(resp.documents);
      setChallenges(populated);
    } catch (error) {
      Toast.show({ type: 'error', text1: 'Error', text2: 'Could not load admin challenges.' });
    } finally {
      setLoading(false);
    }
  };

  const getUserName = (userRel) => {
    if (!userRel) return "Unknown";
    return typeof userRel === 'object' ? (userRel.username || userRel.name || userRel.$id) : userRel;
  };

  const getUserId = (userRel) => {
    return typeof userRel === 'object' ? userRel.$id : userRel;
  };

  // 2. Complete Match (Payout)
  const handleCompleteMatch = async (challenge, winnerRel, loserRel) => {
    const winnerId = getUserId(winnerRel);
    const loserId = getUserId(loserRel);

    setModalConfig({
      title: "Confirm Winner",
      message: `Are you absolutely sure ${getUserName(winnerRel)} won?\n\nThey will receive the ₹${challenge.prize} prize instantly.`,
      onConfirm: async () => {
        try {
          await challengeService.completeChallengeAdmin({
            challengeId: challenge.$id,
            winnerId,
            loserId,
            prize: challenge.prize
          });
          Toast.show({ type: 'success', text1: 'Payout Successful', text2: 'Match completed, stats recorded, and prize money credited!' });
          loadChallenges();
        } catch(e) { Toast.show({ type: 'error', text1: 'Error', text2: e.message }); }
      }
    });
    setModalVisible(true);
  };

  const renderItem = ({ item }) => {
    const chalName = getUserName(item.challenger_id);
    const oppName = getUserName(item.opponent_id);

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.gameTitle}>{item.game} {item.map && `(${item.map})`}</Text>
          <Text style={styles.badge}>{item.status.toUpperCase()}</Text>
        </View>

        <Text style={styles.vsText}>{chalName}  <Text style={{color: "#FF3366"}}>VS</Text>  {oppName}</Text>
        <Text style={styles.infoText}>Prize: ₹{item.prize}  |  Entry: ₹{item.entry_fee}</Text>

        {item.status === "accepted" && <MatchProofs challengeId={item.$id} chalName={chalName} oppName={oppName} />}

        {item.status === "accepted" && (
          <View style={styles.adminActionBox}>
            <Text style={styles.boxTitle}>Admin Actions:</Text>
            
            {/* Select Winner */}
            <Text style={styles.boxTitle}>Select Winner (Payout):</Text>
            <View style={styles.winnerRow}>
              <TouchableOpacity 
                style={[styles.winnerBtn, {backgroundColor: "#00FF66"}]} 
                onPress={() => handleCompleteMatch(item, item.challenger_id, item.opponent_id)}
              >
                <Text style={styles.btnTextBlack}>{chalName} Won</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.winnerBtn, {backgroundColor: "#00FF66"}]} 
                onPress={() => handleCompleteMatch(item, item.opponent_id, item.challenger_id)}
              >
                <Text style={styles.btnTextBlack}>{oppName} Won</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>1v1 Admin Panel</Text>

      <View style={styles.tabRow}>
        {["pending", "accepted", "completed"].map(tab => (
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
          data={challenges}
          keyExtractor={i => i.$id}
          contentContainerStyle={{ paddingBottom: 30 }}
          ListEmptyComponent={<Text style={styles.emptyText}>No matches found in this status.</Text>}
          renderItem={renderItem}
        />
      )}
      <ConfirmModal
        visible={modalVisible}
        title={modalConfig.title}
        message={modalConfig.message}
        onConfirm={() => {
          setModalVisible(false);
          modalConfig.onConfirm();
        }}
        onCancel={() => setModalVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#121212", padding: 15, paddingTop: 50 },
  title: { fontSize: 28, fontWeight: "bold", color: "#FF3366", marginBottom: 20 },
  tabRow: { flexDirection: "row", marginBottom: 15, backgroundColor: "#1e1e1e", borderRadius: 8, padding: 4 },
  tabBtn: { flex: 1, paddingVertical: 12, alignItems: "center", borderRadius: 6 },
  tabActive: { backgroundColor: "#333" },
  tabText: { color: "#aaa", fontWeight: "600" },
  tabTextActive: { color: "#fff", fontWeight: "bold" },
  emptyText: { textAlign: "center", color: "#666", marginTop: 40 },
  
  card: { backgroundColor: "#1e1e1e", padding: 15, borderRadius: 12, marginBottom: 15, borderWidth: 1, borderColor: "#333" },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", marginBottom: 10 },
  gameTitle: { fontSize: 18, fontWeight: "bold", color: "#fff" },
  badge: { backgroundColor: "#FF3366", color: "#fff", paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4, fontSize: 10, fontWeight: "bold", overflow: "hidden" },
  
  vsText: { color: "#fff", fontSize: 16, fontWeight: "bold", textAlign: "center", marginVertical: 10 },
  infoText: { color: "#aaa", fontSize: 14, textAlign: "center", marginBottom: 10 },

  adminActionBox: { marginTop: 15, backgroundColor: "#2A2A2A", padding: 12, borderRadius: 8 },
  boxTitle: { color: "#FF9900", fontSize: 12, fontWeight: "bold", marginBottom: 8 },
  
  winnerRow: { flexDirection: "row", gap: 10 },
  winnerBtn: { flex: 1, paddingVertical: 12, borderRadius: 6, alignItems: "center" },
  btnText: { color: "#fff", fontWeight: "bold" },
  btnTextBlack: { color: "#000", fontWeight: "bold" }
});
