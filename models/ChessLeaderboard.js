const mongoose = require('mongoose');

const ChessLeaderboardSchema = new mongoose.Schema({
    player: {
        type: String,
        required: true, // مهم جداً يكون Required عشان الإيرور اللي كان بيطلعلك زمان
        unique: true // عشان كل لاعب يتسجل مرة واحدة بس
    },
    played: {
        type: Number,
        default: 0
    },
    won: {
        type: Number,
        default: 0
    },
    lost: {
        type: Number,
        default: 0
    }
});

module.exports = mongoose.model('ChessLeaderboard', ChessLeaderboardSchema);
