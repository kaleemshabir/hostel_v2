const mongoose = require("mongoose");

const NotificationSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.ObjectId,
    ref:"User"
  },
  publisher: {
    type: mongoose.Schema.ObjectId,
    ref: "User"
  },
  message: {
    type: String
  },
  no_of:{
    type: String,
    enum: ["product", "hostel"]
  }
  
},{timestamps:true});

module.exports = mongoose.model("Notification", NotificationSchema);
