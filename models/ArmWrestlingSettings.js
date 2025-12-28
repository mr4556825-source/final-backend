const mongoose = require("mongoose");

const SettingsSchema = new mongoose.Schema({
  registrationOpen: {
    type: Boolean,
    default: true
  }
});

module.exports = mongoose.model("ArmWrestlingSettings", SettingsSchema);
