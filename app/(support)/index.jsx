import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import supportService from '../../lib/appwrite/support';
import { useAuth } from '../../context/authContext';

export default function SupportTickets() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { user } = useAuth();

  const fetchTickets = async () => {
    if (!user?.$id) return;
    try {
      setLoading(true);
      const response = await supportService.getUserTickets(user.$id);
      setTickets(response.documents);
    } catch (error) {
      console.error("Failed to fetch tickets", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.$id) {
       // Redirect to the active ticket instead of showing a list
       const redirectToActiveTicket = async () => {
         try {
           const ticket = await supportService.getOrCreateActiveTicket(user.$id);
           router.replace(`/(support)/${ticket.$id}`);
         } catch (error) {
           console.error("Redirect to active ticket failed:", error);
           fetchTickets(); // Fallback to fetching tickets if something goes wrong
         }
       };
       redirectToActiveTicket();
    }
  }, [user]);

  const renderTicket = ({ item }) => (
    <TouchableOpacity 
      style={styles.ticketCard}
      onPress={() => router.push(`/(support)/${item.$id}`)}
    >
      <View style={styles.ticketHeader}>
        <Text style={styles.ticketSubject} numberOfLines={1}>{item.subject}</Text>
        <View style={[styles.statusBadge, item.status === 'resolved' ? styles.statusResolved : styles.statusOpen]}>
          <Text style={styles.statusText}>{item.status.toUpperCase()}</Text>
        </View>
      </View>
      <Text style={styles.ticketMessage} numberOfLines={2}>{item.message}</Text>
      <Text style={styles.ticketDate}>
        {new Date(item.$createdAt).toLocaleDateString()}
      </Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {loading ? (
        <ActivityIndicator size="large" color="#FF1A1A" style={{ marginTop: 20 }} />
      ) : tickets.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>You haven't submitted any tickets yet.</Text>
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

      <TouchableOpacity 
        style={styles.fab}
        onPress={() => router.push('/(support)/new')}
      >
        <Text style={styles.fabText}>+ New Ticket</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F0F1A',
  },
  list: {
    padding: 16,
  },
  ticketCard: {
    backgroundColor: '#1C1C2E',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#2A2A40',
  },
  ticketHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  ticketSubject: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    flex: 1,
    marginRight: 8,
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
  ticketMessage: {
    color: '#8E8E9F',
    fontSize: 14,
    marginBottom: 12,
  },
  ticketDate: {
    color: '#5C5C77',
    fontSize: 12,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    color: '#8E8E9F',
    fontSize: 16,
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    backgroundColor: '#FF1A1A',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 24,
    elevation: 5,
    shadowColor: '#FF1A1A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  fabText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  }
});
