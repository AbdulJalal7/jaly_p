import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
} from "react-native";
import { useState, useCallback } from "react";
import { useRouter, useFocusEffect } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import participantService from "../../../lib/appwrite/participants";
import tournamentService from "../../../lib/appwrite/database";
import { useAuth } from "../../../context/authContext";

export default function MyTournaments() {
  const router = useRouter();
  const { user } = useAuth();

  const [tournaments, setTournaments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchMyTournaments = async () => {
    if (!user) {
      setLoading(false);
      setRefreshing(false);
      return;
    }

    try {
      // 1. Fetch user's participation records
      const participations = await participantService.getUserParticipations(user.$id);
      
      if (participations.length === 0) {
        setTournaments([]);
      } else {
        // 2. Map and fetch details for each tournament
        const tournamentDetailsPromises = participations.map(async (p) => {
          try {
            const tDetails = await tournamentService.getTournament(p.tournament_id);
            return {
              ...tDetails,
              payment_status: p.payment_status,
              participation_date: p.$createdAt,
            };
          } catch (err) {
            console.log("Error fetching tournament detail:", err);
            return null; // Skip if tournament details completely fail
          }
        });

        const fullDetails = await Promise.all(tournamentDetailsPromises);
        
        // Remove nulls and sort by participation date (newest first)
        const validTournaments = fullDetails
          .filter(Boolean)
          .sort((a, b) => new Date(b.participation_date) - new Date(a.participation_date));

        setTournaments(validTournaments);
      }
    } catch (error) {
      console.log("Failed to load my tournaments:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      fetchMyTournaments();
    }, [user])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchMyTournaments();
  };

  const getPaymentStatusBadge = (status) => {
    switch (status) {
      case "verified":
        return { label: "Verified", bgColor: "#4caf50", color: "#fff" };
      case "pending":
        return { label: "Pending", bgColor: "#ff9800", color: "#fff" };
      case "rejected":
        return { label: "Rejected", bgColor: "#f44336", color: "#fff" };
      default:
        return { label: "Unknown", bgColor: "#555", color: "#fff" };
    }
  };

  const getTournamentStatusBadge = (status) => {
    switch (status?.toLowerCase()) {
      case "upcoming":
        return { label: "Upcoming", bgColor: "#2196F3" };
      case "ongoing":
        return { label: "Ongoing", bgColor: "#ff9800" };
      case "completed":
        return { label: "Completed", bgColor: "#9e9e9e" };
      default:
        return { label: status?.toUpperCase() || "UNKNOWN", bgColor: "#555" };
    }
  };

  const renderTournament = ({ item }) => {
    const paymentBadge = getPaymentStatusBadge(item.payment_status);
    const tournamentBadge = getTournamentStatusBadge(item.status);

    return (
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.9}
        onPress={() =>
          router.push({
            pathname: "/(details)/details",
            params: { id: item.$id },
          })
        }
      >
        <View style={styles.headerRow}>
          <Text style={styles.title} numberOfLines={1}>
            {item.title}
          </Text>
          <View style={[styles.badge, { backgroundColor: tournamentBadge.bgColor }]}>
             <Text style={styles.badgeText}>{tournamentBadge.label}</Text>
          </View>
        </View>

        <Text style={styles.gameText}>{item.game}</Text>

        <View style={styles.footerRow}>
          <View style={[styles.paymentBadge, { backgroundColor: paymentBadge.bgColor }]}>
             <Text style={[styles.paymentBadgeText, { color: paymentBadge.color }]}>
               {paymentBadge.label}
             </Text>
          </View>

          <Text style={styles.date}>
            Joined: {new Date(item.participation_date).toLocaleDateString()}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#4caf50" />
      </View>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#121212" }}>
      <View style={styles.container}>
        <Text style={styles.headerTitle}>My Tournaments</Text>
        
        <FlatList
          data={tournaments}
          keyExtractor={(item, index) => item.$id || index.toString()}
          renderItem={renderTournament}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#4caf50"
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>You haven't joined any tournaments yet.</Text>
            </View>
          }
          contentContainerStyle={{ paddingBottom: 20 }}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 20,
    marginTop: 10,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#121212",
  },
  card: {
    backgroundColor: "#1e1e1e",
    borderRadius: 16,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#333",
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 4,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#fff",
    flex: 1,
    marginRight: 10,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  badgeText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "bold",
    textTransform: "uppercase",
  },
  gameText: {
    color: "#aaa",
    fontSize: 14,
    marginBottom: 16,
  },
  footerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  paymentBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  paymentBadgeText: {
    fontSize: 12,
    fontWeight: "600",
  },
  date: {
    color: "#888",
    fontSize: 12,
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    marginTop: 50,
  },
  emptyText: {
    color: "#aaa",
    fontSize: 16,
    textAlign: "center",
  },
});
