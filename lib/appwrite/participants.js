import { Databases, Storage, ID, Query ,InputFile} from "react-native-appwrite";
import client from "./client";

// ===== CONFIG =====
const DATABASE_ID = process.env.EXPO_PUBLIC_APPWRITE_DATABASE_ID;
const PARTICIPANT_COLLECTION_ID = "tournament_participants";
const user_COLLECTION_ID = "users";
const BUCKET_ID = process.env.EXPO_PUBLIC_APPWRITE_BUCKET_ID;

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
      // console.log("UUUUUUUUUUUUUUUUUUUUUUUU : ",userId);
      // ===============================
      // 1️⃣ Check duplicate join
      // ===============================
     
      const existing = await this.databases.listDocuments(
        DATABASE_ID,
        PARTICIPANT_COLLECTION_ID,
        [
          Query.equal("tournament_id", tournamentId),
          Query.equal("user_id", userId),
        ]
      );
      // console.log("Existing join check result:", existing);

      if (existing.total > 0) {
        // console.log("User has already joined this tournament.");
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
      // console.log("Uploading receipt file:", receiptFile.uri);
      // console.log("File name:", receiptFile.fileName);
      // console.log("File type:", receiptFile.mimeType);
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
      // console.log("Receipt uploaded with ID:", uploadedFile);

      // ===============================
      // 3️⃣ Create Participant Record
      // ===============================
      const document = await this.databases.createDocument(
        DATABASE_ID,
        PARTICIPANT_COLLECTION_ID,
        ID.unique(),
        {
          tournament_id: tournamentId,
          user_id: userId,
          game_id: gameId,
          transaction_no: transaction_no,
          receipt_file_id: uploadedFile.$id,
          payment_status: "pending",
          // joined_at: new Date().toISOString(),
        }
      );

      // console.log("Participant document created:", document);

      return document;
    } catch (error) {
      // console.log("Join Tournament Error:", error);
      // console.log("Join Tournament Error Message:", error.message);
    }
  }

  /**
   * Join Tournament via Wallet
   * 1. Prevent duplicate join
   * 2. Deduct balance from user wallet
   * 3. Create participant record (auto verified)
   */
  async joinWithWallet({ tournamentId, userDocId, gameId, fee, currentBalance }) {
    try {
      console.log("Wallet Join for User:", userDocId);
      // 1️⃣ Check duplicate join
      const existing = await this.databases.listDocuments(
        DATABASE_ID,
        PARTICIPANT_COLLECTION_ID,
        [
          Query.equal("tournament_id", tournamentId),
          Query.equal("user_id", userDocId),
        ]
      );

      if (existing.total > 0) {
        throw new Error("You have already joined this tournament.");
      }

      // 2️⃣ Deduct balance from user wallet
      const feeNum = parseInt(fee, 10) || 0;
      const balanceNum = parseInt(currentBalance, 10) || 0;
      const newBalance = balanceNum - feeNum;

      await this.databases.updateDocument(
        DATABASE_ID,
        user_COLLECTION_ID,
        userDocId,
        {
          wallet_balance: newBalance,
        }
      );

      // 3️⃣ Create Wallet Transaction Record
      await this.databases.createDocument(
        DATABASE_ID,
        "wallet_transactions",
        ID.unique(),
        {
          user_id: userDocId,
          amount: feeNum,
          type: "fee",
          status: "approved",
          tournament_id: tournamentId,
        }
      );

      // 4️⃣ Create Participant Record
      const document = await this.databases.createDocument(
        DATABASE_ID,
        PARTICIPANT_COLLECTION_ID,
        ID.unique(),
        {
          tournament_id: tournamentId,
          user_id: userDocId,
          game_id: gameId,
          payment_status: "verified",
        }
      );

      // console.log("Participant document created via wallet:", document);
      return document;
    } catch (error) {
      // console.log("Join with Wallet Error:", error);
      throw error;
    }
  }
  async getUserParticipations(userId) {
    try {
      // const userIds = await this.databases.listDocuments(
      //   DATABASE_ID,
      //   user_COLLECTION_ID,
      //   [Query.equal("user_id", userId)]
      // );

      // if (userIds.documents.length === 0) return [];
      
      // const internalUserId = userIds.documents[0].$id;
      
      const res = await this.databases.listDocuments(
        DATABASE_ID,
        PARTICIPANT_COLLECTION_ID,
        [Query.equal("user_id", userId)]
      );
      
      return res.documents;
    } catch (error) {
      console.log("Error fetching user participations:", error);
      return [];
    }
  }
}

export default new ParticipantService();