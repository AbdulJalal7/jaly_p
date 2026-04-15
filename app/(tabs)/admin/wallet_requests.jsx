import React, { useState, useEffect, useCallback } from "react";
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Image, Modal } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../../../context/authContext";
import walletService from "../../../lib/appwrite/wallet";
import { useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import Toast from 'react-native-toast-message';
import ConfirmModal from '../../../components/ConfirmModal';

export default function AdminWalletRequests() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("deposits"); // 'deposits' or 'withdrawals'
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalConfig, setModalConfig] = useState({
    title: "",
    message: "",
    onConfirm: () => {},
  });

  const fetchRequests = async () => {
    setLoading(true);
    try {
      if (activeTab === "deposits") {
        const res = await walletService.getPendingDeposits();
        setRequests(res.documents);
        // console.log("pending depositssssssss :",requests);
      } else {
        const res = await walletService.getPendingWithdrawals();
        setRequests(res.documents);
      }
    } catch (error) {
      console.error("Error fetching requests:", error);
      Toast.show({ type: 'error', text1: 'Error', text2: 'Failed to fetch wallet requests.' });
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchRequests();
    }, [activeTab])
  );

  const handleApproveDeposit = async (item) => {
    setModalConfig({
      title: "Approve Deposit",
      message: `Are you sure you want to approve ₹${item.amount} for user?`,
      onConfirm: async () => {
        try {
          setProcessingId(item.$id);
          // Since item.user_id stored internal id:
          await walletService.approveDeposit(item.$id, item.user_id, item.amount);
          Toast.show({ type: 'success', text1: 'Success', text2: 'Deposit approved.' });
          fetchRequests();
        } catch (error) {
          Toast.show({ type: 'error', text1: 'Error', text2: 'Failed to approve deposit.' });
        } finally {
          setProcessingId(null);
        }
      }
    });
    setModalVisible(true);
  };

  const handleRejectDeposit = async (item) => {
    setModalConfig({
      title: "Reject Deposit",
      message: "Are you sure you want to reject this deposit request?",
      onConfirm: async () => {
        try {
          setProcessingId(item.$id);
          await walletService.rejectDeposit(item.$id, "Rejected by admin");
          Toast.show({ type: 'success', text1: 'Success', text2: 'Deposit rejected.' });
          fetchRequests();
        } catch (error) {
          Toast.show({ type: 'error', text1: 'Error', text2: 'Failed to reject deposit.' });
        } finally {
          setProcessingId(null);
        }
      }
    });
    setModalVisible(true);
  };

  const handleApproveWithdrawal = async (item) => {
    setModalConfig({
      title: "Approve Withdrawal",
      message: `Have you sent ₹${item.amount} to the user? Tap Approve to update their wallet balance.`,
      onConfirm: async () => {
        try {
          setProcessingId(item.$id);
          await walletService.approveWithdrawal(item.$id, item.user_id, item.amount);
          Toast.show({ type: 'success', text1: 'Success', text2: 'Withdrawal approved and balance updated.' });
          fetchRequests();
        } catch (error) {
          Toast.show({ type: 'error', text1: 'Error', text2: 'Failed to approve withdrawal.' });
        } finally {
          setProcessingId(null);
        }
      }
    });
    setModalVisible(true);
  };

  const handleRejectWithdrawal = async (item) => {
    setModalConfig({
      title: "Reject Withdrawal",
      message: "Are you sure you want to reject this withdrawal request? The amount will remain in their wallet.",
      onConfirm: async () => {
        try {
          setProcessingId(item.$id);
          await walletService.rejectWithdrawal(item.$id, item.user_id, item.amount, "Rejected by admin");
          Toast.show({ type: 'success', text1: 'Success', text2: 'Withdrawal rejected.' });
          fetchRequests();
        } catch (error) {
          Toast.show({ type: 'error', text1: 'Error', text2: 'Failed to reject withdrawal.' });
        } finally {
          setProcessingId(null);
        }
      }
    });
    setModalVisible(true);
  };

  const renderDepositItem = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.amountText}>₹{item.amount}</Text>
        <Text style={styles.dateText}>
          {new Date(item.$createdAt).toLocaleDateString()} {new Date(item.$createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </Text>
      </View>
      <Text style={styles.detailText}>User ID: {item.user_id}</Text>
      <Text style={styles.detailText}>Transaction ID: {item.transaction_id || "N/A"}</Text>
      
      {item.receipt_image ? (
        <TouchableOpacity 
          style={styles.viewReceiptBtn}
          onPress={() => setSelectedImage(`https://cloud.appwrite.io/v1/storage/buckets/receipts/files/${item.receipt_image}/view?project=${process.env.EXPO_PUBLIC_APPWRITE_PROJECT_ID}`)}
        >
          <Ionicons name="image-outline" size={16} color="#4caf50" />
          <Text style={styles.viewReceiptText}>View Receipt</Text>
        </TouchableOpacity>
      ) : (
        <Text style={styles.noReceiptText}>No receipt image</Text>
      )}

      <View style={styles.actionRow}>
        <TouchableOpacity 
          style={[styles.actionBtn, styles.rejectBtn]}
          onPress={() => handleRejectDeposit(item)}
          disabled={processingId === item.$id}
        >
          <Text style={styles.btnText}>Reject</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.actionBtn, styles.approveBtn]}
          onPress={() => handleApproveDeposit(item)}
          disabled={processingId === item.$id}
        >
          {processingId === item.$id ? (
            <ActivityIndicator color="#FFF" size="small" />
          ) : (
            <Text style={styles.btnText}>Approve</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderWithdrawalItem = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.amountText}>₹{item.amount}</Text>
        <Text style={styles.dateText}>
          {new Date(item.$createdAt).toLocaleDateString()} {new Date(item.$createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </Text>
      </View>
      <Text style={styles.detailText}>User ID: {item.user_id}</Text>
      <Text style={styles.detailText}>Method: {item.method}</Text>
      
      {item.method === "wallet" ? (
        <Text style={styles.highlightText}>UPI ID: {item.upi_id}</Text>
      ) : (
        <View>
          <Text style={styles.highlightText}>Name: {item.account_name}</Text>
          <Text style={styles.highlightText}>A/C No: {item.account_number}</Text>
        </View>
      )}

      <View style={styles.actionRow}>
        <TouchableOpacity 
          style={[styles.actionBtn, styles.rejectBtn]}
          onPress={() => handleRejectWithdrawal(item)}
          disabled={processingId === item.$id}
        >
          <Text style={styles.btnText}>Reject</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.actionBtn, styles.approveBtn]}
          onPress={() => handleApproveWithdrawal(item)}
          disabled={processingId === item.$id}
        >
          {processingId === item.$id ? (
            <ActivityIndicator color="#FFF" size="small" />
          ) : (
            <Text style={styles.btnText}>Approved & Paid</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.headerTitle}>Wallet Requests</Text>

      <View style={styles.tabContainer}>
        <TouchableOpacity 
          style={[styles.tab, activeTab === "deposits" && styles.tabActive]}
          onPress={() => setActiveTab("deposits")}
        >
          <Text style={[styles.tabText, activeTab === "deposits" && styles.tabTextActive]}>Pending Deposits</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, activeTab === "withdrawals" && styles.tabActive]}
          onPress={() => setActiveTab("withdrawals")}
        >
          <Text style={[styles.tabText, activeTab === "withdrawals" && styles.tabTextActive]}>Pending Withdrawals</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#FF1A1A" style={{ marginTop: 40 }} />
      ) : requests.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No pending {activeTab} found.</Text>
        </View>
      ) : (
        <FlatList
          data={requests}
          keyExtractor={(item) => item.$id}
          renderItem={activeTab === "deposits" ? renderDepositItem : renderWithdrawalItem}
          contentContainerStyle={styles.list}
        />
      )}

      {/* Image Modal */}
      <Modal visible={!!selectedImage} transparent={true} onRequestClose={() => setSelectedImage(null)}>
        <View style={styles.modalContainer}>
          <TouchableOpacity style={styles.closeModalBtn} onPress={() => setSelectedImage(null)}>
            <Ionicons name="close" size={32} color="#FFF" />
          </TouchableOpacity>
          {selectedImage && (
            <Image source={{ uri: selectedImage }} style={styles.fullImage} resizeMode="contain" />
          )}
        </View>
      </Modal>
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0F0F1A" },
  headerTitle: { fontSize: 24, fontWeight: "bold", color: "#FFF", padding: 16 },
  tabContainer: { flexDirection: "row", paddingHorizontal: 16, marginBottom: 16 },
  tab: { flex: 1, paddingVertical: 12, alignItems: "center", borderBottomWidth: 2, borderBottomColor: "#2A2A40" },
  tabActive: { borderBottomColor: "#FF1A1A" },
  tabText: { color: "#8E8E9F", fontWeight: "bold" },
  tabTextActive: { color: "#FF1A1A" },
  list: { paddingHorizontal: 16, paddingBottom: 24 },
  card: { backgroundColor: "#1C1C2E", padding: 16, borderRadius: 12, marginBottom: 16, borderWidth: 1, borderColor: "#2A2A40" },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  amountText: { fontSize: 20, fontWeight: "bold", color: "#FFF" },
  dateText: { color: "#8E8E9F", fontSize: 12 },
  detailText: { color: "#D0D0E0", fontSize: 14, marginBottom: 4 },
  highlightText: { color: "#4caf50", fontSize: 15, fontWeight: "bold", marginTop: 4, marginBottom: 4 },
  viewReceiptBtn: { flexDirection: "row", alignItems: "center", marginTop: 8, padding: 8, backgroundColor: "#4caf5020", alignSelf: "flex-start", borderRadius: 6 },
  viewReceiptText: { color: "#4caf50", marginLeft: 8, fontWeight: "bold", fontSize: 12 },
  noReceiptText: { color: "#ff9800", fontSize: 12, marginTop: 8, fontStyle: "italic" },
  actionRow: { flexDirection: "row", marginTop: 16, gap: 12 },
  actionBtn: { flex: 1, paddingVertical: 12, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  rejectBtn: { backgroundColor: "transparent", borderWidth: 1, borderColor: "#FF1A1A" },
  approveBtn: { backgroundColor: "#4caf50" },
  btnText: { color: "#FFF", fontWeight: "bold" },
  emptyContainer: { flex: 1, justifyContent: "center", alignItems: "center", marginTop: 40 },
  emptyText: { color: "#8E8E9F", fontSize: 16 },
  modalContainer: { flex: 1, backgroundColor: "#000000FA", justifyContent: "center", alignItems: "center" },
  closeModalBtn: { position: "absolute", top: 40, right: 20, zIndex: 10 },
  fullImage: { width: "90%", height: "80%" },
});
