const express = require("express");
const { generateToken } = require("../controllers/braintree");

const router = express.Router();

const { protect, authorize } = require("../middleware/auth");

router.route("/get-token").get(
  protect,

  generateToken
);

module.exports = router;
