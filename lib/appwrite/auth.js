import { Client, Account, ID, Databases, Query, OAuthProvider } from "react-native-appwrite";
import { makeRedirectUri } from "expo-auth-session";
import * as WebBrowser from "expo-web-browser";
import * as Linking from "expo-linking";
import client from "./client";

WebBrowser.maybeCompleteAuthSession();

const DATABASE_ID = process.env.EXPO_PUBLIC_APPWRITE_DATABASE_ID;
const USERS_COLLECTION_ID = "users";

class AuthService {
  account = new Account(client);
  databases = new Databases(client);

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
    try {
      const currentAccount = await this.account.get();
      if (!currentAccount) throw Error;

      const currentUser = await this.databases.listDocuments(
        DATABASE_ID,
        USERS_COLLECTION_ID,
        [Query.equal("user_id", currentAccount.$id)]
      );

      if (currentUser.documents.length === 0) {
        try {
          const newUserDoc = await this.databases.createDocument(
            DATABASE_ID,
            USERS_COLLECTION_ID,
            ID.unique(),
            {
              user_id: currentAccount.$id,
              name: currentAccount.name || "User",
              email: currentAccount.email,
            }
          );
          return {
            ...currentAccount,
            ...newUserDoc,
          };
        } catch (createError) {
          console.log("Error creating database user:", createError);
          return currentAccount;
        }
      }

      return {
        ...currentAccount,
        ...currentUser.documents[0],
      };
    } catch (error) {
      console.log("Error getting current user: ", error);
      throw error;
    }
  }

  // OAuth Login
  async loginWithOAuth(provider) {
    try {
      // Use expo-linking to create a resilient deep link path 
      // This strictly generates exp://[host]/--/auth, which Expo Go natively recognizes
      // as an internal route and NOT an OTA update bundle download!
      const deepLinkUrl = Linking.createURL('auth');

      // Start the OAuth token generation via Appwrite
      const loginUrl = await this.account.createOAuth2Token(
        provider,
        deepLinkUrl,
        deepLinkUrl
      );

      // Open the browser session for authentication.
      const result = await WebBrowser.openAuthSessionAsync(
        loginUrl.toString(),
        deepLinkUrl
      );

      if (result.type !== 'success') {
          throw new Error('Login failed or was cancelled');
      }

      // Extract secret and userId from the Redirect URL
      const url = new URL(result.url);
      const secret = url.searchParams.get('secret');
      const userId = url.searchParams.get('userId');

      console.log("secret : ",secret);
      console.log("userId : ",userId);

      if (!secret || !userId) {
          throw new Error('Invalid authentication response');
      }

      // Create a fully authenticated session
      const session = await this.account.createSession(userId, secret);
      
      const user = await this.getCurrentUser();
      console.log('Logged in with OAuth:', user);
      
      return user;
    } catch (error) {
           console.log("Error with OAuth login: ", error);
      throw error;
    }
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
