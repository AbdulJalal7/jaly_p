import { Databases, ID, Query, Storage, Permission, Role } from "react-native-appwrite";
import client from "./client";

const DATABASE_ID = process.env.EXPO_PUBLIC_APPWRITE_DATABASE_ID;
const CHALLENGES_COLLECTION_ID = "challenges";
const RESULTS_COLLECTION_ID = "challenge_results";
const USERS_COLLECTION_ID = "users";

const RESULTS_BUCKET = "69ca76320005db678536";
const APPWRITE_ENDPOINT = process.env.EXPO_PUBLIC_APPWRITE_ENDPOINT;
const APPWRITE_PROJECT = process.env.EXPO_PUBLIC_APPWRITE_PROJECT_ID;

const storage = new Storage(client);

class ChallengeService {
  databases = new Databases(client);

  /**
   * Fetch all challenges for a user (both as challenger and opponent)
   */
  async getUserChallenges(userId) {
    try {
      const challengerData = await this.databases.listDocuments(
        DATABASE_ID,
        CHALLENGES_COLLECTION_ID,
        [Query.equal("challenger_id", userId), Query.orderDesc("$createdAt")]
      );
      
      const opponentData = await this.databases.listDocuments(
        DATABASE_ID,
        CHALLENGES_COLLECTION_ID,
        [Query.equal("opponent_id", userId), Query.orderDesc("$createdAt")]
      );

      // Merge and sort them
      const all = [...challengerData.documents, ...opponentData.documents];
      all.sort((a, b) => new Date(b.$createdAt) - new Date(a.$createdAt));
      
      return await this.populateUsers(all);
    } catch (error) {
      console.log("Error fetching user challenges:", error);
      throw error;
    }
  }

