import { View, Text, TouchableOpacity, StyleSheet, ScrollView, SafeAreaView } from "react-native";
import { useRouter } from "expo-router";

const ADMIN_SECTIONS = [
  {
    title: "🛡️ Support Tickets",
    description: "View and reply to user support tickets",
    route: "/admin",
  },
  {
    title: "🏆 Manage Tournaments",
    description: "Create, edit, and delete tournaments",
    route: "/admin/tournaments",
  },
  {
    title: "💰 Wallet Requests",
    description: "Approve or reject deposit/withdrawal requests",
    route: "/admin/wallet_requests",
  },
  {
    title: "🎮 1v1 Challenges",
    description: "Manage and resolve 1v1 challenge matches",
    route: "/admin/challenges",
  },
  {
    title: "📊 Publish Results",
    description: "Publish tournament results and prize payouts",
    route: "/admin/publish_results",
  },
  {
    title: "👥 Team Results",
    description: "Verify screenshots and declare team winners",
    route: "/admin/team_challenges",
  },
];

export default function AdminDashboard() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Admin Dashboard</Text>
        <Text style={styles.subtitle}>Manage your platform</Text>
      </View>

      <ScrollView contentContainerStyle={styles.grid}>
        {ADMIN_SECTIONS.map((section) => (
          <TouchableOpacity
            key={section.route}
            style={styles.card}
            onPress={() => router.push(section.route)}
            activeOpacity={0.75}
          >
            <Text style={styles.cardTitle}>{section.title}</Text>
            <Text style={styles.cardDescription}>{section.description}</Text>
            <Text style={styles.arrow}>→</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#121212",
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#2a2a2a",
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#fff",
  },
  subtitle: {
    fontSize: 14,
    color: "#888",
    marginTop: 4,
  },
  grid: {
    padding: 16,
    gap: 14,
  },
  card: {
    backgroundColor: "#1e1e1e",
    borderRadius: 14,
    padding: 20,
    borderWidth: 1,
    borderColor: "#2a2a2a",
    position: "relative",
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#fff",
    marginBottom: 6,
  },
  cardDescription: {
    fontSize: 13,
    color: "#888",
    lineHeight: 18,
  },
  arrow: {
    position: "absolute",
    right: 20,
    top: "50%",
    fontSize: 20,
    color: "#FF3366",
    marginTop: -12,
  },
});
