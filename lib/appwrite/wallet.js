import { Databases, Storage, ID, Query } from "react-native-appwrite";
import client from "./client";
// where

const DATABASE_ID = process.env.EXPO_PUBLIC_APPWRITE_DATABASE_ID;
const RECEIPTS_BUCKET_ID = process.env.EXPO_PUBLIC_APPWRITE_BUCKET_ID;
const WALLET_TRANSACTIONS_COLLECTION_ID = "wallet_transactions";
const WITHDRAW_REQUESTS_COLLECTION_ID = "withdraw_requests";
const USERS_COLLECTION_ID = "users";


class WalletService {
  databases = new Databases(client);
  storage = new Storage(client);


  /**
   * Create Deposit Request
   */
  async createDepositRequest({ userId, amount, transactionId, receiptFile }) {
    try {
      // Find internal user ID
      // const userStat = await this.getUserWallet(userId);
      
      let uploadedFileId = null;

      // Upload receipt if provided
      if (receiptFile) {
        const uploadedFile = await this.storage.createFile(
          RECEIPTS_BUCKET_ID,
          ID.unique(),
          {
            uri: receiptFile.uri,
            name: receiptFile.fileName || "deposit_receipt.jpg",
            type: receiptFile.mimeType || "image/jpeg",
            size: receiptFile.fileSize || 0,
          }
        );
        uploadedFileId = uploadedFile.$id;
      }
      // console.log("userIdsssssssssssssss :",userId); 
      // console.log("userIdsssssssssssssss ID :",userId.$id); 
      // Create transaction record
      return await this.databases.createDocument(
        DATABASE_ID,
        WALLET_TRANSACTIONS_COLLECTION_ID,
        ID.unique(),
        {
          user_id: userId.$id, // storing internal user id reference
          amount: parseFloat(amount),
          type: "deposit",
          status: "pending",
          transaction_id: transactionId,
          receipt_image: uploadedFileId,
        }
      );
    } catch (error) {
      console.error("Error creating deposit request:", error);
      // throw error;
    }
  }

  /**
   * Create Withdraw Request
   */
  async createWithdrawRequest({ user, amount, method, upiId, accountNumber, accountName }) {
    try {
      

      // Validate balance
      const balance = user.wallet_balance || 0;
      const requestAmount = parseFloat(amount);
      
      if (balance < requestAmount) {
        throw new Error("Insufficient wallet balance.");
      }

      // Create withdraw_requests record
      return await this.databases.createDocument(
        DATABASE_ID,
        WITHDRAW_REQUESTS_COLLECTION_ID,
        ID.unique(),
        {
          user_id: user.$id,
          amount: requestAmount,
          method: method,
          upi_id: upiId || null,
          account_number: accountNumber || null,
          account_name: accountName || null,
          status: "pending",
        }
      );
    } catch (error) {
      console.error("Error creating withdraw request:", error);
      throw error;
    }
  }

  /**
   * Get User Transaction History
   */
  async getUserTransactions(userId) {
    try {
      // console.log("userIdsssssssssssssss :",userId); 
      const transactions = await this.databases.listDocuments(
        DATABASE_ID,
        WALLET_TRANSACTIONS_COLLECTION_ID,
        [
          Query.equal("user_id", userId.$id),
          Query.orderDesc("$createdAt")
        ]
      );

      const withdrawals = await this.databases.listDocuments(
        DATABASE_ID,
        WITHDRAW_REQUESTS_COLLECTION_ID,
        [
          Query.equal("user_id", userId.$id),
          Query.orderDesc("$createdAt")
        ]
      );

      // Filter out approved withdrawals since they are already in the wallet_transactions list
      const pendingAndRejected = withdrawals.documents
        .filter(w => w.status !== "approved")
        .map(w => ({
          ...w,
          type: "withdraw"
        }));

      // Merge and sort descending by creation date
      const combinedDocs = [...transactions.documents, ...pendingAndRejected];
      combinedDocs.sort((a, b) => new Date(b.$createdAt) - new Date(a.$createdAt));

      return { documents: combinedDocs };
    } catch (error) {
      console.error("Error fetching user transactions:", error);
      return { documents: [] };
    }
  }

  /**
   * ADMIN: Get Pending Deposit Requests
   */
  async getPendingDeposits() {
    try {
      const deposits = await this.databases.listDocuments(
        DATABASE_ID,
        WALLET_TRANSACTIONS_COLLECTION_ID,
        [
          Query.equal("type", "deposit"),
          Query.equal("status", "pending"),
          Query.orderDesc("$createdAt")
        ]
      );
      // console.log("depositsssssssssssssssssss : ",deposits);
      return deposits;
      
    } catch (error) {
      console.error("Error fetching pending deposits:", error);
      throw error;
    }
  }

