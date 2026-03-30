import { Databases, ID, Query } from "react-native-appwrite";
import client from "./client";

const DATABASE_ID = process.env.EXPO_PUBLIC_APPWRITE_DATABASE_ID;
const TOURNAMENT_COLLECTION_ID = "tournaments";

class TournamentService {
  databases = new Databases(client);

  // Get all tournaments
  async getTournaments() {
    return this.databases.listDocuments(
      DATABASE_ID,
      TOURNAMENT_COLLECTION_ID,
      [Query.orderDesc("$createdAt")]
    );
  }

  // Get single tournament
  async getTournament(id) {
    return this.databases.getDocument(
      DATABASE_ID,
      TOURNAMENT_COLLECTION_ID,
      id
    );
  }

  // Create tournament
  async createTournament(data) {
    return this.databases.createDocument(
      DATABASE_ID,
      TOURNAMENT_COLLECTION_ID,
      ID.unique(),
      data
    );
  }

  // Delete tournament
  async deleteTournament(id) {
    return this.databases.deleteDocument(
      DATABASE_ID,
      TOURNAMENT_COLLECTION_ID,
      id
    );
  }
}

export default new TournamentService();