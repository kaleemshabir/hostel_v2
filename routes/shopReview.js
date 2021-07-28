const express = require('express');
const {
  getReviews,
  getReview,
  addReview,
  updateReview,
  deleteReview,
} = require('../controllers/shopReviews');

const router = express.Router({ mergeParams: true });
const { protect, authorize } = require('../middleware/auth');

router
  .route('/')
  .get(
    getReviews
  )
  .post(protect, authorize('user', 'admin','publisher'), addReview);

router
  .route('/:id')
  .get(getReview)
  .put(protect, authorize('user', 'admin','publisher'), updateReview)
  .delete(protect, authorize('user', 'admin','publisher'), deleteReview);

module.exports = router;
