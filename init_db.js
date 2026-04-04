const sdk = require('node-appwrite');

// ============================================
// CONFIGURATION: Replace these with your server keys
// ============================================
const ENDPOINT = 'https://cloud.appwrite.io/v1'; // OR your self-hosted endpoint
const PROJECT_ID = 'your-project-id';
const API_KEY = 'your-server-api-key'; // Needs attributes, collections, documents scopes
const DATABASE_ID = process.env.EXPO_PUBLIC_APPWRITE_DATABASE_ID || 'your-database-id';

const client = new sdk.Client()
    .setEndpoint(ENDPOINT)
    .setProject(PROJECT_ID)
    .setKey(API_KEY);

const databases = new sdk.Databases(client);

async function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function createSchema() {
    console.log("Starting DB Schema creation for Challenges...");

    try {
        // --- 1. Create challenges Collection ---
        const challengesCollectionId = "team_challenges";
        try {
            await databases.createCollection(DATABASE_ID, challengesCollectionId, 'Challenges');
            console.log(`✅ Collection Created: ${challengesCollectionId}`);
            
            // Wait for collection to be ready before adding attributes
            await sleep(2000);

            // Add attributes
            await databases.createStringAttribute(DATABASE_ID, challengesCollectionId, "creator_id", 36, true);
            await databases.createStringAttribute(DATABASE_ID, challengesCollectionId, "game_name", 100, true);
            // Array of strings for game ids
            await databases.createStringAttribute(DATABASE_ID, challengesCollectionId, "game_ids", 100, false, null, true);
            await databases.createStringAttribute(DATABASE_ID, challengesCollectionId, "mode", 50, true); // solo, duo, team
            await databases.createStringAttribute(DATABASE_ID, challengesCollectionId, "map", 100, true);
            await databases.createIntegerAttribute(DATABASE_ID, challengesCollectionId, "challenge_price", true, 0, 1000000);
            await databases.createStringAttribute(DATABASE_ID, challengesCollectionId, "status", 50, true); // open, ongoing, completed
            await databases.createStringAttribute(DATABASE_ID, challengesCollectionId, "selected_opponent_id", 36, false);
            await databases.createStringAttribute(DATABASE_ID, challengesCollectionId, "room_id", 100, false);
            await databases.createStringAttribute(DATABASE_ID, challengesCollectionId, "room_password", 100, false);
            
            console.log("⏳ Waiting for attributes to propagate...");
            await sleep(3000);
            console.log(`✅ Attributes added to ${challengesCollectionId}`);

        } catch (err) {
            console.log(`⚠️ Note on ${challengesCollectionId}:`, err.message);
        }

        // --- 2. Create challenge_participants Collection ---
        const participantsCollectionId = "team_challenge_participants";
        try {
            await databases.createCollection(DATABASE_ID, participantsCollectionId, 'Challenge Participants');
            console.log(`✅ Collection Created: ${participantsCollectionId}`);
            
            await sleep(2000);

            await databases.createStringAttribute(DATABASE_ID, participantsCollectionId, "challenge_id", 36, true);
            await databases.createStringAttribute(DATABASE_ID, participantsCollectionId, "user_id", 36, true);
            await databases.createStringAttribute(DATABASE_ID, participantsCollectionId, "status", 50, true); // pending, accepted, rejected, selected
            
            console.log("⏳ Waiting for attributes to propagate...");
            await sleep(3000);
            console.log(`✅ Attributes added to ${participantsCollectionId}`);

        } catch (err) {
            console.log(`⚠️ Note on ${participantsCollectionId}:`, err.message);
        }

        // --- 3. Create match_results Collection ---
        const resultsCollectionId = "team_match_results";
        try {
            await databases.createCollection(DATABASE_ID, resultsCollectionId, 'Match Results');
            console.log(`✅ Collection Created: ${resultsCollectionId}`);
            
            await sleep(2000);

            await databases.createStringAttribute(DATABASE_ID, resultsCollectionId, "challenge_id", 36, true);
            await databases.createStringAttribute(DATABASE_ID, resultsCollectionId, "user_id", 36, true);
            await databases.createStringAttribute(DATABASE_ID, resultsCollectionId, "screenshot_url", 500, true);
            
            console.log("⏳ Waiting for attributes to propagate...");
            await sleep(3000);
            console.log(`✅ Attributes added to ${resultsCollectionId}`);

        } catch (err) {
            console.log(`⚠️ Note on ${resultsCollectionId}:`, err.message);
        }

        console.log("🎉 Schema generation completed successfully!");

    } catch (error) {
        console.error("❌ Fatal Error creating schema:", error);
    }
}

createSchema();
