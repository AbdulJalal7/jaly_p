import { View, Text, StyleSheet, TouchableOpacity, FlatList, ActivityIndicator, RefreshControl } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useState, useCallback } from "react";
import { useAuth } from "../../../context/authContext";
import walletService from "../../../lib/appwrite/wallet";
import { useFocusEffect, router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

export default function WalletScreen() {
  const { user } = useAuth();
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchWalletData = async () => {
    if (!user?.$id) return;
    try {
      // 1. Fetch balance
      // const userStat = await walletService.getUserWallet(user.$id);
      setBalance(user.wallet_balance || 0);
      // console.log("user : ",user);
      // 2. Fetch transactions
      const history = await walletService.getUserTransactions(user);
      setTransactions(history.documents);
    } catch (error) {
      console.error("Failed to load wallet data", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchWalletData();
    }, [user])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchWalletData();
  };

  const renderTransaction = ({ item }) => {
    const isPositive = item.type === "deposit" || item.type === "prize";
    const statusColor = 
      item.status === "approved" ? "#4caf50" : 
      item.status === "rejected" ? "#FF1A1A" : "#ff9800";

    return (
      <View style={styles.transactionCard}>
        <View style={styles.txHeader}>
          <Text style={styles.txType}>{item.type.toUpperCase()}</Text>
          <Text style={[styles.txAmount, { color: isPositive ? "#4caf50" : "#FFFFFF" }]}>
            {isPositive ? "+" : "-"}₹{item.amount}
          </Text>
        </View>
        
        <View style={styles.txFooter}>
          <Text style={styles.txDate}>
            {new Date(item.$createdAt).toLocaleDateString()} {new Date(item.$createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Text>
          <View style={[styles.statusBadge, { borderColor: statusColor, backgroundColor: `${statusColor}20` }]}>
            <Text style={[styles.statusText, { color: statusColor }]}>{item.status.toUpperCase()}</Text>
          </View>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF1A1A" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.headerTitle}>My Wallet</Text>
      
      {/* Wallet Balance Card */}
      <View style={styles.balanceCard}>
        <Text style={styles.balanceLabel}>Available Balance</Text>
        <Text style={styles.balanceAmount}>Rs. {balance.toFixed(2)}</Text>
        
        <View style={styles.actionButtons}>
          <TouchableOpacity 
            style={styles.actionBtn}
            onPress={() => router.push("/wallet/deposit")}
          >
            <Ionicons name="add-circle-outline" size={24} color="#FFF" />
            <Text style={styles.actionBtnText}>Deposit</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.actionBtn, styles.withdrawBtn]}
            onPress={() => router.push("/wallet/withdraw")}
          >
            <Ionicons name="arrow-down-circle-outline" size={24} color="#FFF" />
            <Text style={styles.actionBtnText}>Withdraw</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Transaction History */}
      <View style={styles.historyContainer}>
        <Text style={styles.historyTitle}>Transaction History</Text>
        
        {transactions.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No transactions yet.</Text>
          </View>
        ) : (
          <FlatList
            data={transactions}
            keyExtractor={(item) => item.$id}
            renderItem={renderTransaction}
            contentContainerStyle={styles.list}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#FF1A1A" />
            }
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0F0F1A",
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: "#0F0F1A",
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#FFFFFF",
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  balanceCard: {
    backgroundColor: "#1C1C2E",
    marginHorizontal: 16,
    marginTop: 8,
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#2A2A40",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 6,
  },
  balanceLabel: {
    color: "#8E8E9F",
    fontSize: 14,
    marginBottom: 8,
  },
  balanceAmount: {
    color: "#FFFFFF",
    fontSize: 40,
    fontWeight: "bold",
    marginBottom: 24,
  },
  actionButtons: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 16,
    width: "100%",
  },
  actionBtn: {
    flex: 1,
    backgroundColor: "#FF1A1A",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  withdrawBtn: {
    backgroundColor: "#2A2A40",
  },
  actionBtnText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
  },
  historyContainer: {
    flex: 1,
    marginTop: 24,
  },
  historyTitle: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "bold",
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  list: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  transactionCard: {
    backgroundColor: "#1C1C2E",
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#2A2A40",
  },
  txHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  txType: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
  },
  txAmount: {
    fontSize: 18,
    fontWeight: "bold",
  },
  txFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  txDate: {
    color: "#5C5C77",
    fontSize: 12,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    borderWidth: 1,
  },
  statusText: {
    fontSize: 10,
    fontWeight: "bold",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 40,
  },
  emptyText: {
    color: "#8E8E9F",
    fontSize: 16,
  },
});