  /**
   * Send a challenge to another player
   */
  async sendChallenge({ challengerId, opponentId, game, map, entryFee, currentBalance }) {
    const feeNum = parseInt(entryFee, 10) || 0;
    const balanceNum = parseInt(currentBalance, 10) || 0;

    if (balanceNum < feeNum) {
      throw new Error("Insufficient wallet balance to send challenge.");
    }

    try {
      // 1. Deduct fee from challenger
      const newBalance = balanceNum - feeNum;
      await this.databases.updateDocument(
        DATABASE_ID,
        USERS_COLLECTION_ID,
        challengerId,
        { wallet_balance: newBalance }
      );

      // 2. Add wallet transaction for entry
      if (feeNum > 0) {
        await this.databases.createDocument(
          DATABASE_ID,
          "wallet_transactions",
          ID.unique(),
          {
            user_id: challengerId,
            amount: feeNum,
            type: "fee",
            status: "approved",
            note: "Challenge sent securely"
          }
        );
      }

      // 3. Create Challenge Document
      const prizePool = Math.floor((feeNum * 2) * 0.80); // 80% standard prize
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 2); // Expiration is 2 days

      const challenge = await this.databases.createDocument(
        DATABASE_ID,
        CHALLENGES_COLLECTION_ID,
        ID.unique(),
        {
          challenger_id: challengerId,
          opponent_id: opponentId,
          game: game,
          map: map || "",
          entry_fee: feeNum,
          prize: prizePool,
          status: "pending",
          expires_at: expiresAt.toISOString(),
        }
      );

      return challenge;
    } catch (error) {
      console.log("Error sending challenge:", error);
      throw error;
    }
  }

  /**
   * Accept an incoming challenge
   */
  async acceptChallenge({ challengeId, opponentId, entryFee, currentBalance }) {
    const feeNum = parseInt(entryFee, 10) || 0;
    const balanceNum = parseInt(currentBalance, 10) || 0;

    if (balanceNum < feeNum) {
      throw new Error("Insufficient wallet balance to accept challenge.");
    }

    try {
      // 1. Deduct fee from opponent
      const newBalance = balanceNum - feeNum;
      await this.databases.updateDocument(
        DATABASE_ID,
        USERS_COLLECTION_ID,
        opponentId,
        { wallet_balance: newBalance }
      );

      // 2. Add wallet transaction
      if (feeNum > 0) {
        await this.databases.createDocument(
          DATABASE_ID,
          "wallet_transactions",
          ID.unique(),
          {
            user_id: opponentId,
            amount: feeNum,
            type: "fee",
            status: "approved",
            note: "Challenge accepted"
          }
        );
      }

      // 3. Update Challenge status
      return await this.databases.updateDocument(
        DATABASE_ID,
        CHALLENGES_COLLECTION_ID,
        challengeId,
        { status: "accepted" }
      );

    } catch (error) {
      console.log("Error accepting challenge:", error);
      throw error;
    }
  }

  /**
   * Cancel or Reject a challenge (Refunds the specific user)
   */
  async cancelOrRejectChallenge({ challengeId, refundUserId, entryFee, newStatus }) {
    const feeNum = parseInt(entryFee, 10) || 0;

    try {
      // Always fetch the freshest document strictly for the refunded user to prevent race conditions
      const userDoc = await this.databases.getDocument(DATABASE_ID, USERS_COLLECTION_ID, refundUserId);
      const balanceNum = parseInt(userDoc.wallet_balance, 10) || 0;

      // 1. Refund the user
      const newBalance = balanceNum + feeNum;
      await this.databases.updateDocument(
        DATABASE_ID,
        USERS_COLLECTION_ID,
        refundUserId,
        { wallet_balance: newBalance }
      );

      // 2. Add refund transaction
      if (feeNum > 0) {
        await this.databases.createDocument(
          DATABASE_ID,
          "wallet_transactions",
          ID.unique(),
          {
            user_id: refundUserId,
            amount: feeNum,
            type: "deposit",
            status: "approved",
            note: `Challenge ${newStatus} wallet refund`
          }
        );
      }

      // 3. Update Status
      return await this.databases.updateDocument(
        DATABASE_ID,
        CHALLENGES_COLLECTION_ID,
        challengeId,
        { status: newStatus }
      );
    } catch (error) {
      console.log(`Error ${newStatus} challenge:`, error);
      throw error;
    }
  }
  /**
   * Admin: Complete a match, distribute prize and update stats
   */
  async completeChallengeAdmin({ challengeId, winnerId, loserId, prize }) {
    const pNum = parseInt(prize, 10) || 0;
    try {
      // 1. Fetch winner and loser to add to their stats safely
      const winnerDoc = await this.databases.getDocument(DATABASE_ID, USERS_COLLECTION_ID, winnerId);
      const loserDoc = await this.databases.getDocument(DATABASE_ID, USERS_COLLECTION_ID, loserId);

      const winnerBalance = (parseInt(winnerDoc.wallet_balance, 10) || 0) + pNum;
      const winnerWins = (parseInt(winnerDoc.wins, 10) || 0) + 1;
      const winnerMatches = (parseInt(winnerDoc.total_matches, 10) || 0) + 1;

      const loserLosses = (parseInt(loserDoc.losses, 10) || 0) + 1;
      const loserMatches = (parseInt(loserDoc.total_matches, 10) || 0) + 1;

      // 2. Update Winner
      await this.databases.updateDocument(DATABASE_ID, USERS_COLLECTION_ID, winnerId, {
        wallet_balance: winnerBalance,
        wins: winnerWins,
        total_matches: winnerMatches
      });

      // 3. Update Loser
      await this.databases.updateDocument(DATABASE_ID, USERS_COLLECTION_ID, loserId, {
        losses: loserLosses,
        total_matches: loserMatches
      });

      // 4. Create Win Transaction
      if (pNum > 0) {
        await this.databases.createDocument(DATABASE_ID, "wallet_transactions", ID.unique(), {
          user_id: winnerId,
          amount: pNum,
          type: "deposit",
          status: "approved",
          note: "1v1 Match Win Prize"
        });
      }

      // 5. Update Challenge Record
      return await this.databases.updateDocument(DATABASE_ID, CHALLENGES_COLLECTION_ID, challengeId, {
        status: "completed",
        winner_id: winnerId
      });

    } catch (error) {
      console.log("Error completing challenge admin:", error);
      throw error;
    }
  }

  /**
   * Set Room Details
   */
  async setRoomDetails(challengeId, roomId, roomPass) {
    return await this.databases.updateDocument(DATABASE_ID, CHALLENGES_COLLECTION_ID, challengeId, {
      room_id: roomId,
      room_pass: roomPass
    });
  }

  /**
   * Helper to populate user details if they are plain strings
   */
  async populateUsers(documents) {
    return await Promise.all(documents.map(async (doc) => {
      try {
        const chalId = typeof doc.challenger_id === 'object' ? doc.challenger_id.$id : doc.challenger_id;
        const oppId = typeof doc.opponent_id === 'object' ? doc.opponent_id?.$id : doc.opponent_id;
        
        let chalObj = doc.challenger_id;
        if (typeof doc.challenger_id === 'string' && chalId) {
          const chalUser = await this.databases.getDocument(DATABASE_ID, USERS_COLLECTION_ID, chalId);
          chalObj = { $id: chalId, username: chalUser.username, name: chalUser.name };
        }
        
        let oppObj = doc.opponent_id;
        if (typeof doc.opponent_id === 'string' && oppId) {
          const oppUser = await this.databases.getDocument(DATABASE_ID, USERS_COLLECTION_ID, oppId);
          oppObj = { $id: oppId, username: oppUser.username, name: oppUser.name };
        }
        
        return { ...doc, challenger_id: chalObj, opponent_id: oppObj };
      } catch(e) {
        return doc;
      }
    }));
  }

  /**
   * Upload Screenshot to Appwrite Storage
   */
  async uploadResultFile(file) {
    try {
      console.log("Uploading file to Appwrite:", file);
      const response = await storage.createFile(
        RESULTS_BUCKET,
        ID.unique(),
        file,
        [Permission.read(Role.any())]
      );
      
      console.log("Appwrite Upload Response:", response);
      
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
  }

  /**
   * Update Match Result (Single record per challenge)
   */
  async uploadMatchResult(challengeId, userId, stringFileUrl) {
    try {
      // 1. Fetch challenge to identify who is uploading
      const challenge = await this.databases.getDocument(DATABASE_ID, CHALLENGES_COLLECTION_ID, challengeId);
      const isChallenger = challenge.challenger_id === userId || challenge.challenger_id?.$id === userId;
      
      // 2. Check if a result record already exists
      const existing = await this.databases.listDocuments(DATABASE_ID, RESULTS_COLLECTION_ID, [
        Query.equal("challenge_id", challengeId)
      ]);

      if (existing.total > 0) {
        // Update existing record
        const docId = existing.documents[0].$id;
        const updateData = isChallenger 
          ? { challenger_screenshot: stringFileUrl }
          : { opponent_screenshot: stringFileUrl };
        
        return await this.databases.updateDocument(DATABASE_ID, RESULTS_COLLECTION_ID, docId, updateData);
      } else {
        // Create new record
        const createData = {
          challenge_id: challengeId,
          user_id: userId,
        };
        
        if (isChallenger) {
          createData.challenger_screenshot = stringFileUrl;
        } else {
          createData.opponent_screenshot = stringFileUrl;
        }

        return await this.databases.createDocument(DATABASE_ID, RESULTS_COLLECTION_ID, ID.unique(), createData);
      }
    } catch (err) {
      console.error("uploadMatchResult API error", err);
      throw err;
    }
  }

  /**
   * Get Match Results for a Challenge
   */
  async getMatchResults(challengeId) {
    try {
      return await this.databases.listDocuments(DATABASE_ID, RESULTS_COLLECTION_ID, [
        Query.equal("challenge_id", challengeId),
      ]);
    } catch (error) {
      console.error("getMatchResults API Error:", error);
      throw error;
    }
  }
}

export default new ChallengeService();
