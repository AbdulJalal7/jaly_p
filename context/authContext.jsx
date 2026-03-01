import { createContext, useContext, useEffect, useState } from "react";
import authService from "../lib/appwrite/auth";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // 🔥 Check session when app loads
  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    try {
      const currentUser = await authService.getCurrentUser();
      setUser(currentUser);
    } catch (error) {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    const session = await authService.login({ email, password });
    const currentUser = await authService.getCurrentUser();
    setUser(currentUser);
    return session;
  };

  const register = async (data) => {
    const account = await authService.createAccount(data);
    const currentUser = await authService.getCurrentUser();
    setUser(currentUser);
    return account;
  };

  const logout = async () => {
    await authService.logout();
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{ user, loading, login, register, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);