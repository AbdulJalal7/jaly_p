import { Databases, ID, Query } from "react-native-appwrite";
import client from "./client";

const DATABASE_ID = "6992ce540025a687a83e";
const CHALLENGES_COLLECTION_ID = "challenges";
const RESULTS_COLLECTION_ID = "challenge_results";
const USERS_COLLECTION_ID = "users";

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
      
      return all;
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
   * Admin: Set Room Details
   */
  async setRoomDetailsAdmin(challengeId, roomId, roomPass) {
    return await this.databases.updateDocument(DATABASE_ID, CHALLENGES_COLLECTION_ID, challengeId, {
      room_id: roomId,
      room_pass: roomPass
    });
  }
}

export default new ChallengeService();
