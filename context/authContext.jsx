import { createContext, useContext, useEffect, useState } from "react";
import * as SecureStore from "expo-secure-store";
import authService from "../lib/appwrite/auth";

const AuthContext = createContext();

const STORAGE_KEY = "user_session";

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    restoreSession();
  }, []);

  // 🔐 Restore session from secure storage
  const restoreSession = async () => {
    try {
      const storedUser = await SecureStore.getItemAsync(STORAGE_KEY);

      if (storedUser) {
        const currentUser = await authService.getCurrentUser();
        setUser(currentUser);
      }
    } catch (error) {
      console.log("Session restore failed", error);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    await authService.login({ email, password });
    const currentUser = await authService.getCurrentUser();

    setUser(currentUser);

    await SecureStore.setItemAsync(
      STORAGE_KEY,
      JSON.stringify(currentUser)
    );
  };

  const register = async (data) => {
    await authService.createAccount(data);
    const currentUser = await authService.getCurrentUser();

    setUser(currentUser);

    await SecureStore.setItemAsync(
      STORAGE_KEY,
      JSON.stringify(currentUser)
    );
  };

  const logout = async () => {
    await authService.logout();
    setUser(null);
    await SecureStore.deleteItemAsync(STORAGE_KEY);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);