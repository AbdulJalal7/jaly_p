import { Tabs } from "expo-router";
import { useAuth } from "../../context/authContext";
import { Ionicons } from "@expo/vector-icons";

export default function TabsLayout() {
  const { user } = useAuth();
  const isAdmin = user?.labels?.includes("admin");

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: { backgroundColor: "#121212", borderTopColor: "#2a2a2a" },
        tabBarActiveTintColor: "#FF3366",
        tabBarInactiveTintColor: "#888",
      }}
    >
      <Tabs.Screen
        name="home/index"
        options={{
          title: "Home",
          tabBarIcon: ({ color, size }) => <Ionicons name="home" color={color} size={size} />,
        }}
      />
    <Tabs.Screen
      name="tournament/index"
      options={{
        title: "Challenges",
        tabBarIcon: ({ color, size }) => <Ionicons name="game-controller" color={color} size={size} />,
      }}
    />
    <Tabs.Screen
      name="challenges/index"
      options={{
        title: "1v1",
        href: "/challenges",
        tabBarIcon: ({ color, size }) => <Ionicons name="game-controller" color={color} size={size} />,
      }}
    />
      <Tabs.Screen
        name="wallet/index"
        options={{
          title: "Wallet",
          href: "/wallet",
          tabBarIcon: ({ color, size }) => <Ionicons name="wallet" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="profile/index"
        options={{
          title: "Profile",
          tabBarIcon: ({ color, size }) => <Ionicons name="person" color={color} size={size} />,
        }}
      />

      {/* Single Admin Tab — only visible to admins */}
      <Tabs.Screen
        name="admin/dashboard"
        options={{
          title: "Admin",
          href: isAdmin ? "/admin/dashboard" : null,
          tabBarIcon: ({ color, size }) => <Ionicons name="shield" color={color} size={size} />,
        }}
      />

      {/* Hidden sub-screens (not shown in tab bar) */}
      <Tabs.Screen name="challenges/create" options={{ title: "Create Challenge", href: null }} />
      <Tabs.Screen name="challenges/my_challenges" options={{ title: "My Challenges", href: null }} />
      <Tabs.Screen name="wallet/deposit" options={{ title: "Deposit", href: null }} />
      <Tabs.Screen name="wallet/withdraw" options={{ title: "Withdraw", href: null }} />
      <Tabs.Screen name="admin/index" options={{ title: "Admin Support", href: null }} />
      <Tabs.Screen name="admin/tournaments" options={{ title: "Manage Tournaments", href: null }} />
      <Tabs.Screen name="admin/wallet_requests" options={{ title: "Wallet Requests", href: null }} />
      <Tabs.Screen name="admin/publish_results" options={{ title: "Publish Results", href: null }} />
      <Tabs.Screen name="admin/challenges" options={{ title: "1v1 Admin", href: null }} />
    </Tabs>
  );
}