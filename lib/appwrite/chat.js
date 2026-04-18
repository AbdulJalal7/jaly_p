import { Databases, ID, Query, Permission, Role } from "react-native-appwrite";
import client from "./client";

const DATABASE_ID = process.env.EXPO_PUBLIC_APPWRITE_DATABASE_ID;
const CHATS_COLLECTION_ID = "chats";
const MESSAGES_COLLECTION_ID = "messages";

class ChatService {
  databases = new Databases(client);

  /**
   * Get an existing chat between two users, or create a new one.
   */
  async createOrGetChat(currentUserId, targetUserId) {
    try {
      // 1. Try to find existing chat where both are participants
      const response = await this.databases.listDocuments(
        DATABASE_ID,
        CHATS_COLLECTION_ID,
        [
          Query.contains("participants", [currentUserId]),
          // Appwrite array indexing with search is tricky, an alternative is querying manually or 
          // querying chats for one user and filtering in memory, but Appwrite supports querying array elements.
          // Another way: Query.contains("participants", [currentUserId]) and filter.
        ]
      );

      // In memory filter to ensure targetUserId is also in the participants array
      const existingChat = response.documents.find(
        doc => doc.participants.includes(currentUserId) && doc.participants.includes(targetUserId)
      );

      if (existingChat) {
        return existingChat;
      }

      // 2. If no existing chat, create a new one.
      const newChat = await this.databases.createDocument(
        DATABASE_ID,
        CHATS_COLLECTION_ID,
        ID.unique(),
        {
          participants: [currentUserId, targetUserId],
          last_message: "",
          last_message_time: new Date().toISOString(),
        }
      );

      return newChat;
    } catch (error) {
      console.error("Error in createOrGetChat:", error);
      throw error;
    }
  }

  /**
   * Send a new message in a chat
   */
  async sendMessage(chatId, senderId, receiverId, message, type = "text") {
    try {
      const timestamp = new Date().toISOString();
      const newMessage = await this.databases.createDocument(
        DATABASE_ID,
        MESSAGES_COLLECTION_ID,
        ID.unique(),
        {
          chat_id: chatId,
          sender_id: senderId,
          receiver_id: receiverId,
          message: message,
          type: type,
          created_at: timestamp,
        }
      );

      // Update the chat's last message
      await this.databases.updateDocument(
        DATABASE_ID,
        CHATS_COLLECTION_ID,
        chatId,
        {
          last_message: type === "image" ? "📷 Image" : message,
          last_message_time: timestamp,
        }
      );

      return newMessage;
    } catch (error) {
      console.error("Error in sendMessage:", error);
      throw error;
    }
  }

  /**
   * Fetch messages for a specific chat
   */
  async getMessages(chatId, limit = 20, offset = 0) {
    try {
      const queries = [
        Query.equal("chat_id", chatId),
        Query.orderDesc("created_at"),
        Query.limit(limit),
      ];
      
      if (offset > 0) {
        queries.push(Query.offset(offset));
      }

      const response = await this.databases.listDocuments(
        DATABASE_ID,
        MESSAGES_COLLECTION_ID,
        queries
      );

      return response.documents;
    } catch (error) {
      console.error("Error in getMessages:", error);
      throw error;
    }
  }
}

export default new ChatService();
