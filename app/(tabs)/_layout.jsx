import { Tabs } from "expo-router";
import { useAuth } from "../../context/authContext";

export default function TabsLayout() {
  const { user } = useAuth();
  const isAdmin = user?.labels?.includes("admin");
  console.log("Is admin : ",isAdmin);
  return (
    <Tabs screenOptions={{ headerShown: false }}>
      <Tabs.Screen name="home" options={{ title: "Home" }} />
      <Tabs.Screen name="tournament" options={{ title: "Tournament" }} />
      <Tabs.Screen name="profile" options={{ title: "Profile" }} />
      {isAdmin && (
        <Tabs.Screen name="admin_support" options={{ title: "Admin Support" }} />
      )}
    </Tabs>
  );
}