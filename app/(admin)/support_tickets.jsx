import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import supportService from "../../lib/appwrite/support";

export default function AdminSupportTickets() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all"); // 'all', 'open', 'resolved'
  
  // Modal state for replying
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [replyText, setReplyText] = useState("");
  const [isReplying, setIsReplying] = useState(false);

  const fetchTickets = async () => {
    try {
      setLoading(true);
      const docs = await supportService.getAllTickets(
        filter === "all" ? null : filter
      );
      setTickets(docs.documents);
    } catch (error) {
      console.error("Error fetching admin tickets:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, [filter]);

  const handleReplySubmit = async () => {
    if (!replyText.trim()) {
      Alert.alert("Error", "Reply cannot be empty.");
      return;
    }
    
    try {
      setIsReplying(true);
      await supportService.replyToTicket(selectedTicket.$id, replyText.trim(), "resolved");
      Alert.alert("Success", "Ticket updated and marked as resolved.");
      setSelectedTicket(null);
      setReplyText("");
      fetchTickets(); // Refresh list
    } catch (error) {
      Alert.alert("Error", "Failed to send reply.");
    } finally {
      setIsReplying(false);
    }
  };

  const renderTicket = ({ item }) => (
    <View style={styles.ticketCard}>
      <View style={styles.ticketHeader}>
        <Text style={styles.ticketSubject} numberOfLines={1}>
          {item.subject}
        </Text>
        <View
          style={[
            styles.statusBadge,
            item.status === "resolved" ? styles.statusResolved : styles.statusOpen,
          ]}
        >
          <Text style={styles.statusText}>{item.status.toUpperCase()}</Text>
        </View>
      </View>
      <Text style={styles.ticketUser}>User ID: {item.userId}</Text>
      <Text style={styles.ticketMessage}>{item.message}</Text>
      
      <View style={styles.ticketFooter}>
        <Text style={styles.ticketDate}>
          {new Date(item.$createdAt).toLocaleDateString()}
        </Text>
        {item.status === 'open' && (
          <TouchableOpacity 
            style={styles.replyButton}
            onPress={() => {
              setSelectedTicket(item);
              setReplyText("");
            }}
          >
            <Text style={styles.replyButtonText}>Reply & Resolve</Text>
          </TouchableOpacity>
        )}
      </View>
      
      {item.adminReply && (
        <View style={styles.adminReplyBox}>
          <Text style={styles.adminReplyLabel}>Your Reply:</Text>
          <Text style={styles.adminReplyText}>{item.adminReply}</Text>
        </View>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.headerTitle}>Support Dashboard</Text>

      <View style={styles.filterContainer}>
        {["all", "open", "resolved"].map((f) => (
          <TouchableOpacity
            key={f}
            style={[styles.filterTab, filter === f && styles.filterTabActive]}
            onPress={() => setFilter(f)}
          >
            <Text
              style={[styles.filterText, filter === f && styles.filterTextActive]}
            >
              {f.toUpperCase()}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#FF1A1A" style={{ marginTop: 20 }} />
      ) : tickets.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No tickets found.</Text>
        </View>
      ) : (
        <FlatList
          data={tickets}
          keyExtractor={(item) => item.$id}
          renderItem={renderTicket}
          contentContainerStyle={styles.list}
          refreshing={loading}
          onRefresh={fetchTickets}
        />
      )}

      {/* Reply Modal */}
      <Modal visible={!!selectedTicket} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Reply to Ticket</Text>
            <Text style={styles.modalSubtitle}>
              Subject: {selectedTicket?.subject}
            </Text>
            <Text style={styles.modalMessageBox}>
              {selectedTicket?.message}
            </Text>

            <TextInput
              style={styles.replyInput}
              placeholder="Type your response here..."
              placeholderTextColor="#5C5C77"
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              value={replyText}
              onChangeText={setReplyText}
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setSelectedTicket(null)}
                disabled={isReplying}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.submitReplyBtn, isReplying && { opacity: 0.5 }]}
                onPress={handleReplySubmit}
                disabled={isReplying}
              >
                {isReplying ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.submitReplyBtnText}>Send & Resolve</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0F0F1A",
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#FFFFFF",
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  filterContainer: {
    flexDirection: "row",
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  filterTab: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    marginRight: 8,
    backgroundColor: "#1C1C2E",
    borderWidth: 1,
    borderColor: "#2A2A40",
  },
  filterTabActive: {
    backgroundColor: "#FF1A1A20",
    borderColor: "#FF1A1A",
  },
  filterText: {
    color: "#8E8E9F",
    fontSize: 12,
    fontWeight: "bold",
  },
  filterTextActive: {
    color: "#FF1A1A",
  },
  list: {
    padding: 16,
  },
  ticketCard: {
    backgroundColor: "#1C1C2E",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#2A2A40",
  },
  ticketHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  ticketSubject: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
    flex: 1,
    marginRight: 8,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  statusOpen: {
    backgroundColor: "#ff980020",
    borderColor: "#ff9800",
    borderWidth: 1,
  },
  statusResolved: {
    backgroundColor: "#4caf5020",
    borderColor: "#4caf50",
    borderWidth: 1,
  },
  statusText: {
    fontSize: 10,
    fontWeight: "bold",
    color: "#fff",
  },
  ticketUser: {
    color: "#5C5C77",
    fontSize: 12,
    marginTop: 4,
    marginBottom: 12,
  },
  ticketMessage: {
    color: "#D0D0E0",
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 16,
  },
  ticketFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  ticketDate: {
    color: "#5C5C77",
    fontSize: 12,
  },
  replyButton: {
    backgroundColor: "#FF1A1A",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  replyButtonText: {
    color: "white",
    fontSize: 12,
    fontWeight: "bold",
  },
  adminReplyBox: {
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#2A2A40",
  },
  adminReplyLabel: {
    color: "#4caf50",
    fontSize: 12,
    fontWeight: "bold",
    marginBottom: 4,
  },
  adminReplyText: {
    color: "#A0A0B0",
    fontSize: 14,
    fontStyle: "italic",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyText: {
    color: "#8E8E9F",
    fontSize: 16,
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "#000000AA",
    justifyContent: "center",
    padding: 20,
  },
  modalContent: {
    backgroundColor: "#1C1C2E",
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: "#2A2A40",
  },
  modalTitle: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 12,
  },
  modalSubtitle: {
    color: "#8E8E9F",
    fontSize: 14,
    marginBottom: 8,
  },
  modalMessageBox: {
    backgroundColor: "#0F0F1A",
    color: "#D0D0E0",
    padding: 12,
    borderRadius: 8,
    fontSize: 14,
    marginBottom: 16,
  },
  replyInput: {
    backgroundColor: "#0F0F1A",
    borderWidth: 1,
    borderColor: "#2A2A40",
    borderRadius: 8,
    color: "#FFFFFF",
    padding: 12,
    fontSize: 16,
    height: 100,
    marginBottom: 20,
  },
  modalActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
  },
  cancelBtn: {
    padding: 12,
    marginRight: 12,
  },
  cancelBtnText: {
    color: "#8E8E9F",
    fontWeight: "bold",
  },
  submitReplyBtn: {
    backgroundColor: "#FF1A1A",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    minWidth: 120,
  },
  submitReplyBtnText: {
    color: "white",
    fontWeight: "bold",
  },
});
