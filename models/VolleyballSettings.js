const mongoose = require("mongoose");

const VolleyballSettingsSchema = new mongoose.Schema({
  registrationOpen: {
    type: Boolean,
    default: true
  }
});

module.exports = mongoose.model("VolleyballSettings", VolleyballSettingsSchema);
