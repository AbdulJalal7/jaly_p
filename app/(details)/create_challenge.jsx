import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Platform, KeyboardAvoidingView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useState } from "react";
import { useRouter } from "expo-router";
import { useAuth } from "../../context/authContext";
import challengesApi from "../../lib/appwrite/challengesApi";
import { Ionicons } from "@expo/vector-icons";
import Alert from "react-native-toast-message";

export default function CreateChallenge() {
  const { user } = useAuth();
  const router = useRouter();
  
  const [gameName, setGameName] = useState("");
  const [mode, setMode] = useState("solo"); // solo, duo, team
  const [map, setMap] = useState("");
  const [price, setPrice] = useState("");
  const [gameIds, setGameIds] = useState([""]); // Array of game IDs based on mode
  
  const [loading, setLoading] = useState(false);

  // Auto-manage game ID inputs based on mode
  const handleModeChange = (newMode) => {
    setMode(newMode);
    let count = 1;
    if (newMode === "duo") count = 2;
    if (newMode === "team") count = 4; // Assuming 4 players per team
    
    // Resize array
    setGameIds(Array(count).fill(""));
  };

  const updateGameId = (index, value) => {
    const newIds = [...gameIds];
    newIds[index] = value;
    setGameIds(newIds);
  };

  const handleCreate = async () => {
    if (!gameName.trim() || !map.trim() || !price.trim()) {
      return Alert.show({ type: "error", text1: "Missing Fields", text2: "Please fill in all required fields." });
    }

    if (gameIds.some(id => !id.trim())) {
      return Alert.show({ type: "error", text1: "Missing Game IDs", text2: "Please provide all game IDs for your team." });
    }

    const priceNum = parseInt(price);
    if (isNaN(priceNum) || priceNum <= 0) {
      return Alert.show({ type: "error", text1: "Invalid Price", text2: "Price must be a valid number greater than 0." });
    }

    setLoading(true);
    try {
      const result = await challengesApi.createChallenge({
        creatorId: user.$id,
        gameName,
        gameIds,
        mode,
        map,
        price: priceNum,
      });

      if (result.success) {
        Alert.show({ type: "success", text1: "Challenge Created!", text2: "Fee deducted and challenge is live." });
        router.back();
      } else if (result.error === "low_balance") {
        Alert.show({
          type: "error",
          text1: "Insufficient Balance",
          text2: "Please deposit funds first. Tap to go to Wallet.",
          onPress: () => router.push("/wallet/deposit")
        });
      }
    } catch (error) {
     
       Alert.show({ type: "error", text1: "Creation Failed", text2: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        style={{ flex: 1 }} 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color="#FFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Create Challenge</Text>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView contentContainerStyle={styles.scroll}>
          
          {/* Game Name */}
          <Text style={styles.label}>Game Name</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. BGMI, Free Fire..."
            placeholderTextColor="#666"
            value={gameName}
            onChangeText={setGameName}
          />

          {/* Mode Selector */}
          <Text style={styles.label}>Game Mode</Text>
          <View style={styles.modeContainer}>
            {["solo", "duo", "team"].map((m) => (
              <TouchableOpacity
                key={m}
                style={[styles.modeBtn, mode === m && styles.modeBtnActive]}
                onPress={() => handleModeChange(m)}
              >
                <Text style={[styles.modeText, mode === m && styles.modeTextActive]}>
                  {m.toUpperCase()}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Map */}
          <Text style={styles.label}>Map</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Erangel, Bermuda..."
            placeholderTextColor="#666"
            value={map}
            onChangeText={setMap}
          />

          {/* Game IDs */}
          <Text style={styles.label}>Your In-Game ID(s)</Text>
          {gameIds.map((id, index) => (
            <TextInput
              key={index}
              style={[styles.input, { marginBottom: 8 }]}
              placeholder={`Player ${index + 1} ID`}
              placeholderTextColor="#666"
              value={id}
              onChangeText={(val) => updateGameId(index, val)}
            />
          ))}

          {/* Price */}
          <Text style={styles.label}>Challenge Entry Fee (₹)</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. 50"
            placeholderTextColor="#666"
            keyboardType="numeric"
            value={price}
            onChangeText={setPrice}
          />
          <Text style={styles.hint}>This amount will be deducted from your wallet immediately.</Text>

          {/* Submit */}
          <TouchableOpacity 
            style={[styles.submitBtn, loading && styles.submitBtnDisabled]} 
            onPress={handleCreate}
            disabled={loading}
          >
           <Text style={styles.submitBtnText}>
             {loading ? "Creating..." : `Create & Pay ₹${price || 0}`}
           </Text>
          </TouchableOpacity>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#121212" },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 16, borderBottomWidth: 1, borderBottomColor: "#333" },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 20, fontWeight: "bold", color: "#FFF" },
  scroll: { padding: 20 },
  label: { fontSize: 16, fontWeight: "600", color: "#FFF", marginBottom: 8, marginTop: 16 },
  input: { backgroundColor: "#1E1E1E", borderRadius: 8, color: "#FFF", paddingHorizontal: 16, paddingVertical: 14, fontSize: 16, borderWidth: 1, borderColor: "#333" },
  modeContainer: { flexDirection: "row", gap: 10 },
  modeBtn: { flex: 1, paddingVertical: 12, borderRadius: 8, backgroundColor: "#1E1E1E", alignItems: "center", borderWidth: 1, borderColor: "#333" },
  modeBtnActive: { backgroundColor: "#FF3366", borderColor: "#FF3366" },
  modeText: { color: "#AAA", fontWeight: "bold" },
  modeTextActive: { color: "#FFF" },
  hint: { fontSize: 12, color: "#888", marginTop: 4, fontStyle: "italic" },
  submitBtn: { backgroundColor: "#00FF66", paddingVertical: 16, borderRadius: 12, alignItems: "center", marginTop: 40 },
  submitBtnDisabled: { opacity: 0.5 },
  submitBtnText: { color: "#000", fontSize: 18, fontWeight: "bold" },
});
