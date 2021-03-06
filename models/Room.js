const mongoose = require('mongoose');

const RoomSchema = new mongoose.Schema({
  img: {
    type: Array,
    default:[]
  },
  roomNumber: {
    type: Number,
    // required: [true, 'Please add  RoomNumber'],
  },
  description: {
    type: String,
    required: [true, 'Please add a description'],
  },
  floor: {
    type: String,
    required: [true, 'Please add flour of room'],
  },
  
  seater: {
    type: Number,
    required: [true, 'Please add no of seats in a rooms'],
  },
  roommats: [
    {
      type: mongoose.Schema.ObjectId,
      ref: "User"
    }
  ],
  
  availableSeats: {
    type: String,
  },
  
  price: {
    type: String,
    required: [true, 'Please add price per seat'],
  },

  ac: {
    type: Boolean,
    default: false,
  },
  tv: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now(),
  },

  hostel: {
    type: mongoose.Schema.ObjectId,
    ref: 'Hostel',
    // required: true,
  },
  user: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true,
  },
});

module.exports = mongoose.model('Room', RoomSchema);
