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
 
      <Tabs.Screen 
        name="admin/index"  
        options={{ 
          title: "Admin Support",
          href: isAdmin ? "/admin" : null
        }} 
      />

      <Tabs.Screen 
        name="admin/tournaments"  
        options={{ 
          title: "Manage Tournaments",
          href: isAdmin ? "/admin/tournaments" : null
        }} 
      />
      <Tabs.Screen 
        name="admin/publish_results"  
        options={{ 
          title: "Publish Results",
          href: null
        }} 
      />
    </Tabs>
  );
}