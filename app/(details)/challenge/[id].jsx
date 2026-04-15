import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, TextInput, Modal, Alert as RNAlert, Image, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useState, useCallback } from "react";
import { useLocalSearchParams, useRouter, useFocusEffect } from "expo-router";
import { useAuth } from "../../../context/authContext";
import challengesApi from "../../../lib/appwrite/challengesApi";
import { Ionicons } from "@expo/vector-icons";
import Alert from "react-native-toast-message";

import * as ImagePicker from "expo-image-picker";

export default function ChallengeDetail() {
  const { id } = useLocalSearchParams();
  const { user } = useAuth();
  const router = useRouter();

  const [challenge, setChallenge] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [matchResults, setMatchResults] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Modals / Inputs
  const [roomModalVisible, setRoomModalVisible] = useState(false);
  const [roomIdInput, setRoomIdInput] = useState("");
  const [roomPassInput, setRoomPassInput] = useState("");
  const [submittingRoom, setSubmittingRoom] = useState(false);

  const [uploadModalVisible, setUploadModalVisible] = useState(false);
  const [pickedImage, setPickedImage] = useState(null);
  const [submittingResult, setSubmittingResult] = useState(false);

  const fetchDetails = async () => {
    try {
      const chal = await challengesApi.getChallenge(id);
      setChallenge(chal);
      const parts = await challengesApi.getParticipants(id);
      setParticipants(parts.documents);
      
      const results = await challengesApi.getMatchResults(id);
      // console.log("Match Resultssssssssssssss : ", results);
      setMatchResults(results.documents);
    } catch (error) {
      console.error(error);
      Alert.show({ type: "error", text1: "Error loading details" });
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchDetails();
    }, [id])
  );

  const isCreator = challenge?.creator_id === user?.$id;
  const isParticipant = participants.some(p => p.user_id === user?.$id);
  const myParticipantRecord = participants.find(p => p.user_id === user?.$id);
  const isSelected = isCreator || myParticipantRecord?.status === "selected";

  // Single Record Logic
  const mainResultDoc = matchResults && matchResults.length > 0 ? matchResults[0] : null;
  const challengerResultUrl = mainResultDoc?.challenger_screenshot;
  const opponentResultUrl = mainResultDoc?.opponent_screenshot;
  
  const hasUploaded = isCreator ? !!challengerResultUrl : !!opponentResultUrl;

  const handleSelectOpponent = async (participant) => {
    RNAlert.alert(
      "Confirm Opponent",
      `Are you sure you want to select this player as your opponent?`,
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Select", 
          onPress: async () => {
            try {
              setLoading(true);
              await challengesApi.selectOpponent(challenge.$id, participant.$id, participant.user_id);
              Alert.show({ type: "success", text1: "Opponent Selected!" });
              fetchDetails();
            } catch (error) {
              Alert.show({ type: "error", text1: "Selection Failed", text2: error.message });
            } finally {
              setLoading(false);
            }
          } 
        }
      ]
    );
  };

  const handleSaveRoom = async () => {
    if (!roomIdInput || !roomPassInput) return Alert.show({ type: "error", text1: "Enter both fields" });
    
    setSubmittingRoom(true);
    try {
      await challengesApi.updateRoomDetails(challenge.$id, roomIdInput.trim(), roomPassInput.trim());
      Alert.show({ type: "success", text1: "Room Details Saved" });
      setRoomModalVisible(false);
      fetchDetails();
    } catch (error) {
      Alert.show({ type: "error", text1: "Failed to save room details" });
    } finally {
      setSubmittingRoom(false);
    }
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
    if (!pickedImage) return Alert.show({ type: "error", text1: "Select an image first" });
    
    setSubmittingResult(true);
    try {
      // Prepare file for Appwrite (Ensure URI is correct for React Native)
      let uri = pickedImage.uri;
      if (Platform.OS !== "web" && !uri.startsWith("file://") && !uri.startsWith("content://")) {
        uri = `file://${uri}`;
      }

      const fileObj = {
        name: pickedImage.fileName || `result_${Date.now()}.jpg`,
        type: pickedImage.mimeType || "image/jpeg",
        uri: uri,
        size: pickedImage.fileSize || 0
      };

      // Upload to Storage
      const { fileUrl } = await challengesApi.uploadResultFile(fileObj);

      // Save to Results Collection
      await challengesApi.uploadMatchResult(challenge.$id, user.$id, fileUrl);
      
      Alert.show({ type: "success", text1: "Result Uploaded Successfully" });
      setUploadModalVisible(false);
      setPickedImage(null);
      fetchDetails(); // Refresh to show we've uploaded
    } catch (error) {
      console.error(error);
      Alert.show({ type: "error", text1: "Upload Failed", text2: error.message });
    } finally {
      setSubmittingResult(false);
    }
  };

  if (loading && !challenge) {
    return (
      <SafeAreaView style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#FF1A1A" />
      </SafeAreaView>
    );
  }

  if (!challenge) {
    return (
      <SafeAreaView style={styles.centerContainer}>
        <Text style={{ color: '#fff' }}>Challenge not found.</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Challenge Info</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        
        {/* Core Info */}
        <View style={styles.card}>
          <Text style={styles.gameTitle}>{challenge.game_name}</Text>
          <Text style={styles.metadata}>Mode: {challenge.mode.toUpperCase()} | Map: {challenge.map}</Text>
          <Text style={styles.price}>Prize Pool: ₹{challenge.prize_pool || (challenge.challenge_price * 1.8)}</Text>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{challenge.status.toUpperCase()}</Text>
          </View>
        </View>

        {/* Room Details (Only visible to selected players & creator once set) */}
        {challenge.status === "ongoing" && isSelected && (
          <View style={styles.roomCard}>
            <Text style={styles.sectionTitle}>Room Details</Text>
            {challenge.room_id ? (
              <View>
                <Text style={styles.roomText}>ID: <Text style={{ color: '#fff'}}>{challenge.room_id}</Text></Text>
                <Text style={styles.roomText}>Pass: <Text style={{ color: '#fff'}}>{challenge.room_password}</Text></Text>
              </View>
            ) : (
              <Text style={styles.infoText}>Waiting for Creator to share Room ID...</Text>
            )}
            
            {isCreator && (
              <TouchableOpacity style={styles.actionBtn} onPress={() => setRoomModalVisible(true)}>
                <Text style={styles.actionBtnText}>{challenge.room_id ? "Edit Room Details" : "Set Room Details"}</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Verification Status (Only when ongoing or completed) */}
        {(challenge.status === "ongoing" || challenge.status === "completed") && isSelected && (
          <View style={styles.verificationCard}>
            <Text style={styles.sectionTitle}>Verification Status</Text>
            
            <View style={styles.verificationRow}>
               <View style={styles.verifyItem}>
                  <Ionicons 
                    name={challengerResultUrl ? "checkmark-circle" : "ellipse-outline"} 
                    size={22} 
                    color={challengerResultUrl ? "#00FF66" : "#444"} 
                  />
                  <Text style={[styles.verifyText, { color: challengerResultUrl ? "#00FF66" : "#888" }]}>Challenger Proof</Text>
               </View>
               <View style={styles.verifyItem}>
                  <Ionicons 
                    name={opponentResultUrl ? "checkmark-circle" : "ellipse-outline"} 
                    size={22} 
                    color={opponentResultUrl ? "#00FF66" : "#444"} 
                  />
                  <Text style={[styles.verifyText, { color: opponentResultUrl ? "#00FF66" : "#888" }]}>Opponent Proof</Text>
               </View>
            </View>
            
            {challenge.status === "ongoing" && challengerResultUrl && opponentResultUrl && (
               <View style={styles.pendingReview}>
                  <Ionicons name="time-outline" size={18} color="#FFD700" />
                  <Text style={styles.pendingReviewText}>Waiting for Admin Announcement...</Text>
               </View>
            )}

            {challenge.status === "completed" && (
                <View style={[styles.pendingReview, { backgroundColor: '#FFD70015', borderColor: '#FFD70030' }]}>
                   <Ionicons name="trophy" size={20} color="#FFD700" />
                   <Text style={[styles.pendingReviewText, { color: '#FFD700' }]}>
                      Winner: {challenge.winner_id === (challenge.creator_id?.$id || challenge.creator_id) ? "Challenger" : "Opponent"}
                   </Text>
                   {challenge.winner_id === user.$id && (
                     <Text style={{ color: '#00FF66', fontSize: 12, fontWeight: 'bold', marginLeft: 10 }}>🎉 YOU WON!</Text>
                   )}
                </View>
             )}

            {/* Screenshots Display */}
            <View style={styles.resultsGrid}>
              {challengerResultUrl ? (
                <View style={styles.resultDisplay}>
                  <Text style={styles.resultLabel}>Challenger Proof</Text>
                  <Image 
                    key="challenger-proof"
                    source={{ uri: challengerResultUrl }} 
                    style={styles.resultImage}
                    resizeMode="contain"
                  />
                </View>
              ) : null}
              {opponentResultUrl ? (
                <View style={styles.resultDisplay}>
                  <Text style={styles.resultLabel}>Opponent Proof</Text>
                  <Image 
                    key="opponent-proof"
                    source={{ uri: opponentResultUrl }} 
                    style={styles.resultImage}
                    resizeMode="contain"
                  />
                </View>
              ) : null}
            </View>
          </View>
        )}

        {/* Participants / Opponents List */}
        <Text style={[styles.sectionTitle, { marginTop: 20 }]}>Participants</Text>
        {participants.length === 0 ? (
          <Text style={styles.infoText}>No one has joined yet.</Text>
        ) : (
          participants.map((p, index) => (
            <View key={p.$id} style={styles.participantItem}>
              <View>
                <Text style={styles.pName}>{p.user_name} {p.user_id === user.$id && "(You)"}</Text>
                <Text style={styles.pStatus}>Status: {p.status}</Text>
              </View>
              
              {isCreator && challenge.status === "open" && (
                <TouchableOpacity 
                  style={styles.selectBtn}
                  onPress={() => handleSelectOpponent(p)}
                >
                  <Text style={styles.selectBtnText}>Select</Text>
                </TouchableOpacity>
              )}
            </View>
          ))
        )}

        {/* Match Result Upload (For selected players & creator when ongoing) */}
        {challenge.status === "ongoing" && isSelected && (
          <TouchableOpacity 
             style={[styles.actionBtn, { marginTop: 30, backgroundColor: hasUploaded ? "#333" : "#00FF66" }]} 
             onPress={() => !hasUploaded && setUploadModalVisible(true)}
             disabled={hasUploaded}
          >
             <Text style={[styles.actionBtnText, { color: hasUploaded ? "#888" : "#000" }]}>
                {hasUploaded ? "Wait for Result" : "Upload Match Result"}
             </Text>
          </TouchableOpacity>
        )}

      </ScrollView>

      {/* Room Modal */}
      <Modal visible={roomModalVisible} transparent animationType="slide">
        <View style={styles.modalBg}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Set Room Details</Text>
            <TextInput style={styles.input} placeholder="Room ID" placeholderTextColor="#888" value={roomIdInput} onChangeText={setRoomIdInput} />
            <TextInput style={styles.input} placeholder="Password" placeholderTextColor="#888" value={roomPassInput} onChangeText={setRoomPassInput} />
            <View style={styles.modalActions}>
              <TouchableOpacity style={[styles.modalBtn, { backgroundColor: "#333" }]} onPress={() => setRoomModalVisible(false)}><Text style={styles.modalBtnText}>Cancel</Text></TouchableOpacity>
              <TouchableOpacity style={[styles.modalBtn, { backgroundColor: "#FF3366"}]} onPress={handleSaveRoom} disabled={submittingRoom}>
                <Text style={styles.modalBtnText}>{submittingRoom ? "..." : "Save"}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

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

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#121212" },
  centerContainer: { flex: 1, backgroundColor: "#121212", justifyContent: "center", alignItems: "center" },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 16, borderBottomWidth: 1, borderBottomColor: "#333" },
  headerTitle: { fontSize: 20, fontWeight: "bold", color: "#FFF" },
  content: { padding: 16, paddingBottom: 60 },
  card: { backgroundColor: "#1E1E1E", padding: 20, borderRadius: 12, borderWidth: 1, borderColor: "#333", marginBottom: 20 },
  gameTitle: { fontSize: 24, fontWeight: "bold", color: "#FFF", marginBottom: 6 },
  metadata: { color: "#AAA", fontSize: 14, marginBottom: 12 },
  price: { color: "#4caf50", fontSize: 18, fontWeight: "bold", marginBottom: 16 },
  badge: { backgroundColor: "#333", alignSelf: "flex-start", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  badgeText: { color: "#FFF", fontWeight: "bold" },
  roomCard: { backgroundColor: "#FF336620", padding: 16, borderRadius: 12, borderWidth: 1, borderColor: "#FF3366", marginBottom: 20 },
  sectionTitle: { fontSize: 18, fontWeight: "bold", color: "#FFF", marginBottom: 12 },
  roomText: { color: "#AAA", fontSize: 16, marginBottom: 4 },
  infoText: { color: "#AAA", fontStyle: "italic" },
  participantItem: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", backgroundColor: "#1E1E1E", padding: 16, borderRadius: 8, marginBottom: 8, borderWidth: 1, borderColor: "#333" },
  pName: { color: "#FFF", fontSize: 16, fontWeight: "bold" },
  pStatus: { color: "#888", fontSize: 14, marginTop: 4 },
  selectBtn: { backgroundColor: "#FF3366", paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8 },
  selectBtnText: { color: "#FFF", fontWeight: "bold" },
  actionBtn: { backgroundColor: "#333", padding: 14, borderRadius: 8, alignItems: "center", marginTop: 12 },
  actionBtnText: { color: "#FFF", fontWeight: "bold", fontSize: 16 },
  
  modalBg: { flex: 1, backgroundColor: "rgba(0,0,0,0.7)", justifyContent: "center", padding: 20 },
  modalContent: { backgroundColor: "#1E1E1E", padding: 24, borderRadius: 16, borderWidth: 1, borderColor: "#333" },
  modalTitle: { fontSize: 20, fontWeight: "bold", color: "#FFF", marginBottom: 16 },
  hintText: { color: "#AAA", marginBottom: 12 },
  input: { backgroundColor: "#121212", color: "#FFF", padding: 14, borderRadius: 8, borderWidth: 1, borderColor: "#333", marginBottom: 16 },
  modalActions: { flexDirection: "row", justifyContent: "flex-end", gap: 12, marginTop: 8 },
  modalBtn: { paddingHorizontal: 20, paddingVertical: 12, borderRadius: 8 },
  modalBtnText: { color: "#FFF", fontWeight: "bold" },
  
  imagePickerBtn: { backgroundColor: "#121212", borderStyle: 'dotted', borderWidth: 1, borderColor: '#444', borderRadius: 8, padding: 20, alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 16 },
  imagePickerBtnText: { color: '#AAA', fontSize: 14, fontWeight: '600' },
  previewContainer: { position: 'relative', marginBottom: 16, borderRadius: 8, overflow: 'hidden', borderWidth: 1, borderColor: '#333' },
  imagePreview: { width: '100%', height: 200, resizeMode: 'cover' },
  removeImage: { position: 'absolute', top: 8, right: 8, backgroundColor: '#00000080', borderRadius: 12 },

  verificationCard: { backgroundColor: "#121212", borderRadius: 12, padding: 16, marginTop: 20, borderWidth: 1, borderColor: '#222' },
  verificationRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 12 },
  verifyItem: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  verifyText: { fontSize: 13, fontWeight: '500' },
  pendingReview: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 16, backgroundColor: '#FFD70015', padding: 10, borderRadius: 8 },
  pendingReviewText: { color: '#FFD700', fontSize: 12, fontWeight: '600' },
  
  resultsGrid: { marginTop: 16, gap: 16 },
  resultDisplay: { gap: 8 },
  resultLabel: { color: '#888', fontSize: 12, fontWeight: '600' },
  resultImage: { width: '100%', height: 200, borderRadius: 8, backgroundColor: '#121212' },
});
