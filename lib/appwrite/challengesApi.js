import { Databases, ID, Query, Storage, Permission, Role } from "react-native-appwrite";
import client from "./client";
import Toast from "react-native-toast-message";

const DATABASE_ID = process.env.EXPO_PUBLIC_APPWRITE_DATABASE_ID;
const CHALLENGES_COLLECTION = "team_challenges";
const PARTICIPANTS_COLLECTION = "team_challenge_participants";
const RESULTS_COLLECTION = "team_match_results";
const USERS_COLLECTION = "users";
const TRANSACTIONS_COLLECTION = "wallet_transactions";

const databases = new Databases(client);
const storage = new Storage(client);
const RESULTS_BUCKET = "69ca76320005db678536";

const APPWRITE_ENDPOINT = process.env.EXPO_PUBLIC_APPWRITE_ENDPOINT;
const APPWRITE_PROJECT = process.env.EXPO_PUBLIC_APPWRITE_PROJECT_ID;

const challengesApi = {
  
  /**
   * 1. Create a new challenge (Deducts balance from Creator)
   */
  async createChallenge({ creatorId, gameName, gameIds, mode, map, price }) {
    try {
      // Step A: Fetch User Wallet Balance directly from DB to prevent client-side spoofing
      const userDoc = await databases.getDocument(DATABASE_ID, USERS_COLLECTION, creatorId);
      
      const currentBalance = userDoc.wallet_balance || 0;
      
      if (currentBalance < price) {
        return { success: false, error: "low_balance" };
      }

      // Step B: Deduct Balance 
      const newBalance = currentBalance - price;
      
      // We must do these pseudo-transactionally (React Native Appwrite SDK doesn't support transactions yet natively)
      await databases.updateDocument(DATABASE_ID, USERS_COLLECTION, creatorId, {
        wallet_balance: newBalance,
      });

      // Step C: Create Wallet Transaction Record
      await databases.createDocument(DATABASE_ID, TRANSACTIONS_COLLECTION, ID.unique(), {
        amount: price,
        type: "fee",
        status: "approved",
        user_id: creatorId,
        note: `Challenge Creation Fee: ${gameName} - ${mode}`,
      });

      // Step D: Create Challenge Document
      const prizePool = Math.floor((price * 2) * 0.90); // 90% prize pool
      const challengeDoc = await databases.createDocument(DATABASE_ID, CHALLENGES_COLLECTION, ID.unique(), {
        creator_id: creatorId,
        game_name: gameName,
        game_ids: gameIds, // Array
        mode: mode,
        map: map,
        challenge_price: price,
        prize_pool: prizePool,
        status: "open",
      });

      return { success: true, data: challengeDoc };

    } catch (error) {
      console.error("createChallenge API Error:", error);
      throw error;
    }
  },

  /**
   * 2. Accept a challenge (Deducts balance from Accepter)
   */
  async acceptChallenge({ challengeId, userId, price }) {
    try {
      // Prevent double join
      const existing = await databases.listDocuments(DATABASE_ID, PARTICIPANTS_COLLECTION, [
        Query.equal("challenge_id", challengeId),
        Query.equal("user_id", userId),
      ]);
      if (existing.documents.length > 0) throw new Error("You already accepted this challenge.");

      // Fetch User Wallet
      const userDoc = await databases.getDocument(DATABASE_ID, USERS_COLLECTION, userId);
      const currentBalance = userDoc.wallet_balance || 0;

      if (currentBalance < price) {
        return { success: false, error: "low_balance" };
      }

      // Deduct Wallet
      const newBalance = currentBalance - price;
      await databases.updateDocument(DATABASE_ID, USERS_COLLECTION, userId, {
        wallet_balance: newBalance,
      });

      // Create Transaction
      await databases.createDocument(DATABASE_ID, TRANSACTIONS_COLLECTION, ID.unique(), {
        amount: price,
        type: "fee",
        status: "approved",
        user_id: userId,
        note: `Challenge Acceptance Fee: ${challengeId}`,
      });

      // Create Participant Record
      const participantDoc = await databases.createDocument(DATABASE_ID, PARTICIPANTS_COLLECTION, ID.unique(), {
        challenge_id: challengeId,
        user_id: userId,
        status: "pending", // Waiting for creator to select
      });

      return { success: true, data: participantDoc };

    } catch (error) {
      console.error("acceptChallenge API Error:", error);
      throw error;
    }
  },

  /**
   * 3. Creator Selects Opponent
   */
  async selectOpponent(challengeId, participantDocId, opponentUserId) {
    try {
      // Update Challenge to Ongoing
      await databases.updateDocument(DATABASE_ID, CHALLENGES_COLLECTION, challengeId, {
        status: "ongoing",
        selected_opponent_id: opponentUserId,
      });

      // Update Participant to Selected
      await databases.updateDocument(DATABASE_ID, PARTICIPANTS_COLLECTION, participantDocId, {
        status: "selected",
      });

      return true;
    } catch (error) {
      console.error("selectOpponent API Error:", error);
      throw error;
    }
  },

  /**
   * 4. Update Room Details
   */
  async updateRoomDetails(challengeId, roomId, roomPassword) {
    try {
      return await databases.updateDocument(DATABASE_ID, CHALLENGES_COLLECTION, challengeId, {
        room_id: roomId,
        room_password: roomPassword,
      });
    } catch (error) {
      console.error("updateRoomDetails API Error:", error);
      throw error;
    }
  },

  /**
   * List all challenges 
   */
  async listChallenges() {
    try {
      const res = await databases.listDocuments(DATABASE_ID, CHALLENGES_COLLECTION, [
        Query.orderDesc("$createdAt"),
        Query.limit(50),
      ]);

      const populated = await Promise.all(res.documents.map(async (doc) => {
        try {
          const userDoc = await databases.getDocument(DATABASE_ID, USERS_COLLECTION, doc.creator_id);
          return { ...doc, creator_name: userDoc.name || "Unknown" };
        } catch (e) {
          return { ...doc, creator_name: "Unknown" };
        }
      }));

      return { documents: populated };
    } catch (error) {
      console.error("listChallenges API Error:", error);
      throw error;
    }
  },

  /**
   * Get single challenge by ID
   */
  async getChallenge(id) {
    try {
      return await databases.getDocument(DATABASE_ID, CHALLENGES_COLLECTION, id);
    } catch (error) {
      console.error("getChallenge API Error:", error);
      throw error;
    }
  },

  async getParticipants(challengeId) {
    try {
      const parts = await databases.listDocuments(DATABASE_ID, PARTICIPANTS_COLLECTION, [
        Query.equal("challenge_id", challengeId),
      ]);
      
      const populated = await Promise.all(parts.documents.map(async (p) => {
        try {
          const userDoc = await databases.getDocument(DATABASE_ID, USERS_COLLECTION, p.user_id);
          return { ...p, user_name: userDoc.name || "Unknown Player" };
        } catch (e) {
          return { ...p, user_name: "Unknown Player" };
        }
      }));

      return { documents: populated };
    } catch (error) {
      console.error("getParticipants API Error:", error);
      throw error;
    }
  },
  
  /**
   * 6. Update Match Result (Single record per challenge)
   */
  async uploadMatchResult(challengeId, userId, stringFileUrl) {
    try {
      // 1. Fetch challenge to identify who is uploading
      const challenge = await this.getChallenge(challengeId);
      const isChallenger = challenge.creator_id === userId;
      
      // 2. Check if a result record already exists
      const existing = await databases.listDocuments(DATABASE_ID, RESULTS_COLLECTION, [
        Query.equal("challenge_id", challengeId)
      ]);

      if (existing.total > 0) {
        // Update existing record
        const docId = existing.documents[0].$id;
        const updateData = isChallenger 
          ? { challenger_screenshot: stringFileUrl }
          : { opponent_screenshot: stringFileUrl };
        
        return await databases.updateDocument(DATABASE_ID, RESULTS_COLLECTION, docId, updateData);
      } else {
        // Create new record
        const createData = {
          challenge_id: challengeId,
          user_id: userId, // This field is technically redundant now but good for tracking who created the record
        };
        
        if (isChallenger) {
          createData.challenger_screenshot = stringFileUrl;
        } else {
          createData.opponent_screenshot = stringFileUrl;
        }

        return await databases.createDocument(DATABASE_ID, RESULTS_COLLECTION, ID.unique(), createData);
      }
    } catch (err) {
      console.error("uploadMatchResult API error", err);
      throw err;
    }
  },

  /**
   * 7. Get Match Results for a Challenge
   */
  async getMatchResults(challengeId) {
    try {
      return await databases.listDocuments(DATABASE_ID, RESULTS_COLLECTION, [
        Query.equal("challenge_id", challengeId),
      ]);
    } catch (error) {
      console.error("getMatchResults API Error:", error);
      throw error;
    }
  },

  /**
   * Get all participations for a user
   */
  async getMyParticipations(userId) {
    try {
      return await databases.listDocuments(DATABASE_ID, PARTICIPANTS_COLLECTION, [
        Query.equal("user_id", userId),
      ]);
    } catch (error) {
      console.error("getMyParticipations API Error:", error);
      throw error;
    }
  },

  /**
   * 10. Upload Screenshot to Appwrite Storage
   */
  async uploadResultFile(file) {
    try {
      // console.log("Uploading file to Appwrite:", file);
      const response = await storage.createFile(
        RESULTS_BUCKET,
        ID.unique(),
        file,
        [
          Permission.read(Role.any()),
        ]
      );
      
      // console.log("Appwrite Upload Response:", response);
      
      if (!response || !response.$id) {
         throw new Error("File upload failed - response is undefined or missing ID.");
      }

      // Construct public URL
      const fileUrl = `${APPWRITE_ENDPOINT}/storage/buckets/${RESULTS_BUCKET}/files/${response.$id}/view?project=${APPWRITE_PROJECT}`;
      return { fileId: response.$id, fileUrl };
    } catch (error) {
      console.error("uploadResultFile API Error:", error);
      throw error;
    }
  },
  /**
   * 11. Admin: Get all team challenges by status
   */
  async getTeamChallengesByStatus(status) {
    try {
      return await databases.listDocuments(DATABASE_ID, CHALLENGES_COLLECTION, [
        Query.equal("status", status),
        Query.orderDesc("$createdAt"),
      ]);
    } catch (error) {
      console.error("getTeamChallengesByStatus Error:", error);
      throw error;
    }
  },

  /**
   * 12. Admin: Complete Team Challenge (Payout)
   */
  async completeTeamChallengeAdmin({ challengeId, winnerId, prize }) {
    try {
      // 1. Fetch winner
      const winnerDoc = await databases.getDocument(DATABASE_ID, USERS_COLLECTION, winnerId);
      const newBalance = (winnerDoc.wallet_balance || 0) + prize;

      // 2. Update winner balance
      await databases.updateDocument(DATABASE_ID, USERS_COLLECTION, winnerId, {
        wallet_balance: newBalance,
      });

      // 3. Create wallet transaction
      await databases.createDocument(DATABASE_ID, TRANSACTIONS_COLLECTION, ID.unique(), {
        amount: prize,
        type: "deposit",
        status: "approved",
        user_id: winnerId,
        note: `Match Win Prize: Challenge #${challengeId.substring(0, 8)}`,
      });

      // 4. Update challenge record
      return await databases.updateDocument(DATABASE_ID, CHALLENGES_COLLECTION, challengeId, {
        status: "completed",
        winner_id: winnerId,
      });
    } catch (error) {
      console.error("completeTeamChallengeAdmin Error:", error);
      throw error;
    }
  },
};

export default challengesApi;
