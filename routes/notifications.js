const express = require("express");
const router = express.Router();
const {
  getNotifications
} = require('../controllers/notifications');
const { protect, authorize } = require('../middleware/auth');

router.route("/").get(protect, authorize("publisher",'admin','user'), getNotifications);
module.exports = router;