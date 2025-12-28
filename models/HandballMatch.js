// models/HandballMatch.js

const mongoose = require('mongoose');

const MatchSchema = new mongoose.Schema({
    // اسم الفريق الأول (مثلاً A1)
    home: {
        type: String,
        required: true
    },
    // اسم الفريق التاني (مثلاً B2)
    away: {
        type: String,
        required: true
    },
    // نتيجة الفريق الأول (الأدمن بيدخلها)
    homeScore: {
        type: Number,
        default: 0
    },
    // نتيجة الفريق التاني
    awayScore: {
        type: Number,
        default: 0
    },
    // هل الماتش خلص واتحسبت نقاطه ولا لسه؟
    isFinished: {
        type: Boolean,
        default: false
    }
});

// بنصدر الموديل عشان نستخدمه في ملف الـ Routes
module.exports = mongoose.model('HandballMatch', MatchSchema);
