import { createContext, useContext, useEffect, useState } from "react";
import * as SecureStore from "expo-secure-store";
import authService from "../lib/appwrite/auth";
import client from "../lib/appwrite/client";
import { savePushToken } from "../lib/notifications";

const AuthContext = createContext();

const STORAGE_KEY = "user_session";
const DATABASE_ID = process.env.EXPO_PUBLIC_APPWRITE_DATABASE_ID;
const USERS_COLLECTION_ID = "users";

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // console.log("user : ",user);
    restoreSession();
    // console.log("user after getssssssssss : ",user);

  }, []);

  // 🔴 Appwrite Realtime Subscription
  useEffect(() => {
    if (!user || (!user.$id)) return;

    // console.log("Subscribing to Realtime events for user:", user.$id);
    const unsubscribe = client.subscribe(
      `databases.${DATABASE_ID}.collections.${USERS_COLLECTION_ID}.documents.${user.$id}`,
      (response) => {
        // When an update event occurs to this document, immediately patch the React state
        if (
          response.events.includes(
            `databases.${DATABASE_ID}.collections.${USERS_COLLECTION_ID}.documents.${user.$id}.update`
          )
        ) {
          // console.log("Realtime user update received:", response.payload);
          setUser((prevUser) => ({
            ...prevUser,
            ...response.payload,
          }));
        }
      }
    );

    return () => unsubscribe();
  }, [user?.$id]);

  // 🔐 Restore session from secure storage
  const restoreSession = async () => {
    try {
      const storedUser = await SecureStore.getItemAsync(STORAGE_KEY);

      if (storedUser) {
        const currentUser = await authService.getCurrentUser();
        setUser(currentUser);
        // Refresh push token on every app open
        savePushToken(currentUser.$id);
      }
    } catch (error) {
      // console.log("Session restore failed", error);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    await authService.login({ email, password });
    const currentUser = await authService.getCurrentUser();

    setUser(currentUser);
    savePushToken(currentUser.$id);

    await SecureStore.setItemAsync(
      STORAGE_KEY,
      JSON.stringify(currentUser)
    );
  };

  const register = async (data) => {
    await authService.createAccount(data);
    const currentUser = await authService.getCurrentUser();

    setUser(currentUser);
    savePushToken(currentUser.$id);

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