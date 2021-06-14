const asyncHandler = require("../middleware/async");
const ErrorResponse = require("../utils/errorResponse");
const braintree = require("braintree");
var gateway = new braintree.BraintreeGateway({
  environment: braintree.Environment.Sandbox,
  merchantId: process.env.BRAINTREE_MERCHANT_ID,
  publicKey: process.env.BRAINTREE_PUBLIC_KEY,
  privateKey: process.env.BRAINTREE_PRIVATE_KEY
});

exports.generateToken = asyncHandler(async(req, res, next) => {
 const clientToken = await gateway.clientToken.generate({

  });
  if(!clientToken) {
   return new ErrorResponse("Token not returned by braintree, try again", 404);
  }
  return res.status(200).json({
    success: true,
    clientToken
  });

});

exports.processPayment = asyncHandler(async(req, res, next) => {
  const nonceFromTheClient = req.body.paymentMethodNonce;
  const amount = req.body.amount;
  const newTransaction = await gateway.transaction.sale({
    amount:amount,
    paymentMethodNonce:nonceFromTheClient,
    options:{
      submitForSettlement:true
    }
  });

  if(!newTransaction){
   return new ErrorResponse("Token not returned by braintree, try again", 400);
  }
  req.body.user = req.user.id;
  const data = {
    title: req.body.amount,
    transaction_id: req.body.transaction_id,
    hostel: req.body.hostel,
    HostelOwner: req.body.HostelOwner,
    seatNumber: req.body.seatNumber,
    roomNumber: req.body.roomNumber,
    address: req.body.address,
    bookedBy: req.body.bookedBy,
  };
  await SeatBooked.create(data);

  return res.status(200).json({
    success:true,
    message: "Your payment was successfull"
  })
})