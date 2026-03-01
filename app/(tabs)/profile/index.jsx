import { useAuth } from "../../../context/authContext";
import { useRouter } from "expo-router";

const Profile = () => {
  const { logout } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
    router.replace("/(auth)/login");
  };
};