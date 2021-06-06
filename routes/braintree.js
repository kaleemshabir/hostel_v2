const express = require("express");
const { generateToken, processPayment } = require("../controllers/braintree");

const router = express.Router();

const { protect, authorize } = require("../middleware/auth");

router.route("/get-token").get(
  protect,

  generateToken
);
router.route("/payment").post(
  protect,

  processPayment
);

module.exports = router;
