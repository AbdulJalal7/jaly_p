import { Databases, Storage, ID, Query } from "react-native-appwrite";
import client from "./client";

// ===== CONFIG =====
const DATABASE_ID = "6992ce540025a687a83e";
const PARTICIPANT_COLLECTION_ID = "tournament_participants";
const BUCKET_ID = "69a7345700224516f5ed"; // Your storage bucket ID

class ParticipantService {
  databases = new Databases(client);
  storage = new Storage(client);

  /**
   * Join Tournament
   * 1. Prevent duplicate join
   * 2. Upload receipt image
   * 3. Create participant document
   */
  async joinTournament({
    tournamentId,
    userId,
    gameId,
    transactionId,
    receiptFile,
  }) {
    try {
      // ===============================
      // 1️⃣ Check duplicate join
      // ===============================
      const existing = await this.databases.listDocuments(
        DATABASE_ID,
        PARTICIPANT_COLLECTION_ID,
        [
          Query.equal("tournaments", tournamentId),
          Query.equal("users", userId),
        ]
      );

      if (existing.total > 0) {
        throw new Error("You have already joined this tournament.");
      }

      // ===============================
      // 2️⃣ Upload Receipt Image
      // ===============================
      const uploadedFile = await this.storage.createFile(
        BUCKET_ID,
        ID.unique(),
        {
          uri: receiptFile.uri,
          name: receiptFile.fileName || "receipt.jpg",
          type: receiptFile.mimeType || "image/jpeg",
        }
      );
      console.log("Receipt uploaded with ID:", uploadedFile.$id);

      // ===============================
      // 3️⃣ Create Participant Record
      // ===============================
      const document = await this.databases.createDocument(
        DATABASE_ID,
        PARTICIPANT_COLLECTION_ID,
        ID.unique(),
        {
          tournaments: tournamentId,
          users: userId,
          game_id: gameId,
          transaction_id: transactionId,
          receipt_file_id: uploadedFile.$id,
          payment_status: "pending",
          joined_at: new Date().toISOString(),
        }
      );

      return document;
    } catch (error) {
      console.log("Join Tournament Error:", error.message);
    //   throw error;
    }
  }
}

export default new ParticipantService();