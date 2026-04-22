import { useEffect, useState } from "react";
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, TextInput, Modal, Image, Platform } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import Toast from 'react-native-toast-message';
import ConfirmModal from '../../../components/ConfirmModal';
import { useAuth } from "../../../context/authContext";
import challengeService from "../../../lib/appwrite/challenges";
import TextRecognition from '@react-native-ml-kit/text-recognition';

const MatchProofs = ({ challengeId, refreshKey, chalName, oppName }) => {
  const [proofs, setProofs] = useState(null);

  useEffect(() => {
    challengeService.getMatchResults(challengeId).then((res) => {
      if (res.documents && res.documents.length > 0) {
        setProofs(res.documents[0]);
      }
    }).catch(console.error);
  }, [challengeId, refreshKey]);

  if (!proofs || (!proofs.challenger_screenshot && !proofs.opponent_screenshot)) return null;

  return (
    <View style={{flexDirection: "row", gap: 10, marginTop: 10}}>
      {proofs.challenger_screenshot && <View style={{flex: 1}}>
        <Text style={{color: '#fff', fontSize: 10, marginBottom: 4, textAlign: 'center'}}>{chalName} Proof</Text>
        <Image source={{uri: proofs.challenger_screenshot}} style={{width: '100%', height: 100, borderRadius: 6, backgroundColor: '#333'}} resizeMode="cover" />
      </View>}
      
      {proofs.opponent_screenshot && <View style={{flex: 1}}>
        <Text style={{color: '#fff', fontSize: 10, marginBottom: 4, textAlign: 'center'}}>{oppName} Proof</Text>
        <Image source={{uri: proofs.opponent_screenshot}} style={{width: '100%', height: 100, borderRadius: 6, backgroundColor: '#333'}} resizeMode="cover" />
      </View>}
    </View>
  );
};

