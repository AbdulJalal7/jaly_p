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
import supportService from "../../../lib/appwrite/support";

export default function AdminSupportTickets() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all"); // 'all', 'open', 'resolved'
  
  // Conversation state
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
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

  const fetchMessages = async (ticketId) => {
    try {
      setLoadingMessages(true);
      const data = await supportService.getTicketMessages(ticketId);
      setMessages(data.documents);
    } catch (error) {
      console.error("Error fetching messages:", error);
    } finally {
      setLoadingMessages(false);
    }
  };

  useEffect(() => {
    if (selectedTicket) {
      fetchMessages(selectedTicket.$id);
    } else {
      setMessages([]);
    }
  }, [selectedTicket]);

  const handleReplySubmit = async () => {
    if (!replyText.trim()) {
      Alert.alert("Error", "Reply cannot be empty.");
      return;
    }
    
    try {
      setIsReplying(true);
      // For admin, we assume admin ID is available or just use "admin" string if auth not scoped here
      // Based on current context, we use "admin" as placeholder or actual ID if available
      await supportService.replyToTicket(selectedTicket.$id, "admin_user", replyText.trim());
      
      setReplyText("");
      fetchMessages(selectedTicket.$id); // Refresh chat
      fetchTickets(); // Refresh list to update status/last message
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
          Last: {new Date(item.lastMessageAt || item.$createdAt).toLocaleDateString()}
        </Text>
        <TouchableOpacity 
          style={styles.replyButton}
          onPress={() => {
            setSelectedTicket(item);
            setReplyText("");
          }}
        >
          <Text style={styles.replyButtonText}>
            {item.status === 'open' ? 'View & Reply' : 'View History'}
          </Text>
        </TouchableOpacity>
      </View>
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
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Conversation</Text>
              <TouchableOpacity onPress={() => setSelectedTicket(null)}>
                <Text style={styles.closeBtnText}>✕</Text>
              </TouchableOpacity>
            </View>
            
            <Text style={styles.modalSubtitle}>
              Subject: {selectedTicket?.subject}
            </Text>

            <View style={styles.chatContainer}>
              {loadingMessages ? (
                <ActivityIndicator color="#FF1A1A" />
              ) : (
                <FlatList
                  data={messages}
                  keyExtractor={(m) => m.$id}
                  renderItem={({ item: m }) => (
                    <View style={[
                      styles.messageBubble,
                      m.role === 'admin' ? styles.adminBubble : styles.userBubble
                    ]}>
                      <Text style={styles.messageRole}>
                        {m.role === 'admin' ? 'You' : 'User'}
                      </Text>
                      <Text style={styles.messageContent}>{m.message}</Text>
                      <Text style={styles.messageTime}>
                        {new Date(m.$createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </Text>
                    </View>
                  )}
                  inverted={false}
                  contentContainerStyle={{ paddingVertical: 10 }}
                />
              )}
            </View>

            <View style={styles.replyArea}>
              <TextInput
                style={styles.replyInput}
                placeholder="Type your response..."
                placeholderTextColor="#5C5C77"
                multiline
                value={replyText}
                onChangeText={setReplyText}
              />

              <TouchableOpacity
                style={[styles.submitReplyBtn, (!replyText.trim() || isReplying) && { opacity: 0.5 }]}
                onPress={handleReplySubmit}
                disabled={!replyText.trim() || isReplying}
              >
                {isReplying ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.submitReplyBtnText}>Send</Text>
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
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#1C1C2E",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    height: "80%",
    borderWidth: 1,
    borderColor: "#2A2A40",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  closeBtnText: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "bold",
  },
  modalTitle: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "bold",
  },
  modalSubtitle: {
    color: "#8E8E9F",
    fontSize: 14,
    marginBottom: 16,
  },
  chatContainer: {
    flex: 1,
    backgroundColor: "#0F0F1A",
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  messageBubble: {
    maxWidth: "85%",
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
  },
  userBubble: {
    alignSelf: "flex-start",
    backgroundColor: "#2A2A40",
  },
  adminBubble: {
    alignSelf: "flex-end",
    backgroundColor: "#FF1A1A20",
    borderColor: "#FF1A1A40",
    borderWidth: 1,
  },
  messageRole: {
    fontSize: 10,
    fontWeight: "bold",
    color: "#8E8E9F",
    marginBottom: 4,
    textTransform: "uppercase",
  },
  messageContent: {
    color: "#FFFFFF",
    fontSize: 14,
    lineHeight: 20,
  },
  messageTime: {
    fontSize: 9,
    color: "#5C5C77",
    alignSelf: "flex-end",
    marginTop: 4,
  },
  replyArea: {
    flexDirection: "row",
    alignItems: "center",
  },
  replyInput: {
    flex: 1,
    backgroundColor: "#0F0F1A",
    borderWidth: 1,
    borderColor: "#2A2A40",
    borderRadius: 24,
    color: "#FFFFFF",
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 16,
    maxHeight: 100,
    marginRight: 10,
  },
  submitReplyBtn: {
    backgroundColor: "#FF1A1A",
    width: 60,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
  },
  submitReplyBtnText: {
    color: "white",
    fontWeight: "bold",
  },
});
