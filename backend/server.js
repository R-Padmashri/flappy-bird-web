// === 1. INITIAL SETUP ===
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bodyParser = require("body-parser");
require("dotenv").config(); // Make sure your .env file is in the root of your project

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware setup
app.use(cors()); // Enables Cross-Origin Resource Sharing
app.use(bodyParser.json()); // Parses incoming request bodies as JSON

// === 2. CONNECT TO MONGODB ===
// Ensure process.env.MONGO_URI is correctly set in your .env file
// Example .env content: MONGO_URI="mongodb+srv://your_username:your_password@your_cluster_url/your_database_name?retryWrites=true&w=majority"
mongoose.connect(process.env.MONGO_URI) // Removed deprecated options
.then(() => console.log("✅ MongoDB connected successfully!"))
.catch(err => {
    console.error("❌ MongoDB connection error:", err.message);
    console.error("Please check your MONGO_URI in the .env file and ensure MongoDB is accessible (IP Whitelist, User Permissions).");
});

// === 3. SCHEMA ===
// Defines the structure for player documents in the MongoDB collection
const playerSchema = new mongoose.Schema({
    username: { type: String, required: true }, // Removed inline unique: true to avoid duplicate index warning
    score: { type: Number, required: true, default: 0 },
    unlockedEndless: { type: Boolean, required: true, default: false },
    date: { type: Date, default: Date.now } // Timestamp for when the score was last updated
});

// Create an index on username for faster lookups and unique enforcement
// This is the preferred way to define unique indexes
playerSchema.index({ username: 1 }, { unique: true });

const Player = mongoose.model("Player", playerSchema);

// === 4. ROUTES ===

// Route to submit a player's score
// Logic: ONLY submits if Endless mode is unlocked and it's a new high score.
app.post("/submit-score", async (req, res) => {
    // Destructure data from the request body
    const { username, score, unlockedEndless } = req.body;

    console.log(`Received score submission for: ${username}, Score: ${score}, Unlocked Endless: ${unlockedEndless}`);

    // Basic validation for incoming data
    if (!username || typeof score === 'undefined' || typeof unlockedEndless === 'undefined') {
        console.warn("Invalid submission: Missing required fields: username, score, or unlockedEndless.");
        return res.status(400).json({ error: "Missing required fields: username, score, or unlockedEndless." });
    }
    if (typeof username !== 'string' || typeof score !== 'number' || typeof unlockedEndless !== 'boolean') {
        console.warn("Invalid submission: Incorrect data types for username, score, or unlockedEndless.");
        return res.status(400).json({ error: "Invalid data types for username (string), score (number), or unlockedEndless (boolean)." });
    }

    // Crucial check: Only allow score submission if 'unlockedEndless' is true
    if (!unlockedEndless) {
        console.log(`Submission rejected for ${username}: Endless mode not unlocked.`);
        return res.status(403).json({ error: "Unlock Endless mode to submit scores." });
    }

    try {
        // Attempt to find an existing player by username
        const existingPlayer = await Player.findOne({ username });

        if (existingPlayer) {
            console.log(`Found existing player: ${existingPlayer.username}, Current Score: ${existingPlayer.score}`);
            // If player exists, check if the new score is a high score
            if (score > existingPlayer.score) {
                existingPlayer.score = score;
                existingPlayer.date = new Date(); // Update timestamp to current time
                await existingPlayer.save(); // Save the updated player document
                console.log(`🎉 New high score saved for ${username}: ${score}`);
                return res.status(200).json({ message: "🎉 New high score saved!" });
            } else {
                console.log(`Score for ${username} (${score}) is not a new high score (current: ${existingPlayer.score}). Not updated.`);
                return res.status(200).json({ message: "Not a new high score, not updated." });
            }
        } else {
            // If no existing player, create a new one
            const newPlayer = new Player({ username, score, unlockedEndless });
            await newPlayer.save(); // Save the new player document
            console.log(`✅ First score submitted for new player: ${username}, Score: ${score}`);
            return res.status(200).json({ message: "✅ First score submitted!" });
        }

    } catch (err) {
        // Log specific database errors
        if (err.code === 11000) { // MongoDB duplicate key error (e.g., if username unique constraint is violated)
            console.error(`❌ Duplicate key error for username: ${username}. This should not happen if findOne works correctly.`);
            return res.status(409).json({ error: "Username already exists with a score. Try updating instead." });
        }
        console.error("❌ Server error during score submission:", err.message);
        res.status(500).json({ error: "Server error during score submission. Please check server logs." });
    }
});

// All leaderboard scores
app.get("/leaderboard", async (req, res) => {
    console.log("Fetching leaderboard...");
    try {
        const allPlayers = await Player.find({ unlockedEndless: true }).sort({ score: -1 });
        console.log(`Found ${allPlayers.length} players for the leaderboard.`);
        res.status(200).json(allPlayers);
    } catch (err) {
        console.error("❌ Server error fetching leaderboard:", err.message);
        res.status(500).json({ error: "Server error fetching leaderboard. Please check server logs." });
    }
});

// NEW ROUTE: Get a single player's data by username
app.get("/player/:username", async (req, res) => {
    const username = req.params.username;
    console.log(`Fetching player data for: ${username}`);
    try {
        const player = await Player.findOne({ username });
        if (player) {
            console.log(`Found player ${username}: unlockedEndless = ${player.unlockedEndless}`);
            res.status(200).json(player);
        } else {
            console.log(`Player ${username} not found.`);
            res.status(404).json({ message: "Player not found." });
        }
    } catch (err) {
        console.error(`❌ Server error fetching player ${username}:`, err.message);
        res.status(500).json({ error: "Server error fetching player data." });
    }
});


// === 5. START SERVER ===
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
