const express = require("express");

const router = express.Router();

const { protect, authorize } = require("../middleware/auth");
const {
  seatBooking,
  getBookedSeats,
  getAllBookedSeatsOwner,
  getSingleBookedSeat,
} = require("../controllers/seatBooked");
router.route("/:id").get(protect, getSingleBookedSeat);

router.route("/seat").post(protect, seatBooking).get(protect, getBookedSeats);
router
  .route("/booked")
  .get(protect, authorize("publisher", "admin"), getAllBookedSeatsOwner);

module.exports = router;
