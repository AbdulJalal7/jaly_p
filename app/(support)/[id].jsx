import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, ScrollView } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import supportService from '../../lib/appwrite/support';

export default function TicketDetails() {
  const { id } = useLocalSearchParams();
  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
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
    if (id) fetchTicket();
  }, [id]);

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
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      <View style={styles.headerCard}>
        <View style={styles.titleRow}>
          <Text style={styles.subject}>{ticket.subject}</Text>
          <View style={[styles.statusBadge, ticket.status === 'resolved' ? styles.statusResolved : styles.statusOpen]}>
            <Text style={styles.statusText}>{ticket.status.toUpperCase()}</Text>
          </View>
        </View>
        <Text style={styles.date}>
          Submitted on: {new Date(ticket.$createdAt).toLocaleString()}
        </Text>
      </View>

      <View style={styles.messageCard}>
        <Text style={styles.sectionLabel}>Your Message</Text>
        <Text style={styles.messageText}>{ticket.message}</Text>
      </View>

      {ticket.adminReply ? (
        <View style={styles.replyCard}>
          <Text style={styles.sectionLabelReply}>Support Reply</Text>
          <Text style={styles.replyText}>{ticket.adminReply}</Text>
        </View>
      ) : (
        <View style={styles.noReplyCard}>
          <Text style={styles.noReplyText}>Support has not replied yet. Please check back later.</Text>
        </View>
      )}
    </ScrollView>
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
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#2A2A40',
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  subject: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
    flex: 1,
    marginRight: 12,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginTop: 2,
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
  messageCard: {
    backgroundColor: '#1C1C2E',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  sectionLabel: {
    color: '#5C5C77',
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  messageText: {
    color: '#FFFFFF',
    fontSize: 15,
    lineHeight: 22,
  },
  replyCard: {
    backgroundColor: '#FF1A1A10',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FF1A1A50',
    marginTop: 8,
  },
  sectionLabelReply: {
    color: '#FF1A1A',
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  replyText: {
    color: '#FFFFFF',
    fontSize: 15,
    lineHeight: 22,
  },
  noReplyCard: {
    padding: 16,
    alignItems: 'center',
    marginTop: 16,
    borderStyle: 'dashed',
    borderWidth: 1,
    borderColor: '#2A2A40',
    borderRadius: 12,
  },
  noReplyText: {
    color: '#5C5C77',
    textAlign: 'center',
  }
});
