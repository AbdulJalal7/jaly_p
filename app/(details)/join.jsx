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
import participantService from "../../lib/appwrite/participants";
import { useAuth } from "../../context/authContext";

export default function JoinTournament() {
  const { id } = useLocalSearchParams(); // tournament id
  const router = useRouter();
    const { user } = useAuth();
  const [gameId, setGameId] = useState("");
  const [transactionId, setTransactionId] = useState("");
  const [receipt, setReceipt] = useState(null);
  const [loading, setLoading] = useState(false);

  const pickImage = async () => {
  try {
    // console.log("User ... ", user);
    // 1️⃣ Request permission
    const { status } =
      await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (status !== "granted") {
      Alert.alert(
        "Permission Required",
        "Please allow gallery access to upload receipt."
      );
      return;
    }

    // 2️⃣ Open image picker
    const result = await ImagePicker.launchImageLibraryAsync({
      // mediaTypes: ImagePicker.MediaType.Images, // ✅ Updated API
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1], // optional (square crop)
      quality: 0.7,
    });

    // 3️⃣ Handle cancel
    if (result.canceled) return;

    // 4️⃣ Get selected image
    const selectedImage = result.assets[0];
    // console.log("Selected image:", selectedImage);

    // Optional: basic validation
    if (!selectedImage?.uri) {
      Alert.alert("Error", "Failed to select image.");
      return;
    }

    // 5️⃣ Save to state
    setReceipt(selectedImage);

  } catch (error) {
    console.log("Image Picker Error:", error);
    Alert.alert("Error", "Something went wrong while picking image.");
  }
};

  // const handleSubmit = async () => {
  //   if (!gameId || !transactionId || !receipt) {
  //     Alert.alert("Error", "All fields are required");
  //     return;
  //   }

  //   try {

  //     setLoading(true);
  //     console.log("User ID:", user);
  //     await participantService.joinTournament({
  //       tournamentId: id,
  //       userId: user.$id,  
  //       gameId: gameId,
  //       transaction_no: transactionId,
  //       receiptFile: receipt,
  //     });
  //     console.log("Joined tournament successfully");
  //     Alert.alert(
  //       "Submitted",
  //       "Your payment is under verification.",
  //       [
  //         {
  //           text: "OK",
  //           onPress: () => router.back(),
  //         },
  //       ]
  //     );
  //   } catch (error) {
  //     console.log("PPPPPPPPPP : ",error);
  //     // Alert.alert("Error", "Failed to submit participation");
  //   } finally {
  //     setLoading(false);
  //   }
  // };

  const handleSubmit = async () => {
  if (!gameId || !transactionId || !receipt) {
    Alert.alert("Error", "All fields are required");
    return;
  }

  try {
    setLoading(true);

    await participantService.joinTournament({
      tournamentId: id,
      userId: user.$id,
      gameId,
      transaction_no: transactionId,
      receiptFile: receipt,
    });

    router.replace({
      pathname: "/(details)/success",
      params: { id },
    });

  } catch (error) {
    console.log(error);
    Alert.alert("Error", "Failed to join tournament");
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