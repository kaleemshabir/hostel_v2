const mongoose = require("mongoose");

const NotificationSchema = new mongoose.Schema({
  title: {
    type: String,
    required:[true, "Please add title"]
  },

  body: {
    type: String,
    required: [true, "Please add a body"],
  },
  createdAt: {
    type: Date,
    default: Date.now(),
  },
  
  user: {
    type: mongoose.Schema.ObjectId,
    ref:"User"
  }
});

module.exports = mongoose.model("Notification", NotificationSchema);
