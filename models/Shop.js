const mongoose = require('mongoose');
const ShopSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please add a name'],
    trim: true,
    maxlength: [50, 'Name cannot be more than 50 characters'],
  },
  description: {
    type: String,
    required: [true, 'Please add a description'],
    maxlength: [500, 'Description cannot be more than 500 characters'],
  },

  phone: {
    type: String,
    maxlength: [20, 'Phone number cannot be longer than 20 characters'],
  },
  address: {
    type: String,
    required: [true, 'Please add an address'],
  },
  longitude: String,
  latitude: String,
  town: {
    type: String,
    required: [true, 'Plz add an town'],
    },
    city: {
    type: String,
    required: [true, 'Please add an city'],
    },
  photo: String,
  
  createdAt: {
    type: Date,
    default: Date.now,
  },

  user: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true,
  },
});


module.exports = mongoose.model('Shop', ShopSchema);