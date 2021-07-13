const mongoose = require("mongoose");

const BookedSeatSchema = new mongoose.Schema({
  amount: {
    type: Number,
    required: [true, "Please add a amount"],
    trim: true,
    maxlength: [50, "Amount cannot be more than 50 characters"],
  },

  transaction_id: {
    type: String,
    required: [true, "Please transaction id"],
  },
  seatNumber: {
    type: String,
  },
  roomNumber: {
    type: String,
  },
  hostel: {
    type: mongoose.Schema.ObjectId,
    ref: "Hostel",
  },
  HostelOwner: {
    type: mongoose.Schema.ObjectId,
    ref: "User",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },

  bookedBy: {
    type: mongoose.Schema.ObjectId,
    ref: "User",
    required: true,
  },
});

module.exports = mongoose.model("SeatBooked", BookedSeatSchema);
