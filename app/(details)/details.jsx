import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  ScrollView,
  Alert,
} from "react-native";
import { useFocusEffect } from "expo-router";
import { useEffect, useState,useCallback } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import tournamentService from "../../lib/appwrite/database";
import { Query } from "react-native-appwrite";
import { useAuth } from "../../context/authContext";
import client from "../../lib/appwrite/client";
import { Databases } from 'react-native-appwrite';
import resultsService from "../../lib/appwrite/results";


const DATABASE_ID = "6992ce540025a687a83e";
const PARTICIPANTS_COLLECTION_ID = "tournament_participants";
const user_COLLECTION_ID = "users";


export default function TournamentDetails() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { user } = useAuth();
  const databases = new Databases(client);

  const [tournament, setTournament] = useState(null);
  const [loading, setLoading] = useState(true);

  const [joined, setJoined] = useState(false);
  const [joinStatus, setJoinStatus] = useState(null);

  // Results State
  const [activeTab, setActiveTab] = useState("overview"); // "overview" | "results"
  const [results, setResults] = useState([]);
  const [fetchingResults, setFetchingResults] = useState(false);

  useEffect(() => {
    if (id) {
      console.log("Fetching tournament details for ID:", id);
      fetchTournament();
      fetchLeaderboard();
    }
  }, [id]);

  useEffect(() => {
    if (user && id) {
      console.log("User and tournament ID available, checking join status...");
      checkIfJoined();
    }
  }, [user, id]);

  useFocusEffect(
    useCallback(() => {
      if (id) {
        fetchTournament();
        fetchLeaderboard();
      }
      if (user && id) checkIfJoined();
    }, [id, user])
  );

  const fetchLeaderboard = async () => {
    try {
      setFetchingResults(true);
      const res = await resultsService.getTournamentResults(id);
      setResults(res);
    } catch (error) {
      console.log("Failed to fetch results", error);
    } finally {
      setFetchingResults(false);
    }
  };

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

  const checkIfJoined = async () => {
    console.log("Checking if user has joined tournament... User ID:", user.$id, "Tournament ID:", id);
    try {
      const userIds=await databases.listDocuments(
        DATABASE_ID,
        user_COLLECTION_ID,
        [
        Query.equal("user_id", user.$id)
      ]
        
      );
      console.log("Userssssssssssssssssssssssssss document fetched for ID:", userIds.documents[0]);
      const userId_get=userIds.documents[0];
      const res = await databases.listDocuments(
        DATABASE_ID,
        PARTICIPANTS_COLLECTION_ID,
        [
          Query.equal("tournament_id", id),
          Query.equal("user_id", userId_get.$id),
        ]
      );
      console.log("Checking join status for res   :", res);

      console.log("Join check result:", res.documents.length);
      if (res.documents.length > 0) {
        setJoined(true);
        setJoinStatus(res.documents[0].payment_status);
      }
      else{
        setJoined(false);
        setJoinStatus(null);
      }
      console.log("Join status:", joinStatus);
    } catch (error) {
      console.log("Join check error:", error);
    }
  };

  const handleJoinPress = () => {
    router.push({
      pathname: "/(details)/join",
      params: { id: tournament.$id },
    });
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

  const renderStatusText = () => {
    if (joinStatus === "pending") return "⏳ Pending Verification";
    if (joinStatus === "verified") return "✅ Joined";
    if (joinStatus === "rejected") return "❌ Rejected";
    // return "Joined";
  };

  return (
    <SafeAreaView style={{ flex: 1 }}>
      {/* Top Toggle Nav (Visible only if tournament is completed) */}
      {tournament.status === "completed" && (
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tabButton, activeTab === "overview" && styles.activeTabButton]}
            onPress={() => setActiveTab("overview")}
          >
            <Text style={[styles.tabText, activeTab === "overview" && styles.activeTabText]}>Overview</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tabButton, activeTab === "results" && styles.activeTabButton]}
            onPress={() => setActiveTab("results")}
          >
            <Text style={[styles.tabText, activeTab === "results" && styles.activeTabText]}>Results</Text>
          </TouchableOpacity>
        </View>
      )}

      {activeTab === "overview" ? (
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

        {/* Game */}
        <View style={styles.section}>
          <Text style={styles.label}>Game</Text>
          <Text style={styles.value}>{tournament.game}</Text>
        </View>

        {/* Date */}
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
        <View style={{height: 40}} /> 
      </ScrollView>
      ) : (
        <ScrollView style={styles.container}>
           <Text style={styles.resultsHeader}>Leaderboard</Text>
           {fetchingResults ? (
             <ActivityIndicator size="large" color="#4caf50" style={{marginTop: 40}} />
           ) : results.length === 0 ? (
             <Text style={styles.noResultsText}>Results have not been published yet.</Text>
           ) : (
             <View style={styles.resultsList}>
                {/* Header Row */}
                <View style={styles.resultHeaderRow}>
                   <Text style={[styles.resultHeaderText, {width: 40}]}>#</Text>
                   <Text style={[styles.resultHeaderText, {flex: 1}]}>Team / Player</Text>
                   <Text style={[styles.resultHeaderText, {width: 60, textAlign: 'center'}]}>Kills</Text>
                   <Text style={[styles.resultHeaderText, {width: 60, textAlign: 'right'}]}>Prize</Text>
                </View>

                {results.map((res, index) => (
                  <View key={res.$id || index} style={styles.resultRow}>
                    <View style={styles.rankBadge}>
                      <Text style={styles.rankText}>{res.rank}</Text>
                    </View>
                    <View style={styles.teamInfo}>
                      <Text style={styles.teamNameText} numberOfLines={1}>{res.team_name || "Unknown"}</Text>
                      {res.game_id && <Text style={styles.gameIdText}>{res.game_id}</Text>}
                    </View>
                    <Text style={styles.killsText}>{res.kills_score || 0}</Text>
                    <Text style={styles.prizeText}>₹{res.prize || 0}</Text>
                  </View>
                ))}
                <View style={{height: 40}} />
             </View>
           )}
        </ScrollView>
      )}

      {/* Footer Button (Only show in Overview) */}
      {activeTab === "overview" && (
        <View style={[styles.footer, tournament.status === "completed" ? { paddingTop: 0 } : {}]}>

        {!joined ? (
          <TouchableOpacity
            style={[
              styles.joinButton,
              { backgroundColor: isFull ? "#555" : "#4caf50" },
            ]}
            disabled={isFull}
            onPress={handleJoinPress}
          >
            <Text style={styles.joinText}>
              {isFull ? "Tournament Full" : "Join Tournament"}
            </Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.joinButton, { backgroundColor: "#2196F3" }]}
            disabled
          >
            <Text style={styles.joinText}>
              {renderStatusText()}
            </Text>
          </TouchableOpacity>
        )}


       

      </View>
      )}
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
  tabContainer: {
    flexDirection: "row",
    backgroundColor: "#1e1e1e",
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
    padding: 4,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
    borderRadius: 8,
  },
  activeTabButton: {
    backgroundColor: "#4caf50",
  },
  tabText: {
    color: "#aaa",
    fontWeight: "600",
    fontSize: 16,
  },
  activeTabText: {
    color: "#fff",
  },
  resultsHeader: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 16,
    marginTop: 8,
  },
  noResultsText: {
    color: "#aaa",
    textAlign: "center",
    marginTop: 40,
    fontSize: 16,
  },
  resultsList: {
    backgroundColor: "#1e1e1e",
    borderRadius: 12,
    overflow: "hidden",
  },
  resultHeaderRow: {
    flexDirection: "row",
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: "#2a2a2a",
    borderBottomWidth: 1,
    borderBottomColor: "#333",
  },
  resultHeaderText: {
    color: "#aaa",
    fontSize: 12,
    fontWeight: "bold",
    textTransform: "uppercase",
  },
  resultRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#2a2a2a",
  },
  rankBadge: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "#ff9800",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
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
    width: 60,
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
  },
  prizeText: {
    width: 60,
    color: "#4caf50",
    fontSize: 16,
    fontWeight: "bold",
    textAlign: "right",
  },
});