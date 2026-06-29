import { Client, Account, ID, Databases, Query, OAuthProvider, Storage, Permission, Role } from "react-native-appwrite";
import { makeRedirectUri } from "expo-auth-session";
import * as WebBrowser from "expo-web-browser";
import * as Linking from "expo-linking";
import client from "./client";

WebBrowser.maybeCompleteAuthSession();

const DATABASE_ID = process.env.EXPO_PUBLIC_APPWRITE_DATABASE_ID;
const USERS_COLLECTION_ID = "users";
const BUCKET_ID = process.env.EXPO_PUBLIC_APPWRITE_BUCKET_ID;
const APPWRITE_ENDPOINT = process.env.EXPO_PUBLIC_APPWRITE_ENDPOINT;
const APPWRITE_PROJECT = process.env.EXPO_PUBLIC_APPWRITE_PROJECT_ID;

class AuthService {
  account = new Account(client);
  databases = new Databases(client);
  storage = new Storage(client);

  // Create new account
  async createAccount({ email, password, name, phone }) {
    // 1️⃣ Create user
    const account = await this.account.create(ID.unique(), email, password, name);
    // console.log("Account created:", account);
    // 2️⃣ Store phone in prefs
//     if (phone) {
//       await this.account.updatePhone({
//     phone: phone,
//     password: password
// });
//     }

    // 3️⃣ Login immediately after creation
    await this.login({ email, password });
    // console.log("Logged in after account creation : ", account);
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
          // console.log("Error creating database user:", createError);
          return currentAccount;
        }
      }

      return {
        ...currentAccount,
        ...currentUser.documents[0],
      };
    } catch (error) {
      // console.log("Error getting current user: ", error);
      throw error;
    }
  }

  // Upload Avatar
  async uploadAvatar(file, userId) {
    try {
      // Upload file to storage
      const response = await this.storage.createFile(
        BUCKET_ID,
        ID.unique(),
        file,
        [Permission.read(Role.any())]
      );

      // Construct public URL
      const fileUrl = `${APPWRITE_ENDPOINT}/storage/buckets/${BUCKET_ID}/files/${response.$id}/view?project=${APPWRITE_PROJECT}`;

      // Find user doc in database
      const currentUser = await this.databases.listDocuments(
        DATABASE_ID,
        USERS_COLLECTION_ID,
        [Query.equal("user_id", userId)]
      );

      if (currentUser.documents.length > 0) {
        // Update user doc with avatar
        await this.databases.updateDocument(
          DATABASE_ID,
          USERS_COLLECTION_ID,
          currentUser.documents[0].$id,
          { avatar: fileUrl }
        );
      }

      return fileUrl;
    } catch (error) {
      console.error("uploadAvatar API error", error);
      throw error;
    }
  }

  // OAuth Login
  async loginWithOAuth(provider) {
    try {
      // Use 'oauth-callback' path instead of 'auth' to avoid Expo Router
      // accidentally treating the redirect as a navigation to the (auth) group
      // or any other existing route (like the support ticket page).
      const deepLinkUrl = Linking.createURL('oauth-callback');

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

      console.log("OAuth redirect URL:", result.url);
      console.log("secret:", secret, "userId:", userId);

      if (!secret || !userId) {
        throw new Error('Invalid authentication response — missing secret or userId in redirect URL');
      }

      // Create a fully authenticated session
      const session = await this.account.createSession(userId, secret);
      console.log("Session created:", session.$id);

      const user = await this.getCurrentUser();
      return user;
    } catch (error) {
      console.log("Error with OAuth login:", error.message || error);
      throw error;
    }
  }

  // Logout
  async logout() {
    try {
      // Safely delete the current session on the Appwrite server
      await this.account.deleteSession('current');
    } catch (error) {
      // If there's an error (e.g. session already invalid/deleted), 
      // we just log it and proceed so local state can still be cleared.
      console.warn("Appwrite logout error (safe to ignore):", error.message);
    }
  }
}

export default new AuthService();
