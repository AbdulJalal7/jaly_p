import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import tournamentService from "../../../lib/appwrite/database";

export default function AdminTournaments() {
  const [tournaments, setTournaments] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const fetchTournaments = async () => {
    try {
      setLoading(true);
      const response = await tournamentService.getTournaments();
      // Filter for completed tournaments
      const completed = response.documents.filter(t => t.status === "completed");
      setTournaments(completed);
    } catch (error) {
      console.error("Error fetching tournaments:", error);
      Alert.alert("Error", "Failed to fetch tournaments.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTournaments();
  }, []);

  const renderTournament = ({ item }) => (
    <TouchableOpacity 
      style={styles.card}
      onPress={() => router.push({
        pathname: "/(tabs)/admin/publish_results",
        params: { id: item.$id }
      })}
    >
      <View style={styles.cardHeader}>
        <Text style={styles.title}>{item.title}</Text>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>COMPLETED</Text>
        </View>
      </View>
      <Text style={styles.details}>{item.game} • {new Date(item.startDate).toLocaleDateString()}</Text>
      <Text style={styles.description} numberOfLines={2}>{item.description}</Text>
      
      <View style={styles.footer}>
        <Text style={styles.players}>{item.currentPlayers || 0} / {item.maxPlayers} Players</Text>
        <Text style={styles.manageText}>Manage Results →</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Manage Tournaments</Text>
        <TouchableOpacity onPress={fetchTournaments} style={styles.refreshBtn}>
          <Text style={styles.refreshText}>Refresh</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#FF1A1A" style={{ marginTop: 40 }} />
      ) : tournaments.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No completed tournaments found.</Text>
        </View>
      ) : (
        <FlatList
          data={tournaments}
          keyExtractor={(item) => item.$id}
          renderItem={renderTournament}
          contentContainerStyle={styles.list}
          refreshing={loading}
          onRefresh={fetchTournaments}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0F0F1A",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  refreshBtn: {
    padding: 8,
  },
  refreshText: {
    color: "#FF1A1A",
    fontWeight: "bold",
  },
  list: {
    padding: 16,
  },
  card: {
    backgroundColor: "#1C1C2E",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#2A2A40",
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#FFFFFF",
    flex: 1,
    marginRight: 8,
  },
  badge: {
    backgroundColor: "#4caf5020",
    borderColor: "#4caf50",
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  badgeText: {
    color: "#4caf50",
    fontSize: 10,
    fontWeight: "bold",
  },
  details: {
    color: "#8E8E9F",
    fontSize: 14,
    marginBottom: 8,
  },
  description: {
    color: "#5C5C77",
    fontSize: 12,
    marginBottom: 16,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: "#2A2A40",
    paddingTop: 12,
  },
  players: {
    color: "#8E8E9F",
    fontSize: 12,
  },
  manageText: {
    color: "#FF1A1A",
    fontWeight: "bold",
    fontSize: 14,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 100,
  },
  emptyText: {
    color: "#8E8E9F",
    fontSize: 16,
  },
});
