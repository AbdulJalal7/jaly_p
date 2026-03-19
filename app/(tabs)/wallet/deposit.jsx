import React, { useState } from "react";
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Image, ActivityIndicator, Alert, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../../../context/authContext";
import walletService from "../../../lib/appwrite/wallet";

export default function DepositScreen() {
  const { user } = useAuth();
  const [amount, setAmount] = useState("");
  const [transactionId, setTransactionId] = useState("");
  const [receiptImage, setReceiptImage] = useState(null);
  const [loading, setLoading] = useState(false);

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled) {
      const asset = result.assets[0];
      setReceiptImage({
        uri: asset.uri,
        fileName: asset.fileName || `receipt_${Date.now()}.jpg`,
        mimeType: asset.mimeType || "image/jpeg",
        fileSize: asset.fileSize,
      });
    }
  };

  const handleDeposit = async () => {
    if (!amount || isNaN(amount) || parseFloat(amount) <= 0) {
      Alert.alert("Error", "Please enter a valid amount.");
      return;
    }
    if (!transactionId.trim()) {
      Alert.alert("Error", "Please enter the transaction ID.");
      return;
    }
    if (!receiptImage) {
      Alert.alert("Error", "Please upload a payment receipt screenshot.");
      return;
    }

    try {
      setLoading(true);
      await walletService.createDepositRequest({
        userId: user,
        amount,
        transactionId,
        receiptFile: receiptImage,
      });

      Alert.alert("Success", "Deposit request submitted. Waiting for admin approval.", [
        { text: "OK", onPress: () => router.push("/wallet") }
      ]);
    } catch (error) {
      Alert.alert("Error", error.message || "Failed to submit deposit request");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.push("/wallet")} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Deposit Money</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.paymentInfoCard}>
          <Text style={styles.infoTitle}>Payment Instructions</Text>
          <Text style={styles.infoText}>1. Send money to the following UPI ID:</Text>
          <View style={styles.upiContainer}>
            <Text style={styles.walletid}>Easypaisa : 03018856388</Text>
          <Text style={styles.walletid}>Name: Abdul Jalal</Text>

          </View>
          <Text style={styles.infoText}>2. Take a screenshot of the successful payment.</Text>
          <Text style={styles.infoText}>3. Fill out the form below with the exact amount and transaction ID.</Text>
        </View>

        <View style={styles.formContainer}>
          <Text style={styles.label}>Amount (₹)</Text>
          <TextInput
            style={styles.input}
            placeholder="0.00"
            placeholderTextColor="#5C5C77"
            keyboardType="numeric"
            value={amount}
            onChangeText={setAmount}
          />

          <Text style={styles.label}>Transaction / UTR ID</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter 12-digit UTR number"
            placeholderTextColor="#5C5C77"
            value={transactionId}
            onChangeText={setTransactionId}
          />

          <Text style={styles.label}>Payment Receipt</Text>
          <TouchableOpacity style={styles.imagePickerBtn} onPress={pickImage}>
            {receiptImage ? (
              <Image source={{ uri: receiptImage.uri }} style={styles.previewImage} />
            ) : (
              <View style={styles.imagePlaceholder}>
                <Ionicons name="cloud-upload-outline" size={40} color="#8E8E9F" />
                <Text style={styles.imagePlaceholderText}>Upload Screenshot</Text>
              </View>
            )}
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.submitBtn, loading && styles.submitBtnDisabled]}
            onPress={handleDeposit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text style={styles.submitBtnText}>Submit Deposit Request</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0F0F1A" },
  header: { flexDirection: "row", alignItems: "center", padding: 16 },
  backButton: { marginRight: 16 },
  headerTitle: { fontSize: 20, fontWeight: "bold", color: "#FFF" },
  scrollContent: { padding: 16, paddingBottom: 40 },
  paymentInfoCard: {
    backgroundColor: "#1C1C2E",
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: "#2A2A40",
  },
  infoTitle: { color: "#FFF", fontSize: 16, fontWeight: "bold", marginBottom: 12 },
  infoText: { color: "#D0D0E0", fontSize: 14, marginBottom: 8, lineHeight: 20 },
  upiContainer: {
    backgroundColor: "#0F0F1A",
    padding: 12,
    borderRadius: 8,
    marginVertical: 8,
    alignItems: "center",
  },
  walletid: { color: "#4caf50", fontSize: 18, fontWeight: "bold", letterSpacing: 1 },
  formContainer: {},
  label: { color: "#8E8E9F", fontSize: 14, marginBottom: 8, fontWeight: "bold" },
  input: {
    backgroundColor: "#1C1C2E",
    borderRadius: 8,
    padding: 16,
    color: "#FFF",
    fontSize: 16,
    borderWidth: 1,
    borderColor: "#2A2A40",
    marginBottom: 20,
  },
  imagePickerBtn: {
    height: 150,
    backgroundColor: "#1C1C2E",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#2A2A40",
    borderStyle: "dashed",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 32,
    overflow: "hidden",
  },
  previewImage: { width: "100%", height: "100%", resizeMode: "cover" },
  imagePlaceholder: { alignItems: "center" },
  imagePlaceholderText: { color: "#8E8E9F", marginTop: 8, fontSize: 14 },
  submitBtn: {
    backgroundColor: "#FF1A1A",
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: "center",
  },
  submitBtnDisabled: { opacity: 0.7 },
  submitBtnText: { color: "#FFF", fontSize: 16, fontWeight: "bold" },
});
