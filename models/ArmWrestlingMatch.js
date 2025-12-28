const mongoose = require('mongoose');

const MatchSchema = new mongoose.Schema({
    player1: { type: String, required: true },
    player2: { type: String, required: true },
    winner: { type: String, default: null }, // اسم الفائز
    isFinished: { type: Boolean, default: false }
});

module.exports = mongoose.model('ArmWrestlingMatch', MatchSchema);
