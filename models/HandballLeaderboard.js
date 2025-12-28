// models/HandballLeaderboard.js
const mongoose = require('mongoose');

const LeaderboardSchema = new mongoose.Schema({
    team: { type: String, required: true, unique: true },
    played: { type: Number, default: 0 },
    won: { type: Number, default: 0 },
    drawn: { type: Number, default: 0 },
    lost: { type: Number, default: 0 },
    goalsFor: { type: Number, default: 0 },
    goalsAgainst: { type: Number, default: 0 },
    points: { type: Number, default: 0 }
});

module.exports = mongoose.model('HandballLeaderboard', LeaderboardSchema);
