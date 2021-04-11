const asyncHandler = require("../middleware/async");
const ErrorResponse = require("../utils/errorResponse");
var multer = require("multer");
var fs = require("fs");
const Room = require("../models/Room");
const Hostel = require("../models/Hostel");
const admin = require("firebase-admin");
const Notification = require("../models/Notification");
const User = require("../models/User");
const serviceAccount = require("../feroshgah.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

// @desc        Get all rooms
// @route       GET /api/v1/rooms
//@route        GET /api/v1/hostels/:hostelId/rooms
// @access      Public
exports.getrooms = asyncHandler(async (req, res, next) => {
  if (req.params.hostelId) {
    const rooms = await Room.find({ hostel: req.params.hostelId });

    return res.status(200).json({
      success: true,
      count: rooms.length,
      data: rooms,
    });
  } else {
    res.status(200).json(res.advancedResults);
  }
});

// @desc        Get single room
// @route       GET /api/v1/rooms/:id
// @access      Public
exports.getroom = asyncHandler(async (req, res, next) => {
  const room = await Room.findById(req.params.id).populate({
    path: "hostel",
    select: "name description",
  });

  if (!room) {
    return next(
      new ErrorResponse(`No course with the id of ${req.params.id}`, 404)
    );
  }

  res.status(200).json({
    success: true,
    data: room,
  });
});

// @desc       Add room
// @route      POST /api/v1/hostels/:hostelId/rooms
// @access     Private
exports.addRoom = asyncHandler(async (req, res, next) => {
  req.body.hostel = req.params.hostelId;
  req.body.user = req.user.id;

  const hostel = await Hostel.findById(req.params.hostelId);
  if (!hostel) {
    return next(
      new ErrorResponse(`No hostel with the id of ${req.params.hostelId}`, 404)
    );
  }

  // Make sure user is hostel owner
  if (hostel.user.toString() !== req.user.id && req.user.role !== "admin") {
    return next(
      new ErrorResponse(
        `User ${req.user.id} is not authorized to add a course to hostel ${hostel._id}`,
        400
      )
    );
  }
  const rooms = await Room.find({ hostel: req.params.hostelId });
  let totalRooms = rooms.length;
  console.log(`totalRooms in db: ${totalRooms}`);

  let count = totalRooms + 1;
  console.log(`count: ${count}`);
  req.body.roomNumber = count;
  console.log(`roomNum: ${req.body.roomNumber}`);

  const room = await Room.create(req.body);

  res.status(200).json({
    success: true,
    data: room,
  });
});

// @desc       Update room
// @route      PUT /api/v1/rooms/:id
// @access     Private
exports.updateRoom = asyncHandler(async (req, res, next) => {
  let room = await Room.findById(req.params.id);

  if (!room) {
    return next(
      new ErrorResponse(`No room with the id of ${req.params.id}`, 404)
    );
  }

  // Make sure user is room owner
  if (room.user.toString() !== req.user.id && req.user.role !== "admin") {
    return next(
      new ErrorResponse(
        `User ${req.user.id} is not authorized to update room`,
        400
      )
    );
  }

  room = await Room.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({
    success: true,
    data: room,
  });
});

// @desc       Delete room
// @route      DELETE /api/v1/rooms/:id
// @access     Private
exports.deleteRoom = asyncHandler(async (req, res, next) => {
  let room = await Room.findById(req.params.id);

  if (!room) {
    return next(
      new ErrorResponse(`No room with the id of ${req.params.id}`, 404)
    );
  }

  // Make sure user is room owner
  if (room.user.toString() !== req.user.id && req.user.role !== "admin") {
    return next(
      new ErrorResponse(
        `User ${req.user.id} is not authorized to delete room`,
        400
      )
    );
  }

  await Room.deleteOne();

  res.status(200).json({
    success: true,
    data: {},
  });
});

//@desc   Book room
//@route  POST /api/v1/rooms/:id/book
//@access Public
exports.BookRoom = async (req, res, next) => {
  // const {title, body} = req.body;
 
  let room = await Room.findById(req.params.id);
  if (room.roommats.includes(req.user.id)) {
    return res
      .status(400)
      .json({ success: false, message: "Already booked this room" });
  }
  if (!room) {
    return next(new ErrorResponse(`Room not found with this ${req.params.id}`));
  }
  // room.roommats.length < room.seater
  if (room.roommats.length < room.seater) {
    // room = await Room.findByIdAndUpdate(
    //   req.user.id,
    //   // { $push: { roommats: req.user.id } },
    //   {seater: 5},
    //   {
    //     new: true,
    //     runValidators: true,
    //   }
    // );
    room.roommats.push(req.user.id);
    await room.save();

    if (!room) {
      return next(new ErrorResponse("Room not booked", 400));
    }
    const hostelId = room.hostel;
    let hostelOwner;
    const hostel = await Hostel.findById(hostelId);
    if (hostel) {
      hostelOwner = hostel.user;
    }
    const user = await User.findById(hostelOwner);
    await Notification.create({
      user: req.user.id,
    });
    // const token = user.fcmToken;
    var payload = {
      notification: {
        title: "Room Booking",
        body: `There is room booking request from, ${req.user.name}`,
      },
    };
    const token =
      "cTwmHKhqRSyuvUfY9KdG9-:APA91bFlslBumNDuKiStZpVippsUOcSUY1bnKp9egjPAaVzU7cCR-HPX0IJilneSo_bkZ0bV_trq06fTTRAevqvy6EfhTcoBO8yJL4FocQ_P46rt_EUoTsM4_hWl47yc20hNQCzikdsT";
    await admin.messaging().sendToDevice(token, payload);

    return res.status(201).json({
      success: true,
      message: "Room booked successfully",
    });
  } else {
    return next(new ErrorResponse("Room Already booked", 401));

    // return res.status(400).json({
    //   success: false,
    //   message: "Room already full, try another",
    // });
  }
};
