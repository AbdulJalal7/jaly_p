import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  FlatList,
} from "react-native";
import { useState, useCallback } from "react";
import { useLocalSearchParams, useRouter, useFocusEffect } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import Toast from 'react-native-toast-message';
import resultsService from "../../../lib/appwrite/results";
import tournamentService from "../../../lib/appwrite/database";

export default function PublishResults() {
  const { id } = useLocalSearchParams(); // tournament ID
  const router = useRouter();

  const [tournament, setTournament] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [existingResults, setExistingResults] = useState([]);

  // Form State
  const [rank, setRank] = useState("");
  const [teamName, setTeamName] = useState("");
  const [gameId, setGameId] = useState("");
  const [kills, setKills] = useState("");
  const [prize, setPrize] = useState("");

  useFocusEffect(
    useCallback(() => {
      if (id) {
        fetchData();
      }
    }, [id])
  );

  const fetchData = async () => {
    try {
      setLoading(true);
      const [tData, rData] = await Promise.all([
        tournamentService.getTournament(id),
        resultsService.getTournamentResults(id),
      ]);
      setTournament(tData);
      setExistingResults(rData);
      
      // Auto-increment rank based on existing
      if (rData.length > 0) {
        setRank((rData.length + 1).toString());
      } else {
        setRank("1");
      }
    } catch (error) {
      console.log(error);
      Toast.show({ type: 'error', text1: 'Error', text2: 'Failed to load tournament data.' });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!rank || !teamName) {
      Toast.show({ type: 'error', text1: 'Error', text2: 'Rank and Team Name are required fields.' });
      return;
    }

    try {
      setSubmitting(true);
      await resultsService.createResult({
        tournamentId: id,
        teamName,
        gameId: gameId || null,
        rank: parseInt(rank),
        killsScore: kills ? parseInt(kills) : 0,
        prize: prize ? parseFloat(prize) : 0,
      });

      // Clear specific form fields to prepare for the next entry
      setTeamName("");
      setGameId("");
      setKills("");
      setPrize("");
      
      // Refresh list and auto-increment rank
      await fetchData();

    } catch (error) {
      console.log(error);
      Toast.show({ type: 'error', text1: 'Error', text2: 'Failed to publish result.' });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading && !tournament) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#4caf50" />
      </View>
    );
  }

  const renderResultItem = ({ item }) => (
    <View style={styles.resultRow}>
      <View style={styles.rankBadge}>
        <Text style={styles.rankText}>{item.rank}</Text>
      </View>
      <View style={styles.teamInfo}>
        <Text style={styles.teamNameText} numberOfLines={1}>{item.team_name}</Text>
        {item.game_id && <Text style={styles.gameIdText}>{item.game_id}</Text>}
      </View>
      <Text style={styles.killsText}>{item.kills_score} Kills</Text>
      <Text style={styles.prizeText}>₹{item.prize}</Text>
    </View>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#121212" }}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.replace("/(tabs)/admin/tournaments")}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          Publish Results: {tournament?.title}
        </Text>
      </View>

      <View style={styles.container}>
        {/* Form Section */}
        <View style={styles.formCard}>
          <Text style={styles.sectionTitle}>Add New Entry</Text>
          
          <View style={styles.row}>
            <View style={[styles.inputGroup, { flex: 0.3 }]}>
              <Text style={styles.label}>Rank *</Text>
              <TextInput
                style={styles.input}
                placeholder="1"
                placeholderTextColor="#777"
                keyboardType="numeric"
                value={rank}
                onChangeText={setRank}
              />
            </View>
            <View style={[styles.inputGroup, { flex: 0.7, marginLeft: 12 }]}>
              <Text style={styles.label}>Team Name *</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Squad Alpha"
                placeholderTextColor="#777"
                value={teamName}
                onChangeText={setTeamName}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>In-Game ID (Optional)</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. PlayerOne"
              placeholderTextColor="#777"
              value={gameId}
              onChangeText={setGameId}
            />
          </View>

          <View style={styles.row}>
            <View style={[styles.inputGroup, { flex: 0.5 }]}>
              <Text style={styles.label}>Kills</Text>
              <TextInput
                style={styles.input}
                placeholder="0"
                placeholderTextColor="#777"
                keyboardType="numeric"
                value={kills}
                onChangeText={setKills}
              />
            </View>
            <View style={[styles.inputGroup, { flex: 0.5, marginLeft: 12 }]}>
              <Text style={styles.label}>Prize (₹)</Text>
              <TextInput
                style={styles.input}
                placeholder="0"
                placeholderTextColor="#777"
                keyboardType="numeric"
                value={prize}
                onChangeText={setPrize}
              />
            </View>
          </View>

          <TouchableOpacity
            style={styles.submitButton}
            onPress={handleSubmit}
            disabled={submitting}
          >
            {submitting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.submitText}>Publish Rank {rank}</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Existing Results List */}
        <View style={styles.listContainer}>
          <Text style={styles.sectionTitle}>Uploaded Leaderboard</Text>
          {existingResults.length === 0 ? (
            <Text style={styles.emptyText}>No results published yet.</Text>
          ) : (
            <FlatList
              data={existingResults}
              keyExtractor={(item) => item.$id}
              renderItem={renderResultItem}
              contentContainerStyle={{ paddingBottom: 20 }}
            />
          )}
        </View>

      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
    alignItems: "center",
    padding: 16,
    backgroundColor: "#1a1a1a",
    borderBottomWidth: 1,
    borderBottomColor: "#333",
  },
  backBtn: {
    marginRight: 16,
  },
  backText: {
    color: "#4caf50",
    fontSize: 16,
    fontWeight: "bold",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#fff",
    flex: 1,
  },
  formCard: {
    backgroundColor: "#1e1e1e",
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#333",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 16,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    color: "#aaa",
    marginBottom: 6,
    fontSize: 14,
  },
  input: {
    backgroundColor: "#2a2a2a",
    padding: 14,
    borderRadius: 10,
    color: "#fff",
    fontSize: 16,
  },
  submitButton: {
    backgroundColor: "#4caf50",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 8,
  },
  submitText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  listContainer: {
    flex: 1,
  },
  emptyText: {
    color: "#777",
    textAlign: "center",
    marginTop: 20,
    fontStyle: "italic",
  },
  resultRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1e1e1e",
    padding: 16,
    borderRadius: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#333",
  },
  rankBadge: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "#ff9800",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  rankText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 14,
  },
  teamInfo: {
    flex: 1,
    justifyContent: "center",
  },
  teamNameText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  gameIdText: {
    color: "#aaa",
    fontSize: 12,
    marginTop: 2,
  },
  killsText: {
    color: "#aaa",
    fontSize: 14,
    marginRight: 16,
  },
  prizeText: {
    color: "#4caf50",
    fontSize: 16,
    fontWeight: "bold",
  },
});
