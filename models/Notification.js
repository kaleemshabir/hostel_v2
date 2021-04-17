const mongoose = require("mongoose");

const NotificationSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.ObjectId,
    ref:"User"
  },
  roomNumber: {
    
  },
  publisher: {
    type: mongoose.Schema.ObjectId,
    ref: "User"
  }
},{timestamps:true});

module.exports = mongoose.model("Notification", NotificationSchema);
