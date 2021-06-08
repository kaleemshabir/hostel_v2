const asyncHandler = require("../middleware/async");
const ErrorResponse = require("../utils/errorResponse");
const SeatBooked = require("../models/SeatBooked");

// @desc        Get all seats for a user
// @route       GET /api/v1/seats/seat
// @access      Public
exports.getBookedSeats = asyncHandler(async (req, res, next) => {
  const seatsBooked = await SeatBooked.find({ bookedBy: req.user._id }).sort([
    [("created_at", -1)],
  ]);
  if (!seatsBooked) {
    return next(new ErrorResponse("No Booked seats found", 404));
  }

  res.status(200).json({
    success: true,
    data: seatsBooked,
  });
});
// @desc        Get all booked seats for owner
// @route       GET /api/v1/seats
// @access      Public
exports.getAllBookedSeatsOwner = asyncHandler(async (req, res, next) => {
  const seatsBooked = await SeatBooked.find({ Hostelowner: req.user._id }).sort(
    [[("created_at", -1)]]
  );
  if (!seatsBooked) {
    return next(new ErrorResponse("No Booked seats found", 404));
  }

  res.status(200).json({
    success: true,
    data: seatsBooked,
  });
});
// @desc        Get single Booked Seat
// @route       GET /api/v1/seats/:id
// @access      Public
exports.getSingleBookedSeat = asyncHandler(async (req, res, next) => {
  const seat = await SeatBooked.findById(req.params.id)
    .populate({
      path: "Hostelowner",
      select: "name email contactNumber",
    })
    .populate({
      path: "hostel",
      select: "name email address city",
    });

  if (!seat) {
    return next(
      new ErrorResponse(
        `No booked seat found with the id of ${req.params.id}`,
        404
      )
    );
  }

  res.status(200).json({
    success: true,
    data: seat,
  });
});

// @desc       Book Hostel Seat
// @route      POST /api/v1/seats/seat
// @access     Private
exports.seatBooking = asyncHandler(async (req, res, next) => {
  req.body.user = req.user.id;
  const data = {
    title: req.body.amount,
    transaction_id: req.body.transaction_id,
    hostel: req.body.hostel,
    HostelOwner: req.body.HostelOwner,
    seatNumber: req.body.seatNumber,
    roomNumber: req.body.roomNumber,
    address: req.body.address,
    bookedBy: req.body.bookedBy,
  };
  await SeatBooked.create(data);

  res.status(200).json({
    success: true,
    message: "Seat Booked successfully",
  });
});
