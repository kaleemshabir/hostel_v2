const mongoose = require('mongoose');

const RoomSchema = new mongoose.Schema({
  img: {
    type: Array,
    default:[]
  },
  roomNumber: {
    type: String,
    required: [true, 'Please add  RoomNumber'],
    // unique:true
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
   String
  ],
  
  availableSeats: {
    type: Number,
  },
  remaining_seats:{
    type:Number
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
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Hostel',
    // required: true,
  },
  user: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true,
  },
});

// RoomSchema.pre("save", function(next) {
// this.availableSeats = this.seater;
// next();
// });

module.exports = mongoose.model('Room', RoomSchema);
