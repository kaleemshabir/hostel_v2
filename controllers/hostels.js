const Hostel = require("../models/Hostel");
const asyncHandler = require("../middleware/async");
const geocoder = require("../utils/geocoder");
const cloudinary = require("cloudinary");
const ErrorResponse = require("../utils/errorResponse");
const Room = require("../models/Room");
const Notification = require("../models/Notification");

cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// @desc        Get all hostels
// @route       GET /api/v1/hostels
// @access      Public
exports.getHostels = asyncHandler(async (req, res, next) => {
  let query;
  if (!req.body.search) {
    query = {};
  } else {
    query = {
      $or: [
        { name: { $regex: req.body.search, $options: "i" } },
        {
          address: { $regex: req.body.search, $options: "i" },
        },
        {
          hostelType: { $regex: req.body.search, $options: "i" },
        },
        {
          town: { $regex: req.body.search, $options: "i" },
        },
        {
          city: { $regex: req.body.search, $options: "i" },
        },
      ],
    };
  }
  let hostels = await Hostel.find(query)
    .populate({
      path: "room",
    })
    .sort([[("created_at", -1)]]).lean();

  return res.status(200).json({
    success: true,
    count: hostels.length,
    data: hostels || [],
  });
});

// @desc        Get single hostel
// @route       GET /api/v1/hostels/:id
// @access      Public
exports.getHostel = asyncHandler(async (req, res, next) => {
  const hostel = await Hostel.findById(req.params.id);

  if (!hostel) {
    return next(
      new ErrorResponse(`Hostel not found with id of ${req.params.id}`, 404)
    );
  }
  res.status(200).json({ success: true, data: hostel });
  // res.render('../views/profile', { hostel });
});

// @desc        Create hostel
// @route       POST /api/v1/hostels
// @access      Private
exports.createHostel = asyncHandler(async (req, res, next) => {
  // Add user to req.body
  req.body.user = req.user.id;

  // Check for published hostel
  const publishedHostel = await Hostel.findOne({ user: req.body.user });

  // if the user is not an admin, they can only add one hostel
  if (publishedHostel && req.user.role !== "admin") {
    next(
      new ErrorResponse(
        `The user with ID ${req.user.id} has already published a hostel`,
        400
      )
    );
  }
  const hostel = await Hostel.create(req.body);

  res.status(201).json({
    success: true,
    data: hostel,
  });
});

// @desc        Update hostel
// @route       POST /api/v1/hostels/:id
// @access      Private
exports.updateHostel = asyncHandler(async (req, res, next) => {
  let hostel = await Hostel.findById(req.params.id);
  if (!hostel) {
    return next(
      new ErrorResponse(`Hostel not found with id of ${req.params.id}`, 404)
    );
  }

  // Make sure user is hostel owner
  if (hostel.user.toString() !== req.user.id && req.user.role !== "admin") {
    next(
      new ErrorResponse(
        `User ${req.params.id} is not authorized to update this hostel`,
        401
      )
    );
  }

  hostel = await Hostel.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({ success: true, data: hostel });
});

// @desc        Delete hostel
// @route       POST /api/v1/hostels/:id
// @access      Private
exports.deleteHostel = asyncHandler(async (req, res, next) => {
  const hostel = await Hostel.findById(req.params.id);
  if (!hostel) {
    return next(
      new ErrorResponse(`Hostel not found with id of ${req.params.id}`, 404)
    );
  }

  // Make sure the user is hostel owner
  if (hostel.user.toString() !== req.user.id && req.user.role !== "admin") {
    return next(
      new ErrorResponse(
        `User ${req.params.id} is not authorized to delete this hostel`,
        401
      )
    );
  }
  hostel.remove();

  res.status(200).json({ success: true, data: {} });
});

// @desc        Get hostels within radius
// @route       GET /api/v1/hostels/radius/:zipcode/:distance
// @access      Public
exports.getHostelInRadius = asyncHandler(async (req, res, next) => {
  const { zipcode, distance } = req.params;

  // Get lat/lng from geocoder
  const loc = await geocoder.geocode(zipcode);
  const lat = loc[0].latitude;
  const lng = loc[0].longitude;

  // Calc radius using radians
  // Divide distance by radius of earth
  // Earth Radius = 3,963 mi / 6,378 km
  const radius = distance / 3963;

  const hostels = await Hostel.find({
    location: { $geoWithin: { $centerSphere: [[lng, lat], radius] } },
  }).sort([[("created_at", -1)]]);

  res.status(200).json({
    success: true,
    count: hostels.length,
    data: hostels,
  });
});

// @desc        Upload photo for hostel
// @route       PUT /api/v1/hostels/:id/photo
// @access      Private
exports.hostelPhotoUpload = asyncHandler(async (req, res, next) => {
  const hostel = await Hostel.findById(req.params.id);

  if (!hostel) {
    return next(
      new ErrorResponse(`Hostel not found with id of ${req.params.id}`, 404)
    );
  }

  // Make sure user is hostel owner
  if (hostel.user.toString() !== req.user.id && req.user.role !== "admin") {
    return next(
      new ErrorResponse(
        `User ${req.params.id} is not authorized to update this hostel`,
        401
      )
    );
  }

  cloudinary.uploader.upload(req.file.path, async function (result) {
    // add cloudinary url for the image to the campground object under image property
    req.body.photo = result.secure_url;
    //console.log(req.body.photo);
    const hostel = await Hostel.findByIdAndUpdate(req.params.id, req.body);

    if (!hostel) {
      return res.status(400).json({ success: false });
    }

    // res.redirect('/users');
    res.status(200).json({ success: true, data: hostel });
  });
});

exports.getBookedSeats = asyncHandler(async (req, res, next) => {
  const hostelId = req.params.id;
  const bookedSeats = await Room.find({
    hostel: hostelId,
    roommats: { $exists: true, $type: "array", $ne: [] },
  })
    .populate("roommats", "name email contactNumber photo")
    .select("roommats roomNumber");
  if (!bookedSeats) {
    return new ErrorResponse("No Booked seat found", 404);
  }
  return res.status(200).json({
    success: true,
    message: "Booked seats found successfully",
    data: bookedSeats,
  });
});
exports.getNotifications = async (req, res, next) => {
  const hostelId = req.params.id;
  const notifications = await Notification.find({ hostel: hostelId })
    .populate({
      path: "hostel",
      select: "name email phone",
    })
    .populate("user", "name email")
    .select("-publisher");
  return res.status(200).json({
    success: true,
    message:
      notifications.length > 0
        ? "Notifications found successfully"
        : "No Notification found",
    data: notifications || [],
  });
};
