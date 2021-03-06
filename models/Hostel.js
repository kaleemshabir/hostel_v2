const mongoose = require('mongoose');
const slugify = require('slugify');
//const geocoder = require('../utils/geocoder');
//for commit

const HostelSchema = new mongoose.Schema({
name: {
type: String,
required: [true, 'Please add a name'],
unique: true,
trim: true,
maxlength: [50, 'Name cannot be more than 50 characters'],
},
slug: String,
description: {
type: String,
required: [true, 'Please add a description'],
maxlength: [500, 'Description cannot be more than 500 characters'],
},

phone: {
type: String,
maxlength: [20, 'Phone number cannot be longer than 20 characters'],
},
email: {
type: String,
match: [
/^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
'Please add a valid email',
],
},
address: {
type: String,
required: [true, 'Please add an address'],
},
longitude: {
type: String,
required: [true, 'Please add an corrdinates'],
},
latitude: {
type: String,
required: [true, 'Please add an corrdinates'],
},
town: {
type: String,
required: [true, 'Plz add an town'],
},
city: {
type: String,
required: [true, 'Please add an city'],
},



// location: {
// // GeoJSON Point
// type: {
// type: String,
// enum: ['Point'],
// //required: true,
// },
// coordinates: {
// type: [Number],
// //required: true,
// index: '2dsphere',
// },
// formattedAddress: String,
// street: String,
// city: String,
// state: String,
// zipcode: String,
// country: String,
// },
averageRating: {
type: Number,
min: [1, 'Rating must be atleat 1'],
max: [5, 'Rating must can not be more than 10'],
},
photo: String,

// mess: {
// type: String,
// default: true,
// },
// typeOfMealServed: {
// type: [String],
// enum: ['Breakfast', 'Lunch', 'Dinner'],
// },
hostelType: {
type: String,

},
// guestEntrance: {
// type: Boolean,
// default: false,
// },
// advanceSecurity: Number,
// wifi: {
// type: Boolean,
// default: true,
// },

// laundary: {
// type: Boolean,
// default: true,
// },

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

// Create hostel slug from the name
HostelSchema.pre('save', function (next) {
this.slug = slugify(this.name, { lower: true });
// console.log(`Slugify ran `, this.slug);
next();
});

// Geocode & create location field

// HostelSchema.pre('save', async function (next) {
// const loc = await geocoder.geocode(this.address);
// this.location = {
// type: 'Point',
// coordinates: [loc[0].longitude, loc[0].latitude],
// formattedAddress: loc[0].formattedAddress,
// street: loc[0].streetName,
// city: loc[0].city,
// zipcode: loc[0].zipcode,
// country: loc[0].country,
// };
// // Do not save address in DB
// this.address = undefined;

// next();
// });

// Cascade delete courses when a hostel is deleted
HostelSchema.pre('remove', async function (next) {
await this.model('Room').deleteMany({ hostel: this._id });
});

module.exports = mongoose.model('Hostel', HostelSchema);