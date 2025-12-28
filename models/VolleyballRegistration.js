// models/VolleyballRegistration.js

const mongoose = require('mongoose');

const VolleyballRegistrationSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User', // الربط بجدول اليوزرز الأساسي
        required: true,
    },
    name: {
        type: String,
        required: true,
    },
    team: { // حقل الفصل (A1 to C8)
        type: String,
        required: true,
    },
    registeredAt: {
        type: Date,
        default: Date.now,
    }
});

module.exports = mongoose.model('VolleyballRegistration' , VolleyballRegistrationSchema);
