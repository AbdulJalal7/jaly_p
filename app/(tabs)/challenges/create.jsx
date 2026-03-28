import { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useAuth } from "../../../context/authContext";
import challengeService from "../../../lib/appwrite/challenges";

export default function CreateChallengeScreen() {
  const { opponentId, opponentName } = useLocalSearchParams();
  const { user } = useAuth();
  const router = useRouter();

  const [game, setGame] = useState("BGMI");
  const [map, setMap] = useState("Erangel");
  const [fee, setFee] = useState("100");
  const [loading, setLoading] = useState(false);

  // Safeguard numbers
  const parsedFee = parseInt(fee, 10) || 0;
  const prizePool = Math.floor((parsedFee * 2) * 0.80);

  const handleSend = async () => {
    if (parsedFee < 100) {
      return Alert.alert("Error", "Minimum entry fee is 100.");
    }
    if (user.wallet_balance < parsedFee) {
      return Alert.alert(
        "Insufficient Balance", 
        "You do not have enough funds to send this challenge. Please deposit in your Wallet.",
        [
          { text: "Cancel", style: "cancel" },
          { text: "Deposit", onPress: () => router.push("/wallet/deposit") }
        ]
      );
    }
    if (!game.trim()) {
      return Alert.alert("Error", "Please specify a game.");
    }

    setLoading(true);
    try {
      await challengeService.sendChallenge({
        challengerId: user.$id,
        opponentId: opponentId,
        game: game.trim(),
        map: map.trim(),
        entryFee: parsedFee,
        currentBalance: user.wallet_balance
      });

      Alert.alert("Success", "Challenge sent securely!", [
        { text: "View My Challenges", onPress: () => router.replace("/challenges/my_challenges") }
      ]);
    } catch (error) {
      Alert.alert("Failed", error.message || "Could not send challenge.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Challenge {opponentName}</Text>
      
      <View style={styles.card}>
        <Text style={styles.label}>Game Name:</Text>
        <TextInput 
          style={styles.input}
          value={game}
          onChangeText={setGame}
          placeholder="e.g. BGMI, FreeFire"
          placeholderTextColor="#666"
        />

        <Text style={styles.label}>Map (Optional):</Text>
        <TextInput 
          style={styles.input}
          value={map}
          onChangeText={setMap}
          placeholder="e.g. Erangel, Classic"
          placeholderTextColor="#666"
        />

        <Text style={styles.label}>Entry Fee (Minimum ₹100):</Text>
        <TextInput 
          style={styles.input}
          value={fee}
          onChangeText={setFee}
          keyboardType="numeric"
          placeholder="Enter Amount"
          placeholderTextColor="#666"
        />

        <View style={styles.prizeBox}>
          <Text style={styles.prizeText}>Estimated Prize: ₹{prizePool > 0 ? prizePool : 0}</Text>
          <Text style={styles.feesNote}>(20% platform fee applied)</Text>
        </View>

        <Text style={styles.walletText}>Your Wallet Balance: ₹{user?.wallet_balance || 0}</Text>
      </View>

      <TouchableOpacity 
        style={[styles.sendBtn, loading && { opacity: 0.7 }]} 
        onPress={handleSend}
        disabled={loading}
      >
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Send Challenge</Text>}
      </TouchableOpacity>
      
      <TouchableOpacity style={styles.cancelBtn} onPress={() => router.back()}>
        <Text style={styles.cancelText}>Cancel</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#121212", padding: 20 },
  title: { fontSize: 24, fontWeight: "bold", color: "#fff", marginBottom: 20, marginTop: 40, textAlign: "center" },
  card: { backgroundColor: "#1e1e1e", padding: 20, borderRadius: 12, borderWidth: 1, borderColor: "#333" },
  label: { color: "#aaa", fontSize: 14, marginBottom: 5, marginTop: 15 },
  input: { backgroundColor: "#2A2A2A", color: "#fff", padding: 12, borderRadius: 8, fontSize: 16 },
  prizeBox: { backgroundColor: "#333", padding: 15, borderRadius: 8, marginTop: 20 },
  prizeText: { color: "#00FF66", fontSize: 18, fontWeight: "bold", textAlign: "center" },
  feesNote: { color: "#aaa", fontSize: 12, textAlign: "center", marginTop: 4 },
  walletText: { color: "#FF3366", fontSize: 14, fontWeight: "600", textAlign: "center", marginTop: 20 },
  sendBtn: { backgroundColor: "#FF3366", padding: 15, borderRadius: 8, alignItems: "center", marginTop: 30 },
  btnText: { color: "#fff", fontSize: 16, fontWeight: "bold" },
  cancelBtn: { padding: 15, alignItems: "center", marginTop: 10 },
  cancelText: { color: "#aaa", fontSize: 16 }
});
