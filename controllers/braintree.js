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
    new ErrorResponse("Token not returned by braintree, try again", 404);
  }
  return res.status(200).json({
    success: true,
    clientToken
  });

})