  /**
   * ADMIN: Get Pending Withdrawal Requests
   */
  async getPendingWithdrawals() {
    try {
      return await this.databases.listDocuments(
        DATABASE_ID,
        WITHDRAW_REQUESTS_COLLECTION_ID,
        [
          Query.equal("status", "pending"),
          Query.orderDesc("$createdAt")
        ]
      );
      
    } catch (error) {
      console.error("Error fetching pending withdrawals:", error);
      throw error;
    }
  }

  /**
   * ADMIN: Approve Deposit
   */
  async approveDeposit(transactionId, internalUserId, amount) {
    try {
      // 1. Update transaction status
      // console.log("transactionId",transactionId, "internalUserId",internalUserId, "amount",amount,"current balance",internalUserId.wallet_balance,"current total deposit",internalUserId.total_deposit);
      const user = await this.databases.getDocument(
        DATABASE_ID,
        USERS_COLLECTION_ID,
        internalUserId
      );
      // console.log("user : ",user);  
      

      try {
        await this.databases.updateDocument(
          DATABASE_ID,
          WALLET_TRANSACTIONS_COLLECTION_ID,
          transactionId,
          { status: "approved" }
        );
      } catch (err1) {
        console.error("Error updating WALLET_TRANSACTIONS:", err1);
        throw new Error("WALLET_TX_UPDATE_FAILED: " + err1.message);
      }

  

      const currentBalance =  user.wallet_balance || 0;
      const currentTotalDeposit = user.total_deposit || 0;
      // console.log("currentBalance",currentBalance, "currentTotalDeposit",currentTotalDeposit);
      
      try {
        await this.databases.updateDocument(
          DATABASE_ID,
          USERS_COLLECTION_ID,
          user.$id,
          {
            wallet_balance: currentBalance + parseFloat(amount),
            total_deposit: currentTotalDeposit + parseFloat(amount)
          }
        );
      } catch (err2) {
        console.error("Error updating USERS_COLLECTION:", err2);
        throw new Error("USERS_UPDATE_FAILED: " + err2.message);
      }

      return true;
    } catch (error) {
      console.error("Error approving deposit:", error);
      throw error;
    }
  }

  /**
   * ADMIN: Reject Deposit
   */
  async rejectDeposit(transactionId, reason = "") {
    try {
      return await this.databases.updateDocument(
        DATABASE_ID,
        WALLET_TRANSACTIONS_COLLECTION_ID,
        transactionId,
        { 
          status: "rejected",
          note: reason
        }
      );
    } catch (error) {
      console.error("Error rejecting deposit:", error);
      throw error;
    }
  }

  /**
   * ADMIN: Approve Withdrawal
   */
  async approveWithdrawal(requestId, internalUserId, amount) {
    try {
      // 1. Update request status
      await this.databases.updateDocument(
        DATABASE_ID,
        WITHDRAW_REQUESTS_COLLECTION_ID,
        requestId,
        { status: "approved" }
      );

      // 2. Also log it in wallet_transactions
      await this.databases.createDocument(
        DATABASE_ID,
        WALLET_TRANSACTIONS_COLLECTION_ID,
        ID.unique(),
        {
          user_id: internalUserId,
          amount: parseFloat(amount),
          type: "withdraw",
          status: "approved",
        }
      );

      // 3. Update user wallet balance & total withdraw
      const user = await this.databases.getDocument(
        DATABASE_ID,
        USERS_COLLECTION_ID,
        internalUserId
      );

      const currentBalance = user.wallet_balance || 0;
      const currentTotalWithdraw = user.total_withdraw || 0;

      await this.databases.updateDocument(
        DATABASE_ID,
        USERS_COLLECTION_ID,
        user.$id,
        {
          wallet_balance: currentBalance - parseFloat(amount),
          total_withdraw: currentTotalWithdraw + parseFloat(amount)
        }
      );

      return true;
    } catch (error) {
      console.error("Error approving withdrawal:", error);
      throw error;
    }
  }

  /**
   * ADMIN: Reject Withdrawal
   */
  async rejectWithdrawal(requestId, internalUserId, amount, reason = "") {
    try {
      // Just mark request as rejected, balance wasn't deducted yet, so no need to refund
      return await this.databases.updateDocument(
        DATABASE_ID,
        WITHDRAW_REQUESTS_COLLECTION_ID,
        requestId,
        { 
          status: "rejected"
          // Add reason/note field to withdrawals if needed
        }
      );
    } catch (error) {
      console.error("Error rejecting withdrawal:", error);
      throw error;
    }
  }
}

export default new WalletService();
