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
  OwnerMessage: {
    type: String
  },
  Usermessage: {
    type: String
  },
  roomNumber:{
    type: String
  },
  transaction_id: {
    type: String,
    required: [true, "Please transaction id"],
  },
  amount: {
    type: Number,
    required: [true, "Please add a amount"],
    trim: true,
    maxlength: [50, "Amount cannot be more than 50 characters"],
  },
  cart:[
    {
      product:String,
      quantity: Number,
      price:Number
    }],
  no_of:{
    type: String,
    enum: ["product", "hostel"]
  }
  
},{timestamps:true});

module.exports = mongoose.model("Notification", NotificationSchema);
