const mongoose = require("mongoose");

const EduTechSettingsSchema = new mongoose.Schema({
  registrationOpen: {
    type: Boolean,
    default: true
  }
});

module.exports = mongoose.model("EduTechSettings", EduTechSettingsSchema);
