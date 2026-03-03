import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  ScrollView,
  Alert,
} from "react-native";
import { useEffect, useState } from "react";
import { useLocalSearchParams } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import tournamentService from "../../../lib/appwrite/database";

export default function TournamentDetails() {
  const { id } = useLocalSearchParams();

  const [tournament, setTournament] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTournament();
  }, []);

  const fetchTournament = async () => {
    try {
      const response = await tournamentService.getTournament(id);
      setTournament(response);
    } catch (error) {
      console.log(error);
      Alert.alert("Error", "Failed to load tournament details");
    } finally {
      setLoading(false);
    }
  };

  const handleJoinPress = () => {
    Alert.alert("Join", "Proceed to payment & registration flow");
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (!tournament) {
    return (
      <View style={styles.center}>
        <Text style={{ color: "#fff" }}>Tournament not found</Text>
      </View>
    );
  }

  const slotsLeft =
    tournament.maxPlayers - (tournament.currentPlayers || 0);

  const isFull = slotsLeft <= 0;

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <ScrollView style={styles.container}>
        
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>{tournament.title}</Text>
          <View
            style={[
              styles.statusBadge,
              {
                backgroundColor:
                  tournament.status === "upcoming"
                    ? "#4caf50"
                    : "#f44336",
              },
            ]}
          >
            <Text style={styles.statusText}>
              {tournament.status?.toUpperCase()}
            </Text>
          </View>
        </View>

        {/* Game & Date */}
        <View style={styles.section}>
          <Text style={styles.label}>Game</Text>
          <Text style={styles.value}>{tournament.game}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Starting Time</Text>
          <Text style={styles.value}>
            {new Date(tournament.startDate).toLocaleString()}
          </Text>
        </View>

        {/* Entry & Prize */}
        <View style={styles.row}>
          <View style={styles.infoCard}>
            <Text style={styles.infoLabel}>Entry Fee</Text>
            <Text style={styles.infoValue}>
              ₹{tournament.enteryFee}
            </Text>
          </View>

          <View style={styles.infoCard}>
            <Text style={styles.infoLabel}>Prize Pool</Text>
            <Text style={styles.infoValue}>
              ₹{tournament.prize}
            </Text>
          </View>
        </View>

        {/* Slots */}
        <View style={styles.section}>
          <Text style={styles.label}>Players</Text>
          <Text style={styles.value}>
            {tournament.currentPlayers || 0} / {tournament.maxPlayers}
          </Text>
          <Text style={{ color: "#aaa", marginTop: 4 }}>
            {isFull ? "Tournament Full" : `${slotsLeft} Slots Left`}
          </Text>
        </View>

        {/* Description */}
        <View style={styles.section}>
          <Text style={styles.label}>Description</Text>
          <Text style={styles.description}>
            {tournament.description}
          </Text>
        </View>

        {/* Rules */}
        <View style={styles.section}>
          <Text style={styles.label}>Rules</Text>
          <Text style={styles.description}>
            {tournament.rules || "Rules will be shared before match."}
          </Text>
        </View>

      </ScrollView>

      {/* Join Button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[
            styles.joinButton,
            {
              backgroundColor: isFull ? "#555" : "#4caf50",
            },
          ]}
          disabled={isFull}
          onPress={handleJoinPress}
        >
          <Text style={styles.joinText}>
            {isFull ? "Tournament Full" : "Join Tournament"}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#121212",
    padding: 16,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#121212",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#fff",
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "bold",
  },
  section: {
    marginTop: 20,
  },
  label: {
    fontSize: 14,
    color: "#aaa",
  },
  value: {
    fontSize: 16,
    color: "#fff",
    marginTop: 4,
  },
  description: {
    color: "#ccc",
    marginTop: 6,
    lineHeight: 20,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 20,
  },
  infoCard: {
    backgroundColor: "#1e1e1e",
    flex: 0.48,
    padding: 14,
    borderRadius: 12,
  },
  infoLabel: {
    color: "#aaa",
    fontSize: 13,
  },
  infoValue: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
    marginTop: 6,
  },
  footer: {
    paddingTop: 10,
    padding: 16,
    backgroundColor: "#121212",
  },
  joinButton: {
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  joinText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
});