const {
  register,
  login,
  getMe,
  updatedetails,
  updatePassword,
  confirmEmail
} = require('../controllers/auth');
const express = require('express');

const router = express.Router();
const { protect } = require('../middleware/auth');

router.post('/register', register);
router.post('/login', login);
router.get('/me', protect, getMe);
router.put('/updatedetails', protect, updatedetails);
router.put('/updatepassword', protect, updatePassword);
router.get('/confirmemail', confirmEmail);

module.exports = router;
