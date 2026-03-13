import { Databases, ID, Query } from "react-native-appwrite";
import client from "./client";

const DATABASE_ID = "6992ce540025a687a83e";
const SUPPORT_TICKETS_COLLECTION_ID = "support_tickets";

class SupportService {
  databases = new Databases(client);

  // 1. Create a new support ticket (User)
  async createTicket({ userId, subject, message }) {
    try {
      return await this.databases.createDocument(
        DATABASE_ID,
        SUPPORT_TICKETS_COLLECTION_ID,
        ID.unique(),
        {
          userId,
          subject,
          message,
          status: "open", // Default status
        }
      );
    } catch (error) {
      console.error("Error creating ticket:", error);
      throw error;
    }
  }

  // 2. Get all tickets for a specific user (User)
  async getUserTickets(userId) {
    try {
      return await this.databases.listDocuments(
        DATABASE_ID,
        SUPPORT_TICKETS_COLLECTION_ID,
        [
          Query.equal("userId", userId),
          Query.orderDesc("$createdAt")
        ]
      );
    } catch (error) {
      console.error("Error fetching user tickets:", error);
      throw error;
    }
  }

  // 3. Get a single ticket by ID
  async getTicket(ticketId) {
    try {
      return await this.databases.getDocument(
        DATABASE_ID,
        SUPPORT_TICKETS_COLLECTION_ID,
        ticketId
      );
    } catch (error) {
      console.error("Error fetching ticket:", error);
      throw error;
    }
  }

  // 4. Get all tickets (Admin)
  async getAllTickets(statusFilter = null) {
    try {
      const queries = [Query.orderDesc("$createdAt")];
      if (statusFilter) {
        queries.push(Query.equal("status", statusFilter));
      }
      return await this.databases.listDocuments(
        DATABASE_ID,
        SUPPORT_TICKETS_COLLECTION_ID,
        queries
      );
    } catch (error) {
      console.error("Error fetching all tickets:", error);
      throw error;
    }
  }

  // 5. Update a ticket with admin reply and status change (Admin)
  async replyToTicket(ticketId, adminReply, status = "resolved") {
    try {
      return await this.databases.updateDocument(
        DATABASE_ID,
        SUPPORT_TICKETS_COLLECTION_ID,
        ticketId,
        {
          adminReply,
          status,
        }
      );
    } catch (error) {
      console.error("Error replying to ticket:", error);
      throw error;
    }
  }
}

export default new SupportService();
