import { Databases, Storage, ID, Query ,InputFile} from "react-native-appwrite";
import client from "./client";

// ===== CONFIG =====
const DATABASE_ID = "6992ce540025a687a83e";
const PARTICIPANT_COLLECTION_ID = "tournament_participants";
const user_COLLECTION_ID = "users";
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
    transaction_no,
    receiptFile,
  }) {
    try {
      console.log("UUUUUUUUUUUUUUUUUUUUUUUU : ",userId);
      // ===============================
      // 1️⃣ Check duplicate join
      // ===============================
       
        const userIds=await this.databases.listDocuments(
          DATABASE_ID,
          user_COLLECTION_ID,
          [
          Query.equal("user_id", userId)
        ]
          
        );
      console.log("Userssssssssssssssssssssssssss document fetched for ID:", userIds.documents[0]);
      const userId_get=userIds.documents[0];

      const existing = await this.databases.listDocuments(
        DATABASE_ID,
        PARTICIPANT_COLLECTION_ID,
        [
          Query.equal("tournament_id", tournamentId),
          Query.equal("user_id", userId_get.$id),
        ]
      );
      console.log("Existing join check result:", existing);

      if (existing.total > 0) {
        console.log("User has already joined this tournament.");
        // throw new Error("You have already joined this tournament.");
      }

      

      // ===============================
      // 2️⃣ Upload Receipt Image
      // ===============================
//       const file = InputFile.fromURI(
//   receiptFile.uri,
//   receiptFile.fileName || "receipt.jpg",
//   receiptFile.mimeType || "image/jpeg"
// );
      console.log("Uploading receipt file:", receiptFile.uri);
      console.log("File name:", receiptFile.fileName);
      console.log("File type:", receiptFile.mimeType);
      const uploadedFile = await this.storage.createFile(
        BUCKET_ID,
        ID.unique(),
        {
          uri: receiptFile.uri,
          name: receiptFile.fileName || "receipt.jpg",
          type: receiptFile.mimeType || "image/jpeg",
          size: receiptFile.fileSize || 0,
          
        }
      );
      console.log("Receipt uploaded with ID:", uploadedFile);

      // ===============================
      // 3️⃣ Create Participant Record
      // ===============================
      const document = await this.databases.createDocument(
        DATABASE_ID,
        PARTICIPANT_COLLECTION_ID,
        ID.unique(),
        {
          tournament_id: tournamentId,
          user_id: userId_get.$id,
          game_id: gameId,
          transaction_no: transaction_no,
          receipt_file_id: uploadedFile.$id,
          payment_status: "pending",
          // joined_at: new Date().toISOString(),
        }
      );

      console.log("Participant document created:", document);

      return document;
    } catch (error) {
      console.log("Join Tournament Error:", error);
      console.log("Join Tournament Error Message:", error.message);
    //   throw error;
    }
  }
}

export default new ParticipantService();