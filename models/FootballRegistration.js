// models/FootballRegistration.js (مثال باستخدام Mongoose)

const mongoose = require('mongoose');

const FootballRegistrationSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User', // ربط بجدول اليوزرز الأساسي
        required: true,
    },
    name: {
        type: String,
        required: true,
    },
    team: { // ده حقل الفصل (A1, B8, C2, إلخ)
        type: String,
        required: true,
    },
    registeredAt: {
        type: Date,
        default: Date.now,
    }
});

module.exports = mongoose.model('FootballRegistration', FootballRegistrationSchema);