export default function MyChallengesScreen() {
  const { user } = useAuth();
  const [challenges, setChallenges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("pending");
  const [modalVisible, setModalVisible] = useState(false);
  const [modalConfig, setModalConfig] = useState({
    title: "",
    message: "",
    onConfirm: () => {},
  });
  const [roomInputs, setRoomInputs] = useState({});
  const [uploadModalVisible, setUploadModalVisible] = useState(false);
  const [pickedImage, setPickedImage] = useState(null);
  const [submittingResult, setSubmittingResult] = useState(false);
  const [selectedChallengeForUpload, setSelectedChallengeForUpload] = useState(null);
  const [refreshProofsKey, setRefreshProofsKey] = useState(0);

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
      // console.log("Error loading challenges:", error);
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
    setModalConfig({
      title: "Cancel Challenge",
      message: "You will be refunded immediately.",
      onConfirm: async () => {
        try {
          await challengeService.cancelOrRejectChallenge({
            challengeId: c.$id,
            refundUserId: user.$id,
            entryFee: c.entry_fee,
            newStatus: "cancelled"
          });
          Toast.show({ type: 'success', text1: 'Success', text2: 'Challenge cancelled and currency refunded.' });
          loadChallenges();
        } catch(e) { Toast.show({ type: 'error', text1: 'Error', text2: e.message }); }
      }
    });
    setModalVisible(true);
  };

  const handleAccept = async (c) => {
    if (user.wallet_balance < c.entry_fee) {
      return Toast.show({ type: 'error', text1: 'Insufficient Funds', text2: 'Wallet balance must be greater than ' + c.entry_fee });
    }
    
    setModalConfig({
      title: "Accept Challenge",
      message: `₹${c.entry_fee} will be deducted from your wallet to join.`,
      onConfirm: async () => {
        try {
          await challengeService.acceptChallenge({
            challengeId: c.$id,
            opponentId: user.$id,
            entryFee: c.entry_fee,
            currentBalance: user.wallet_balance
          });
          Toast.show({ type: 'success', text1: 'Success', text2: 'Challenge accepted!' });
          loadChallenges();
        } catch(e) { Toast.show({ type: 'error', text1: 'Error', text2: e.message }); }
      }
    });
    setModalVisible(true);
  };

  const handleReject = async (c) => {
    setModalConfig({
      title: "Reject Challenge",
      message: "Are you sure?",
      onConfirm: async () => {
        try {
          const challengerStr = typeof c.challenger_id === 'object' ? c.challenger_id.$id : c.challenger_id;
          await challengeService.cancelOrRejectChallenge({
            challengeId: c.$id,
            refundUserId: challengerStr,
            entryFee: c.entry_fee,
            newStatus: "rejected"
          });
          Toast.show({ type: 'success', text1: 'Success', text2: 'Challenge rejected. Funds refunded to challenger.' });
          loadChallenges();
        } catch(e) { Toast.show({ type: 'error', text1: 'Error', text2: e.message }); }
      }
    });
    setModalVisible(true);
  };

  const handleSubmitRoomDetails = async (c) => {
    const inputs = roomInputs[c.$id] || {};
    if (!inputs.roomId || !inputs.roomPass) {
      return Toast.show({ type: 'error', text1: 'Validation Error', text2: 'Both Room ID and Password are required.' });
    }

    setModalConfig({
      title: "Provide Room Details",
      message: "Are these details correct? The opponent will see this.",
      onConfirm: async () => {
        try {
          await challengeService.setRoomDetails(c.$id, inputs.roomId, inputs.roomPass);
          Toast.show({ type: 'success', text1: 'Success', text2: 'Room details sent to opponent!' });
          loadChallenges();
        } catch(e) { Toast.show({ type: 'error', text1: 'Error', text2: e.message }); }
      }
    });
    setModalVisible(true);
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 1,
    });

    if (!result.canceled) {
      setPickedImage(result.assets[0]);
    }
  };

  const handleSubmitResult = async () => {
    if (!pickedImage || !selectedChallengeForUpload) return Toast.show({ type: "error", text1: "Select an image first" });
    
    setSubmittingResult(true);
    try {
      let uri = pickedImage.uri;
      if (Platform.OS !== "web" && !uri.startsWith("file://") && !uri.startsWith("content://")) {
        uri = `file://${uri}`;
      }

      // --- ML Kit Text Recognition ---
      let outcome = "unknown";
      try {
        const result = await TextRecognition.recognize(uri);
        const text = result.text.toUpperCase();
        if (text.includes("VICTORY") || text.includes("WINNER") || text.includes("1ST")) {
          outcome = "victory";
        } else if (text.includes("DEFEAT") || text.includes("LOSE") || text.includes("LOSER")) {
          outcome = "defeat";
        }
      } catch (ocrError) {
        console.error("OCR Error:", ocrError);
      }

      const fileObj = {
        name: pickedImage.fileName || `result_${Date.now()}.jpg`,
        type: pickedImage.mimeType || "image/jpeg",
        uri: uri,
        size: pickedImage.fileSize || 0
      };

      const { fileUrl } = await challengeService.uploadResultFile(fileObj);
      const updatedResultDoc = await challengeService.uploadMatchResult(selectedChallengeForUpload.$id, user.$id, fileUrl, outcome);
      
      Toast.show({ type: "success", text1: "Result Uploaded Successfully" });

      // --- Auto Announce Winner Logic ---
      if (updatedResultDoc.challenger_outcome && updatedResultDoc.opponent_outcome) {
        const chalOutcome = updatedResultDoc.challenger_outcome;
        const oppOutcome = updatedResultDoc.opponent_outcome;
        
        // Ensure one is victory and one is defeat
        if ((chalOutcome === "victory" && oppOutcome === "defeat") || (chalOutcome === "defeat" && oppOutcome === "victory")) {
          // Both uploaded and have contrasting outcomes, settle the match!
          const challenge = selectedChallengeForUpload;
          const winnerId = chalOutcome === "victory" 
            ? (typeof challenge.challenger_id === 'object' ? challenge.challenger_id.$id : challenge.challenger_id)
            : (typeof challenge.opponent_id === 'object' ? challenge.opponent_id.$id : challenge.opponent_id);
            
          const loserId = chalOutcome === "victory"
            ? (typeof challenge.opponent_id === 'object' ? challenge.opponent_id.$id : challenge.opponent_id)
            : (typeof challenge.challenger_id === 'object' ? challenge.challenger_id.$id : challenge.challenger_id);
            
          await challengeService.completeChallengeAdmin({
            challengeId: challenge.$id,
            winnerId,
            loserId,
            prize: challenge.prize
          });
          
          Toast.show({ type: "success", text1: "Match Auto-Completed!", text2: "Results verified and prize distributed." });
          loadChallenges();
        }
      }
      
      setUploadModalVisible(false);
      setPickedImage(null);
      setSelectedChallengeForUpload(null);
      setRefreshProofsKey(p => p + 1);
    } catch (error) {
      console.error(error);
      Toast.show({ type: "error", text1: "Upload Failed", text2: error.message });
    } finally {
      setSubmittingResult(false);
    }
  };

  const renderItem = ({ item }) => {
    const amChallenger = isChallenger(item);
    // console.log("Challenger ID : ", item.challenger_id );
    // console.log("Challenger Name : ", item.challenger_id.username );
    // console.log("Opponent ID : ", item.opponent_id );
    // console.log("Opponent Name : ", item.opponent_id.username );  
    
    // Attempt extracting reliable names safely
    const chalNameRaw = typeof item.challenger_id === 'object' ? (item.challenger_id?.username || item.challenger_id?.name || 'Challenger') : 'Challenger';
    const oppNameRaw = typeof item.opponent_id === 'object' ? (item.opponent_id?.username || item.opponent_id?.name || 'Opponent') : 'Opponent';

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
              <View>
                <Text style={styles.roomValue}>ID: {item.room_id} | Pass: {item.room_pass}</Text>
                
                <MatchProofs challengeId={item.$id} refreshKey={refreshProofsKey} chalName={chalNameRaw} oppName={oppNameRaw} />

                <TouchableOpacity 
                  style={[styles.actionBtn, {marginTop: 10, backgroundColor: "#00FF66"}]} 
                  onPress={() => {
                    setSelectedChallengeForUpload(item);
                    setPickedImage(null);
                    setUploadModalVisible(true);
                  }}
                >
                  <Text style={[styles.btnText, {color: "#000"}]}>Upload Match Proof</Text>
                </TouchableOpacity>
              </View>
            ) : amChallenger ? (
              <View>
                <Text style={styles.roomWait}>Please provide the room details for the opponent.</Text>
                <View style={styles.roomInputRow}>
                  <TextInput 
                    style={styles.roomInput} 
                    placeholder="Room/Match ID" 
                    placeholderTextColor="#666"
                    onChangeText={(val) => setRoomInputs(p => ({...p, [item.$id]: {...p[item.$id], roomId: val}}))}
                  />
                  <TextInput 
                    style={styles.roomInput} 
                    placeholder="Password" 
                    placeholderTextColor="#666"
                    onChangeText={(val) => setRoomInputs(p => ({...p, [item.$id]: {...p[item.$id], roomPass: val}}))}
                  />
                </View>
                <TouchableOpacity style={styles.submitRoomBtn} onPress={() => handleSubmitRoomDetails(item)}>
                  <Text style={styles.btnText}>Send to Opponent</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <Text style={styles.roomWait}>Waiting for {chalNameRaw} to provide Room ID...</Text>
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

      {/* Upload Modal */}
      <Modal visible={uploadModalVisible} transparent animationType="fade">
        <View style={styles.modalBg}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Upload Result</Text>
            <Text style={styles.hintText}>Select a screenshot of your match result:</Text>
            
            <TouchableOpacity style={styles.imagePickerBtn} onPress={pickImage}>
              <Ionicons name="image-outline" size={24} color="#FFF" />
              <Text style={styles.imagePickerBtnText}>
                {pickedImage ? "Change Image" : "Select Image"}
              </Text>
            </TouchableOpacity>

            {pickedImage && (
              <View style={styles.previewContainer}>
                <Image source={{ uri: pickedImage.uri }} style={styles.imagePreview} />
                <TouchableOpacity style={styles.removeImage} onPress={() => setPickedImage(null)}>
                  <Ionicons name="close-circle" size={24} color="#FF3366" />
                </TouchableOpacity>
              </View>
            )}

            <View style={styles.modalActions}>
              <TouchableOpacity style={[styles.modalBtn, { backgroundColor: "#333" }]} onPress={() => setUploadModalVisible(false)}><Text style={styles.modalBtnText}>Cancel</Text></TouchableOpacity>
              <TouchableOpacity style={[styles.modalBtn, { backgroundColor: "#00FF66" }]} onPress={handleSubmitResult} disabled={submittingResult || !pickedImage}>
                <Text style={[styles.modalBtnText, { color: '#000' }]}>{submittingResult ? "..." : "Submit"}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

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
  roomWait: { color: "#FF9900", fontStyle: "italic", fontSize: 14, marginBottom: 8 },
  roomSubtitle: { color: "#666", fontSize: 11, marginTop: 8 },
  roomInputRow: { flexDirection: "row", gap: 10, marginBottom: 10 },
  roomInput: { flex: 1, backgroundColor: "#1e1e1e", color: "#fff", padding: 10, borderRadius: 6, fontSize: 14, borderWidth: 1, borderColor: "#444" },
  submitRoomBtn: { backgroundColor: "#FF3366", padding: 12, borderRadius: 6, alignItems: "center" },

  modalBg: { flex: 1, backgroundColor: "rgba(0,0,0,0.7)", justifyContent: "center", padding: 20 },
  modalContent: { backgroundColor: "#1E1E1E", padding: 24, borderRadius: 16, borderWidth: 1, borderColor: "#333" },
  modalTitle: { fontSize: 20, fontWeight: "bold", color: "#FFF", marginBottom: 16 },
  hintText: { color: "#AAA", marginBottom: 12 },
  modalActions: { flexDirection: "row", justifyContent: "flex-end", gap: 12, marginTop: 8 },
  modalBtn: { paddingHorizontal: 20, paddingVertical: 12, borderRadius: 8 },
  modalBtnText: { color: "#FFF", fontWeight: "bold" },
  imagePickerBtn: { backgroundColor: "#121212", borderStyle: 'dotted', borderWidth: 1, borderColor: '#444', borderRadius: 8, padding: 20, alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 16 },
  imagePickerBtnText: { color: '#AAA', fontSize: 14, fontWeight: '600' },
  previewContainer: { position: 'relative', marginBottom: 16, borderRadius: 8, overflow: 'hidden', borderWidth: 1, borderColor: '#333' },
  imagePreview: { width: '100%', height: 200, resizeMode: 'cover' },
  removeImage: { position: 'absolute', top: 8, right: 8, backgroundColor: '#00000080', borderRadius: 12 }
});
