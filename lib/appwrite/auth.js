import { Client, Account, ID } from "react-native-appwrite";
import client from "./client";

class AuthService {
  account = new Account(client);

  // Create new account
  async createAccount({ email, password, name, phone }) {
    // 1️⃣ Create user
    const account = await this.account.create(ID.unique(), email, password, name);
    console.log("Account created:", account);
    // 2️⃣ Store phone in prefs
//     if (phone) {
//       await this.account.updatePhone({
//     phone: phone,
//     password: password
// });
//     }

    // 3️⃣ Login immediately after creation
    await this.login({ email, password });
    console.log("Logged in after account creation : ", account);
    return account;
  }

  // Login
  async login({ email, password }) {
    return this.account.createEmailPasswordSession(email, password);
  }

  // Get current logged-in user
  async getCurrentUser() {
    return this.account.get();
  }

  // Logout
  async logout() {
    const sessions = await this.account.listSessions();
    // Delete current session
    if (sessions.total > 0) {
      const currentSession = sessions.sessions[0]; // current device
      return this.account.deleteSession(currentSession.$id);
    }
  }
}

export default new AuthService();
