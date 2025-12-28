const mongoose = require('mongoose');

const EduTechSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true },
    password: { type: String, required: true }, // للتحقق
    userClass: { type: String, required: true },
    projectDescription: { type: String, required: true },
    projectLink: { type: String }, // لو هيرفع لينك مشروعه
    isWinner: { type: Boolean, default: false },
    registeredAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('EduTechRegistration', EduTechSchema);
