import { Databases, ID, Query } from "react-native-appwrite";
import client from "./client";

const DATABASE_ID = "6992ce540025a687a83e";
const TOURNAMENT_RESULTS_COLLECTION_ID = "tournament_results"; // Please create this collection in Appwrite!

class TournamentResultsService {
  databases = new Databases(client);

  /**
   * Fetch the leaderboard/results for a specific tournament.
   * We order by rank ascending (1st place first).
   */
  async getTournamentResults(tournamentId) {
    try {
      const response = await this.databases.listDocuments(
        DATABASE_ID,
        TOURNAMENT_RESULTS_COLLECTION_ID,
        [
          Query.equal("tournament_id", tournamentId),
          Query.orderAsc("rank")
        ]
      );
      return response.documents;
    } catch (error) {
      console.log("Error fetching tournament results:", error);
      return [];
    }
  }

  /**
   * Create a new result entry for a team or player
   * (Used by Admin Panel)
   */
  async createResult({ tournamentId, teamName, gameId, rank, killsScore, prize }) {
    try {
      const document = await this.databases.createDocument(
        DATABASE_ID,
        TOURNAMENT_RESULTS_COLLECTION_ID,
        ID.unique(),
        {
          tournament_id: tournamentId,
          team_name: teamName,
          game_id: gameId,
          rank: rank,
          kills_score: killsScore,
          prize: prize,
        }
      );
      return document;
    } catch (error) {
      console.log("Error creating tournament result:", error);
      throw error;
    }
  }
}

const resultsService = new TournamentResultsService();
export default resultsService;
