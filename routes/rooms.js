const express = require('express');
const {
  getrooms,
  getroom,
  addRoom,
  updateRoom,
  deleteRoom,
  BookRoom,
  RemoveUser
} = require('../controllers/rooms');

const Room = require('../models/Room');
const advancedResults = require('../middleware/advancedResults');

const router = express.Router({ mergeParams: true });

const { protect, authorize } = require('../middleware/auth');

router
  .route('/')
  .get(
    advancedResults(Room, {
      path: 'hostel',
      select: 'name description',
    }),
    getrooms
  )
  .post(protect, authorize('publisher', 'admin', "user"), addRoom);

router
  .route('/:id')
  .get(getroom)
  .put(protect, authorize('publisher', 'admin','user'), updateRoom)
  .delete(protect, authorize('publisher', 'admin','user'), deleteRoom)
  router.route("/:id/book").post(protect, BookRoom);
  router.route("/:id/remove-user").put(protect, RemoveUser);



module.exports = router;
