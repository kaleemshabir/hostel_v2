const Hostel = require('../models/Hostel');
const asyncHandler = require('../middleware/async');
const ErrorResponse = require('../utils/errorResponse');
const User = require('../models/User');
const Shop = require('../models/Shop');
const Job = require('../models/Job');
const sendEmail = require('../utils/sendMail');
const crypto = require('crypto');


// @desc        Register user
// @route       POST /api/v1/auth/register
// @access      Public
exports.register = asyncHandler(async (req, res, next) => {
  const { name, email, password, role, photo,contactNumber } = req.body;

  let user = await User.findOne({email:email});
  if(user) {
    return res.status(400).json({
      success:false,
      message:"Email already exists, try another"
    })
  }
  
  // Create user
   user = await User.create({
    name,
    email,
    password,
    role,
    photo,
    contactNumber
  });
  // grab token and send to email
  const confirmEmailToken = user.generateEmailConfirmToken();

  // Create reset url
  const confirmEmailURL = `${req.protocol}://${req.get(
    'host',
  )}/api/v1/auth/confirmemail?token=${confirmEmailToken}`;

  const message = `You are receiving this email because you need to confirm your email address. Please make a GET request to: \n\n ${confirmEmailURL}`;

  user.save({ validateBeforeSave: false });

  const sendResult = await sendEmail({
    email: user.email,
    subject: 'Email confirmation token',
    message,
  });
  sendTokenResponse(user, 200, res);
});

// @desc        Login user
// @route       POST /api/v1/auth/login
// @access      Public
exports.login = asyncHandler(async (req, res, next) => {
  const { email, password, fcmToken } = req.body;
  // Validate emial & password
  if (!email || !password) {
    return next(new ErrorResponse(`Please provide an email and password`, 400));
  }
  user = await User.find({email:email, isEmailConfirmed:true});
 
  if(!user) {

    return res.status(400).json({success:false, message:"Please check your email and click on given link to verify"});
  }


  // Check for user
   user = await User.findOne({ email }).select('+password');
  if (!user) {
    return next(new ErrorResponse('Invalid credetials ', 401));
  }

  // Check if password matches
  const isMatch = await user.matchPassword(password);


  if (!isMatch) {
    return next(new ErrorResponse('Invalid credetials ', 401));
  }
  user.fcmToken = fcmToken;
  await user.save();

  sendTokenResponse(user, 200, res);
});

// Get token from model, create cookie and send response
const sendTokenResponse = (user, statusCode, res) => {
  // Create token
  const token = user.getSignedJwtToken();

  const options = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRE * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
  };

  if (process.env.NODE_ENV === 'production') {
    options.secure = true;
  }


  res.status(statusCode).cookie('token', token, options).json({
    success: true,
    token,
  });
};

// @desc        Get logged in user
// @route       POST /api/v1/auth/me
// @access      Private
exports.getMe = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user.id);
   const hostel = await Hostel.find({user: req.user.id});
   const shop = await Shop.findOne({user: req.user.id});
   const job = await Job.find({postedBy: req.user.id});
  res.status(200).json({ success: true, data:{ user, hostel, shop, job}} );
});

// @desc        Update user details
// @route       PUT /api/v1/auth/updatedetails
// @access      Private
exports.updatedetails = asyncHandler(async (req, res, next) => {
  const fieldsToUpdate = {
    name: req.body.name,
    photo:req.body.photo
  };
  const user = await User.findByIdAndUpdate(req.user.id, fieldsToUpdate, {
    new: true,
    runValidators: true,
  });
  res.status(200).json({ success: true, data: user });
});

// @desc        Update password
// @route       PUT /api/v1/auth/updatepassword
// @access      Private
exports.updatePassword = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user.id).select('+password');

  if (!(await user.matchPassword(req.body.currentPassword))) {
    return next(new ErrorResponse('Password in incorrect ', 401));
  }

  user.password = req.body.newPassword;
  await user.save();
  sendTokenResponse(user, 200, res);
});

/**
 * @desc    Confirm Email
 * @route   GET /api/v1/auth/confirmemail
 * @access  Public
 */
 exports.confirmEmail = asyncHandler(async (req, res, next) => {
  // grab token from email
  const { token } = req.query;

  if (!token) {
    return next(new ErrorResponse('Invalid Token', 400));
  }

  const splitToken = token.split('.')[0];
  const confirmEmailToken = crypto
    .createHash('sha256')
    .update(splitToken)
    .digest('hex');

  // get user by token
  const user = await User.findOne({
    confirmEmailToken,
    isEmailConfirmed: false,
  });

  if (!user) {
    return next(new ErrorResponse('Invalid Token', 400));
  }

  // update confirmed to true
  user.confirmEmailToken = undefined;
  user.isEmailConfirmed = true;

  // save
  user.save({ validateBeforeSave: false });

  // return token
  // sendTokenResponse(user, 200, res);

  return res.send(`<h1>your email has been verified</h1>`);
});

