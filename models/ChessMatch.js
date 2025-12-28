const mongoose = require('mongoose');

const ChessMatchSchema = new mongoose.Schema({
    player1: {
        type: String,
        required: true
    },
    player2: {
        type: String,
        required: true
    },
    winner: { // اسم الفائز (هيكون فاضي لحد ما الأدمن يسجله)
        type: String,
        default: null
    },
    isFinished: { // هل الماتش خلص واتحسبت نقاطه ولا لسه؟
        type: Boolean,
        default: false
    }
});

module.exports = mongoose.model('ChessMatch', ChessMatchSchema);
