const mongoose = require('mongoose');

const ArmWrestlingRegistrationSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    name: {
        type: String,
        required: true,
    },
    userClass: { // تم تغيير الاسم من team لـ userClass ليتوافق مع الفرونت إند
        type: String,
        required: true,
    },
    registeredAt: {
        type: Date,
        default: Date.now,
    }
});

module.exports = mongoose.model('ArmWrestlingRegistration', ArmWrestlingRegistrationSchema);
