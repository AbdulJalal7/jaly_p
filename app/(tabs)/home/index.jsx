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
      onPress={() =>
        router.push({
          pathname: "/(tabs)/home/details",
          params: { id: item.$id },
        })
      }
    >
      <Text style={styles.title}>{item.title}</Text>
      <Text style={styles.game}>{item.game}</Text>
      <Text style={styles.date}>📅 {item.date}</Text>

      <View style={styles.row}>
        <Text style={styles.fee}>Entry: ₹{item.entryFee}</Text>
        <Text style={styles.prize}>Prize: ₹{item.prize}</Text>
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
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 12,
    backgroundColor: "#121212",
  },
  card: {
    backgroundColor: "#1e1e1e",
    padding: 16,
    borderRadius: 14,
    marginBottom: 14,
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#fff",
  },
  game: {
    color: "#aaa",
    marginTop: 4,
  },
  date: {
    marginTop: 6,
    color: "#ccc",
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 12,
  },
  fee: {
    color: "#ff9800",
    fontWeight: "600",
  },
  prize: {
    color: "#4caf50",
    fontWeight: "600",
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});