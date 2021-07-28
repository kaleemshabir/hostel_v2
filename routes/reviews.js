const express = require('express');
const {
  getReviews,
  getReview,
  addReview,
  updateReview,
  deleteReview,
} = require('../controllers/reviews');

const Review = require('../models/Review');

const router = express.Router({ mergeParams: true });

const advancedResults = require('../middleware/advancedResults');
const { protect, authorize } = require('../middleware/auth');

router
  .route('/')
  .get(
    advancedResults(Review, {
      path: 'hostel',
      select: 'name description',
    }),
    getReviews
  )
  .post(protect, authorize('user', 'admin','publisher'), addReview);

router
  .route('/:id')
  .get(getReview)
  .put(protect, authorize('user', 'admin','publisher'), updateReview)
  .delete(protect, authorize('user', 'admin','publisher'), deleteReview);

module.exports = router;
