import { View, Text, TouchableOpacity } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";

export default function Success() {
  const router = useRouter();
  const { id } = useLocalSearchParams();

  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      
      <Text style={{ fontSize: 22, fontWeight: "bold" }}>
        🎉 Tournament Joined
      </Text>

      <Text style={{ marginTop: 10 }}>
        Your payment is under verification.
      </Text>

      <TouchableOpacity
        style={{
          marginTop: 30,
          padding: 12,
          backgroundColor: "#4CAF50",
          borderRadius: 8,
        }}
        onPress={() =>
          router.replace({
            pathname: "/(details)/details",
            params: { id },
          })
        }
      >
        <Text style={{ color: "white" }}>Back to Tournament</Text>
      </TouchableOpacity>

    </View>
  );
}