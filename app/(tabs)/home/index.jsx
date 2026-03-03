import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
  Alert,
} from "react-native";
import { useEffect, useState } from "react";
import { useRouter } from "expo-router";
import tournamentService from "../../../lib/appwrite/database";
import { SafeAreaView } from "react-native-safe-area-context";


export default function Home() {
  const router = useRouter();

  const [tournaments, setTournaments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchTournaments();
  }, []);

  const fetchTournaments = async () => {
    try {
      const response = await tournamentService.getTournaments();
      setTournaments(response.documents);
    } catch (error) {
      console.log(error);
      Alert.alert("Error", "Failed to load tournaments");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchTournaments();
  };

  const renderTournament = ({ item }) => (
  <TouchableOpacity
    style={styles.card}
    activeOpacity={0.9}
    onPress={() =>
      router.push({
        pathname: "/(tabs)/home/details",
        params: { id: item.$id },
      })
    }
  >
    {/* Header */}
    <View style={styles.headerRow}>
      <View style={styles.gameBadge}>
        <Text style={styles.gameBadgeText}>{item.game}</Text>
      </View>

      <Text style={styles.date}>📅 {new Date(item.$createdAt).toLocaleString().slice(0, 15)}</Text>
    </View>

    {/* Title */}
    <Text style={styles.title}>{item.title}</Text>

    {/* Description Section */}
    <View style={styles.descriptionContainer}>
      <Text style={styles.prize}>{item.description}</Text>
    </View>

    {/* Footer Row */}
    {/* {console.log("FFFFFFFF : " ,item.enteryFee)} */}
    <View style={styles.entryBadge}>
        <Text >Starting Time : {new Date(item.$createdAt).toLocaleString().slice(0, 15)}</Text>
        <Text >Total Player : {item.maxPlayers}</Text>

      </View>
{/* 
    <View style={styles.totalplayerBadge}>
        <Text >Total Player : {item.maxPlayers}</Text>
      </View> */}
    <View style={styles.footerRow}>
        
      <View style={styles.entryBadge}>
        <Text style={styles.entryText}>Entry Fee {item.enteryFee}</Text>
      </View>

      <View style={styles.joinButton}>
        <Text style={styles.joinText}>View Details</Text>
      </View>
    </View>
  </TouchableOpacity>
);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
       <SafeAreaView style={{ flex: 1 }}>
    
    <View style={styles.container}>
      <FlatList
        data={tournaments}
        keyExtractor={(item) => item.$id}
        renderItem={renderTournament}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.center}>
            <Text style={{ fontSize: 16 }}>No tournaments available</Text>
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
    padding: 14,
    backgroundColor: "rgba(161, 118, 216, 0.57)",
  },

  card: {
    backgroundColor: "#e6c173",
    borderRadius: 18,
    padding: 18,
    marginBottom: 18,
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },

  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  gameBadge: {
    backgroundColor: "#2e2e2e",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },

  gameBadgeText: {
    color: "#4caf50",
    fontWeight: "600",
    fontSize: 12,
  },

  date: {
    color: "#aaa",
    fontSize: 12,
  },

  title: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#fff",
    marginTop: 12,
  },

  descriptionContainer: {
    marginTop: 10,
  },

  prizeLabel: {
    color: "#888",
    fontSize: 12,
  },

  prize: {
    // fontSize: 26,
    // fontWeight: "bold",
    color: "#fff",
    marginTop: 4,
  },

  footerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 18,
  },

  entryBadge: {
    backgroundColor: "#fff",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 14,
  },

  totalplayerBadge: {
    backgroundColor: "#fff",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
  },

  entryText: {
    color: "#ff9800",
    fontWeight: "600",
  },

  joinButton: {
    backgroundColor: "#4caf50",
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 14,
  },

  joinText: {
    color: "#fff",
    fontWeight: "bold",
  },

  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});