const mongoose = require("mongoose");

const ChessSettingsSchema = new mongoose.Schema({
  registrationOpen: {
    type: Boolean,
    default: true
  }
});

module.exports = mongoose.model("ChessSettings", ChessSettingsSchema);
