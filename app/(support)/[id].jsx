import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, FlatList, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import supportService from '../../lib/appwrite/support';

export default function TicketDetails() {
  const { id } = useLocalSearchParams();
  const [messages, setMessages] = useState([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [isReplying, setIsReplying] = useState(false);
  const [loading, setLoading] = useState(false);
  const [ticket, setTicket] = useState(null);
  

  const fetchTicket = async () => {
    try {
      setLoading(true);
      const data = await supportService.getTicket(id);
      setTicket(data);
    } catch (error) {
      console.error('Error fetching ticket details', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async () => {
    try {
      setLoadingMessages(true);
      const data = await supportService.getTicketMessages(id);
      setMessages(data.documents);
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setLoadingMessages(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchTicket();
      fetchMessages();
    }
  }, [id]);

  const handleReplySubmit = async () => {
    if (!replyText.trim()) return;
    
    try {
      setIsReplying(true);
      await supportService.userReply(id, ticket.userId, replyText.trim());
      setReplyText("");
      fetchMessages(); // Refresh chat
      // Optionally refresh ticket for status change if needed locally
    } catch (error) {
      console.error('Error sending reply:', error);
    } finally {
      setIsReplying(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color="#FF1A1A" />
      </View>
    );
  }

  if (!ticket) {
    return (
      <View style={[styles.container, styles.center]}>
        <Text style={styles.errorText}>Ticket not found.</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={90}
    >
      <View style={styles.headerCard}>
        <View style={styles.titleRow}>
          <Text style={styles.subject}>{ticket.subject}</Text>
          <View style={[styles.statusBadge, ticket.status === 'resolved' ? styles.statusResolved : styles.statusOpen]}>
            <Text style={styles.statusText}>{ticket.status.toUpperCase()}</Text>
          </View>
        </View>
        <Text style={styles.date}>
          ID: {id} • Created: {new Date(ticket.$createdAt).toLocaleDateString()}
        </Text>
      </View>

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
                  {m.role === 'admin' ? 'Support' : 'You'}
                </Text>
                <Text style={styles.messageContent}>{m.message}</Text>
                <Text style={styles.messageTime}>
                  {new Date(m.$createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </Text>
              </View>
            )}
            contentContainerStyle={{ padding: 16 }}
          />
        )}
      </View>

      <View style={styles.replyArea}>
        <TextInput
          style={styles.replyInput}
          placeholder="Type your message..."
          placeholderTextColor="#5C5C77"
          multiline
          value={replyText}
          onChangeText={setReplyText}
        />
        <TouchableOpacity
          style={[styles.sendButton, (!replyText.trim() || isReplying) && { opacity: 0.5 }]}
          onPress={handleReplySubmit}
          disabled={!replyText.trim() || isReplying}
        >
          {isReplying ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={styles.sendButtonText}>Send</Text>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F0F1A',
  },
  scrollContent: {
    padding: 16,
  },
  center: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    color: '#FF1A1A',
    fontSize: 16,
  },
  headerCard: {
    backgroundColor: '#1C1C2E',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#2A2A40',
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  subject: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
    flex: 1,
    marginRight: 12,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  statusOpen: {
    backgroundColor: '#ff980020',
    borderColor: '#ff9800',
    borderWidth: 1,
  },
  statusResolved: {
    backgroundColor: '#4caf5020',
    borderColor: '#4caf50',
    borderWidth: 1,
  },
  statusText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#fff',
  },
  date: {
    color: '#5C5C77',
    fontSize: 12,
  },
  chatContainer: {
    flex: 1,
  },
  messageBubble: {
    maxWidth: '85%',
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
  },
  userBubble: {
    alignSelf: 'flex-end',
    backgroundColor: '#FF1A1A20',
    borderColor: '#FF1A1A40',
    borderWidth: 1,
  },
  adminBubble: {
    alignSelf: 'flex-start',
    backgroundColor: '#2A2A40',
  },
  messageRole: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#8E8E9F',
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  messageContent: {
    color: '#FFFFFF',
    fontSize: 14,
    lineHeight: 20,
  },
  messageTime: {
    fontSize: 9,
    color: '#5C5C77',
    alignSelf: 'flex-end',
    marginTop: 4,
  },
  replyArea: {
    flexDirection: 'row',
    padding: 12,
    paddingBottom: Platform.OS === 'ios' ? 24 : 12,
    borderTopWidth: 1,
    borderTopColor: '#2A2A40',
    backgroundColor: '#1C1C2E',
    alignItems: 'center',
  },
  replyInput: {
    flex: 1,
    backgroundColor: '#0F0F1A',
    borderWidth: 1,
    borderColor: '#2A2A40',
    borderRadius: 24,
    color: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 16,
    maxHeight: 100,
    marginRight: 10,
  },
  sendButton: {
    backgroundColor: '#FF1A1A',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    minWidth: 70,
    alignItems: 'center',
  },
  sendButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
});
