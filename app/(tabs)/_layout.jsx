import { Tabs } from "expo-router";
import { useAuth } from "../../context/authContext";

export default function TabsLayout() {
  const { user } = useAuth();
  const isAdmin = user?.labels?.includes("admin");

  console.log("Is admin : ",isAdmin);
  return (
    <Tabs screenOptions={{ headerShown: false }}>
      <Tabs.Screen name="home/index" options={{ title: "Home" }} />
      <Tabs.Screen name="tournament" options={{ title: "Tournament" }} />
      <Tabs.Screen name="profile" options={{ title: "Profile" }} />

      <Tabs.Screen 
        name="challenges/index"  
        options={{ title: "1v1", href: "/challenges" }} 
      />
      <Tabs.Screen 
        name="challenges/create"  
        options={{ title: "Create Challenge", href: null }} 
      />
      <Tabs.Screen 
        name="challenges/my_challenges"  
        options={{ title: "My Challenges", href: null }} 
      />
      <Tabs.Screen 
        name="wallet/index"  
        options={{ 
          title: "Wallet",
          href: "/wallet" 
        }} 
      />
      <Tabs.Screen 
        name="wallet/deposit"  
        options={{ 
          title: "Deposit",
          href: null 
        }} 
      />
      <Tabs.Screen 
        name="wallet/withdraw"  
        options={{ 
          title: "Withdraw",
          href: null 
        }} 
      />
 
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
        name="admin/wallet_requests"  
        options={{ 
          title: "Wallet Requests",
          href: isAdmin ? "/admin/wallet_requests" : null
        }} 
      />
      <Tabs.Screen 
        name="admin/publish_results"  
        options={{ 
          title: "Publish Results",
          href: null
        }} 
      />
      <Tabs.Screen 
        name="admin/challenges"  
        options={{ 
          title: "1v1 Admin",
          href: isAdmin ? "/admin/challenges" : null
        }} 
      />
    </Tabs>
  );
}