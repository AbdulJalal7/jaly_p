import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ActivityIndicator, Alert, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../../../context/authContext";
import walletService from "../../../lib/appwrite/wallet";

export default function WithdrawScreen() {
  const { user } = useAuth();
  const [balance, setBalance] = useState(0);
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState("wallet"); // 'wallet' or 'bank'
  const [upiId, setUpiId] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [accountName, setAccountName] = useState("");
  
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);

  useEffect(() => {
    const fetchBalance = async () => {
      try {
        if (user?.$id) {
          // const userStat = await walletService.getUserWallet(user.$id);
          setBalance(user.wallet_balance || 0);
        }
      } catch (error) {
        console.error("Failed to fetch balance", error);
      } finally {
        setPageLoading(false);
      }
    };
    fetchBalance();
  }, [user]);

  const handleWithdraw = async () => {
    if (!amount || isNaN(amount) || parseFloat(amount) <= 0) {
      Alert.alert("Error", "Please enter a valid amount.");
      return;
    }
    
    if (parseFloat(amount) > balance) {
      Alert.alert("Error", "Insufficient balance.");
      return;
    }

    if (method === "UPI" && !upiId.trim()) {
      Alert.alert("Error", "Please enter your UPI ID.");
      return;
    }

    if (method === "bank" && (!accountNumber.trim() || !accountName.trim())) {
      Alert.alert("Error", "Please fill in all bank details.");
      return;
    }

    try {
      setLoading(true);
      await walletService.createWithdrawRequest({
        user: user,
        amount,
        method,
        upiId: method === "UPI" ? upiId : null,
        accountNumber: method === "bank" ? accountNumber : null,
        accountName: method === "bank" ? accountName : null,
      });

      Alert.alert("Success", "Withdrawal request submitted. Waiting for admin approval.", [
        { text: "OK", onPress: () => router.push("/wallet") }
      ]);
    } catch (error) {
      Alert.alert("Error", error.message || "Failed to submit withdrawal request");
    } finally {
      setLoading(false);
    }
  };

  if (pageLoading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF1A1A" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.push("/wallet")} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Withdraw Money</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>Available Balance</Text>
          <Text style={styles.balanceValue}>₹{balance.toFixed(2)}</Text>
        </View>

        <View style={styles.formContainer}>
          <Text style={styles.label}>Withdrawal Amount (₹)</Text>
          <TextInput
            style={styles.input}
            placeholder="0.00"
            placeholderTextColor="#5C5C77"
            keyboardType="numeric"
            value={amount}
            onChangeText={setAmount}
          />

          <Text style={styles.label}>Payment Method</Text>
          <View style={styles.methodSelector}>
            <TouchableOpacity 
              style={[styles.methodBtn, method === "wallet" && styles.methodBtnActive]}
              onPress={() => setMethod("wallet")}
            >
              <Text style={[styles.methodText, method === "wallet" && styles.methodTextActive]}>wallet</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.methodBtn, method === "bank" && styles.methodBtnActive]}
              onPress={() => setMethod("bank")}
            >
              <Text style={[styles.methodText, method === "bank" && styles.methodTextActive]}>Bank Transfer</Text>
            </TouchableOpacity>
          </View>

          {method === "wallet" ? (
            <>
              <Text style={styles.label}>UPI ID</Text>
              <TextInput
                style={styles.input}
                placeholder="example@upi"
                placeholderTextColor="#5C5C77"
                value={upiId}
                onChangeText={setUpiId}
              />
            </>
          ) : (
            <>
              <Text style={styles.label}>Account Name</Text>
              <TextInput
                style={styles.input}
                placeholder="Full Name as in Bank"
                placeholderTextColor="#5C5C77"
                value={accountName}
                onChangeText={setAccountName}
              />
              <Text style={styles.label}>Account Number</Text>
              <TextInput
                style={styles.input}
                placeholder="Account Number"
                placeholderTextColor="#5C5C77"
                keyboardType="numeric"
                value={accountNumber}
                onChangeText={setAccountNumber}
              />
            </>
          )}

          <TouchableOpacity 
            style={[styles.submitBtn, loading && styles.submitBtnDisabled]}
            onPress={handleWithdraw}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text style={styles.submitBtnText}>Request Withdrawal</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0F0F1A" },
  loadingContainer: { flex: 1, backgroundColor: "#0F0F1A", justifyContent: "center", alignItems: "center" },
  header: { flexDirection: "row", alignItems: "center", padding: 16 },
  backButton: { marginRight: 16 },
  headerTitle: { fontSize: 20, fontWeight: "bold", color: "#FFF" },
  scrollContent: { padding: 16, paddingBottom: 40 },
  balanceCard: {
    backgroundColor: "#1C1C2E",
    padding: 24,
    borderRadius: 12,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: "#2A2A40",
    alignItems: "center",
  },
  balanceLabel: { color: "#8E8E9F", fontSize: 14, marginBottom: 8 },
  balanceValue: { color: "#FFFFFF", fontSize: 32, fontWeight: "bold" },
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
  methodSelector: { flexDirection: "row", marginBottom: 20, gap: 12 },
  methodBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#2A2A40",
    alignItems: "center",
    backgroundColor: "#1C1C2E",
  },
  methodBtnActive: {
    backgroundColor: "#FF1A1A20",
    borderColor: "#FF1A1A",
  },
  methodText: { color: "#8E8E9F", fontWeight: "bold" },
  methodTextActive: { color: "#FF1A1A" },
  submitBtn: {
    backgroundColor: "#FF1A1A",
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 12,
  },
  submitBtnDisabled: { opacity: 0.7 },
  submitBtnText: { color: "#FFF", fontSize: 16, fontWeight: "bold" },
});
