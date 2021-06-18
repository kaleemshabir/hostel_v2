const express = require('express');
var multer = require('multer');
const {
  getHostels,
  getHostel,
  createHostel,
  updateHostel,
  deleteHostel,
  getHostelInRadius,
  hostelPhotoUpload,
  getBookedSeats
} = require('../controllers/hostels');

const Hostel = require('../models/Hostel');

// Include other resource routers
const roomRouter = require('./rooms');
const reviewsRouter = require('./reviews');

var storage = multer.diskStorage({
  filename: function (req, file, callback) {
    callback(null, Date.now() + file.originalname);
  },
});
var imageFilter = function (req, file, cb) {
  // accept image files only
  if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/i)) {
    return cb(new Error('Only image files are allowed!'), false);
  }
  cb(null, true);
};
var upload = multer({ storage: storage, fileFilter: imageFilter });

const router = express.Router();

const { protect, authorize } = require('../middleware/auth');

// Re-route into other resource routers
router.use('/:hostelId/rooms', roomRouter);
router.use('/:hostelId/reviews', reviewsRouter);

router.route('/search')
.post( getHostels)
router
  .route('/')
  .post(protect, authorize('publisher', 'admin'), createHostel);
router
  .route('/:id')
  .get(getHostel)
  .put(protect, authorize('publisher', 'admin'), updateHostel)
  .delete(protect, authorize('publisher', 'admin'), deleteHostel);
router.put(
  '/:id/photo',
  protect,
  authorize('publisher', 'admin'),
  upload.single('file'),
  hostelPhotoUpload
);

router.route('/radius/:zipcode/:distance').get(getHostelInRadius);
router.route("/:id/booked-seats",).get(protect, getBookedSeats);
router.route("/:id/notifications").get(protect, authorize("publisher"), getNotifications);

module.exports = router;
