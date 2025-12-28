const mongoose = require("mongoose");

const HandballSettingsSchema = new mongoose.Schema({
  registrationOpen: {
    type: Boolean,
    default: true
  }
});

module.exports = mongoose.model("HandballSettings", HandballSettingsSchema);
