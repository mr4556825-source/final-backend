const mongoose = require('mongoose');

const ChessRegistrationSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User', // ربط بجدول اليوزرز الأساسي بتاعك
        required: true,
    },
    name: {
        type: String,
        required: true,
    },
    userClass: { // الفئة أو الوزن (لو موجودة في الـ Form)
        type: String,
        required: true,
    },
    registeredAt: {
        type: Date,
        default: Date.now,
    }
});

module.exports = mongoose.model('ChessRegistration', ChessRegistrationSchema);
