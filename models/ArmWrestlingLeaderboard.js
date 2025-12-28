const mongoose = require('mongoose');

const ArmWrestlingLeaderboardSchema = new mongoose.Schema({
    player: { type: String, required: true, unique: true },
    played: { type: Number, default: 0 },
    won: { type: Number, default: 0 },
    lost: { type: Number, default: 0 }
});

// بدل ما نعمل overwrite
module.exports = mongoose.models.ArmWrestlingLeaderboard || mongoose.model('ArmWrestlingLeaderboard', ArmWrestlingLeaderboardSchema);
