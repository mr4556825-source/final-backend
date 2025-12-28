const mongoose = require("mongoose");

const FootballSettingsSchema = new mongoose.Schema({
  registrationOpen: {
    type: Boolean,
    default: true
  }
});

module.exports = mongoose.model("FootballSettings", FootballSettingsSchema);
