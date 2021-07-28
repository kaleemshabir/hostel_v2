const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');
const Review = require('../models/Review');
const Hostel = require('../models/Hostel');

// @desc      Get reviews
// @route     GET /api/v1/reviews
// @route     GET /api/v1/hostel/:hostelId/reviews
// @access    Public
exports.getReviews = asyncHandler(async (req, res, next) => {
  if (req.params.hostelId) {
    const reviews = await Review.find({ hostel: req.params.hostelId }).populate({
      path:"user",
      select:"photo"
    });

    return res.status(200).json({
      success: true,
      count: reviews.length,
      data: reviews,
    });
  } else {
    res.status(200).json(res.advancedResults);
  }
});

// @desc      Get single review
// @route     GET /api/v1/reviews/:id
// @access    Public
exports.getReview = asyncHandler(async (req, res, next) => {
  const review = await Review.findById(req.params.id).populate({
    path: 'hostel',
    select: 'name description',
  });

  if (!review) {
    return next(
      new ErrorResponse(
        `No review found with id the id of ${req.params.id}`,
        404
      )
    );
  }

  res.status(200).json({
    success: true,
    data: review,
  });
});

// @desc      Add review
// @route     POST /api/v1/hostels/:hostelId/reviews
// @access    Private
exports.addReview = asyncHandler(async (req, res, next) => {
  req.body.hostel = req.params.hostelId;
  req.body.user = req.user.id;

  const hostel = await Hostel.findById(req.params.hostelId);

  if (!hostel) {
    return next(
      new ErrorResponse(`No hostel with the id of ${req.params.hostelId}`, 404)
    );
  }

  const review = await Review.create(req.body);

  if (!review) {
    return next(
      new ErrorResponse(
        `No review found with id the id of ${req.params.id}`,
        404
      )
    );
  }

  res.status(201).json({
    success: true,
    data: review,
  });
});

// @desc      Update review
// @route     PUT /api/v1/reviews/:id
// @access    Private
exports.updateReview = asyncHandler(async (req, res, next) => {
  let review = await Review.findById(req.params.id);

  if (!review) {
    return next(
      new ErrorResponse(`No review with the id of ${req.params.id}`, 404)
    );
  }

  if (!review) {
    return next(
      new ErrorResponse(
        `No review found with id the id of ${req.params.id}`,
        404
      )
    );
  }

  // Make sure review belongs to user or user is admin
  if (review.user.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(new ErrorResponse('Not authorize to update review', 401));
  }

  review = await Review.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  res.status(201).json({
    success: true,
    data: review,
  });
});

// @desc      Delete review
// @route     DELETE /api/v1/reviews/:id
// @access    Private
exports.deleteReview = asyncHandler(async (req, res, next) => {
  let review = await Review.findById(req.params.id);

  if (!review) {
    return next(
      new ErrorResponse(
        `No review found with id the id of ${req.params.id}`,
        404
      )
    );
  }

  // Make sure review belongs to user or user is admin
  if (review.user.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(new ErrorResponse('Not authorize to update review', 401));
  }

  review = await Review.remove();

  res.status(201).json({
    success: true,
    data: {},
  });
});
