import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  ScrollView,
  Image,
} from "react-native";
import { useState } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import { SafeAreaView } from "react-native-safe-area-context";
import participantService from "../../../lib/appwrite/participants";

export default function JoinTournament() {
  const { id } = useLocalSearchParams(); // tournament id
  const router = useRouter();

  const [gameId, setGameId] = useState("");
  const [transactionId, setTransactionId] = useState("");
  const [receipt, setReceipt] = useState(null);
  const [loading, setLoading] = useState(false);

  const pickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("Permission Required", "Allow gallery access");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
    });

    if (!result.canceled) {
      setReceipt(result.assets[0]);
    }
  };

  const handleSubmit = async () => {
    if (!gameId || !transactionId || !receipt) {
      Alert.alert("Error", "All fields are required");
      return;
    }

    try {
      setLoading(true);

      await participantService.joinTournament({
        tournamentId: id,
        gameId,
        transactionId,
        receiptFile: receipt,
      });

      Alert.alert(
        "Submitted",
        "Your payment is under verification.",
        [
          {
            text: "OK",
            onPress: () => router.back(),
          },
        ]
      );
    } catch (error) {
      console.log(error);
      Alert.alert("Error", "Failed to submit participation");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <ScrollView style={styles.container}>
        <Text style={styles.title}>Join Tournament</Text>

        {/* Payment Instructions */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Payment Instructions</Text>
          <Text style={styles.text}>Send entry fee to:</Text>
          <Text style={styles.highlight}>UPI: example@upi</Text>
          <Text style={styles.text}>
            Upload screenshot and enter correct transaction ID.
          </Text>
        </View>

        {/* Game ID */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Game ID</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter your in-game ID"
            placeholderTextColor="#777"
            value={gameId}
            onChangeText={setGameId}
          />
        </View>

        {/* Transaction ID */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Transaction ID</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter payment transaction ID"
            placeholderTextColor="#777"
            value={transactionId}
            onChangeText={setTransactionId}
          />
        </View>

        {/* Upload Receipt */}
        <TouchableOpacity style={styles.uploadBox} onPress={pickImage}>
          {receipt ? (
            <Image
              source={{ uri: receipt.uri }}
              style={{ width: "100%", height: 150, borderRadius: 10 }}
            />
          ) : (
            <Text style={styles.uploadText}>Upload Payment Screenshot</Text>
          )}
        </TouchableOpacity>
      </ScrollView>

      {/* Submit Button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.submitButton}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.submitText}>Submit</Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#121212",
    padding: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 20,
  },
  card: {
    backgroundColor: "#1e1e1e",
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 8,
  },
  text: {
    color: "#ccc",
    marginBottom: 4,
  },
  highlight: {
    color: "#4caf50",
    fontWeight: "bold",
    marginBottom: 8,
  },
  inputContainer: {
    marginBottom: 16,
  },
  label: {
    color: "#aaa",
    marginBottom: 6,
  },
  input: {
    backgroundColor: "#1e1e1e",
    padding: 14,
    borderRadius: 10,
    color: "#fff",
  },
  uploadBox: {
    backgroundColor: "#1e1e1e",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    height: 150,
    marginBottom: 30,
  },
  uploadText: {
    color: "#777",
  },
  footer: {
    padding: 16,
    backgroundColor: "#121212",
  },
  submitButton: {
    backgroundColor: "#4caf50",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  submitText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
});