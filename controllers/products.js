const asyncHandler = require("../middleware/async");
const ErrorResponse = require("../utils/errorResponse");
const Product = require("../models/Product");
const Shop = require("../models/Shop");
const Order = require("../models/Order");
const admin = require("firebase-admin");
const braintree = require("braintree");
const Notification = require('../models/Notification');
const User = require("../models/User");
const sendMail = require("../utils/sendMail");
var gateway = new braintree.BraintreeGateway({
  environment: braintree.Environment.Sandbox,
  merchantId: process.env.BRAINTREE_MERCHANT_ID,
  publicKey: process.env.BRAINTREE_PUBLIC_KEY,
  privateKey: process.env.BRAINTREE_PRIVATE_KEY,
});

// @desc        Get all rooms
// @route       GET /api/v1/rooms
//@route        GET /api/v1/hostels/:hostelId/rooms
// @access      Public
exports.getAllProducts = asyncHandler(async (req, res) => {
  let query;
  if (!req.body.search) {
    query = {};
  } else {
    query = {
      $or: [
        { name: { $regex: req.body.search, $options: "i" } },
       
        {
          description: { $regex: req.body.search, $options: "i" },
        },
        {
          category: { $regex: req.body.search, $options: "i" },
        },
      ],
    };
  }

  let products = await Product.find(query)
    .populate({
      path: "shop",
    }).populate({
      path:"user",
      select:"name email contactNumber"
    })
    .sort([["created_at", -1]])
    .lean();

  return res.status(200).json({
    success: true,
    count: products.length,
    data: products || [],
  });
});
exports.getProducts = asyncHandler(async(req, res,next) => {
  const products = await Product.find({shop:req.params.shopId}) .populate({
    path: "shop",
  }).populate({
    path:"user",
    select:"name email contactNumber"
  })
  .sort([["created_at", -1]])
  .lean();;

  return res.status(200).json({
    success: true,
    message:products.length>0?"Products found successfully":"No product found",
    data: products ||[],
  });
})

// @desc        Get single room
// @route       GET /api/v1/rooms/:id
// @access      Public
exports.getProduct = asyncHandler(async (req, res, next) => {
  const product = await Product.findById(req.params.id).populate({
    path: "shop",
  }).populate({
    path:"user",
    select:"name email contactNumber"
  });

  if (!product) {
    return next(
      new ErrorResponse(`No product with the id of ${req.params.id}`, 404)
    );
  }

  res.status(200).json({
    success: true,
    data: product,
  });
});

// @desc       Add room
// @route      POST /api/v1/hostels/:hostelId/rooms
// @access     Private
exports.addProduct = asyncHandler(async (req, res, next) => {
  req.body.shop = req.params.shopId;
  req.body.user = req.user.id;

  const shop = await Shop.findById(req.params.shopId);
  if (!shop) {
    return next(
      new ErrorResponse(`No shop with the id of ${req.params.shopId}`, 404)
    );
  }

  // Make sure user is hostel owner
  if (shop.user.toString() !== req.user.id && req.user.role !== "admin") {
    return next(
      new ErrorResponse(
        `User ${req.user.id} is not authorized to add a product to the  ${shop._id}`,
        400
      )
    );
  }
  const product = await Product.findOne({name:req.body.name}).lean();
  if(product) {
    return new ErrorResponse("Product with this name already exists", 400);
  }

  await Product.create(req.body);

  res.status(200).json({
    success: true,
    data: { product, shop },
  });
});

// @desc       Update room
// @route      PUT /api/v1/rooms/:id
// @access     Private
exports.updateProduct = asyncHandler(async (req, res, next) => {
  let product = await Product.findById(req.params.id);

  if (!product) {
    return next(
      new ErrorResponse(`No product with the id of ${req.params.id}`, 404)
    );
  }

  // Make sure user is product owner
  if (product.user.toString() !== req.user.id && req.user.role !== "admin") {
    return next(
      new ErrorResponse(
        `User ${req.user.id} is not authorized to update product`,
        400
      )
    );
  }

  product = await Product.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({
    success: true,
    data: product,
  });
});

// @desc       Delete room
// @route      DELETE /api/v1/rooms/:id
// @access     Private
exports.deleteProduct = asyncHandler(async (req, res, next) => {
  let product = await Product.findById(req.params.id);

  if (!product) {
    return next(
      new ErrorResponse(`No product with the id of ${req.params.id}`, 404)
    );
  }
  // Make sure user is product owner
  if (product.user.toString() !== req.user.id && req.user.role !== "admin") {
    return next(
      new ErrorResponse(
        `User ${req.user.id} is not authorized to delete product`,
        400
      )
    );
  }

  await Product.deleteOne();

  res.status(200).json({
    success: true,
    data: {},
  });
});
exports.purchaseProduct = asyncHandler(async (req, res, next) => {
  let shop = await Shop.findById(req.body.shop).lean();
  let prod=[];
  let totalAmount=0;
  if (!shop) {
    return next(new ErrorResponse("No shop Found for this product"));
  }
  const owner = await User.findById(shop.user);
  const token = owner.fcmToken;
  const userToken = req.user.fcmToken;
  if(!token || !userToken) {
    return next(new ErrorResponse("firebase token not found ", 400));
  }
  // for (x in req.body.product) {
  //   let product = await Product.findById(req.body.product[x]);
  //   if (!product) {
  //     return next(new ErrorResponse("Product not found"));
  //   }
  //   prod.push(product.name);
  //   const { quantity, sold } = product;
  //   if (sold < quantity) {
      
  //     product.quantity = product.quantity - req.body.quantity;
  //     await product.save();
  //   } else {
  //     return res
  //       .status(400)
  //       .json({ success: false, message: "OOPs!,Stock is empty" });
  //   }
  // }

  //new logic goes here
  for (x in req.body.cart) {
    let product = await Product.findById(req.body.cart[x].product);
    if (!product) {
      return next(new ErrorResponse("Product not found"));
    }
    prod.push(product.name);
    const { quantity, sold } = product;
    if (sold < quantity) {
      totalAmount= totalAmount+req.body.cart[x].price*req.body.cart[x].quantity
      product.quantity = product.quantity - req.body.cart[x].quantity;
      await product.save();
    } else {
      return res
        .status(400)
        .json({ success: false, message: "OOPs!,Stock is empty" });
    }
  }
  
    const nonceFromTheClient = req.body.paymentMethodNonce;
    // const amount = req.body.amount;
    const newTransaction = await gateway.transaction.sale({
      amount: totalAmount,
      paymentMethodNonce: nonceFromTheClient,
      options: {
        submitForSettlement: true,
      },
    });

    if (!newTransaction) {
      return next(
        new ErrorResponse("Token not returned by braintree, try again", 400)
      );
    }
    req.body.user = req.user.id;
    const data = {
      amount: newTransaction.transaction.amount,
      transaction_id: newTransaction.transaction.id,
      shop: req.body.shop,
      // product: req.body.product,
      publisher: shop.user,
      orderBy: req.body.user,
      cart: req.body.cart
    };
    // await Order.create(data);
  
    await Order.create(data);
    const OwnerMessage = `Your customer ${req.user.name} has purchased product ${prod} from your shop ${shop.name}`;
    const Usermessage = `You  has purchased products, ${prod} ,from shop ${shop.name}`;
    await Notification.create({
      amount: newTransaction.transaction.amount,
      transaction_id: newTransaction.transaction.id,
      user: req.user.id,
      publisher: shop.user,
      OwnerMessage: OwnerMessage,
      Usermessage: Usermessage,
      no_of: "product",
      cart: req.body.cart
    });
    
    // const token = user.fcmToken;
    var payload = {
      notification: {
        title: "Product Purchase",
        body: `${prod}, purchased by  , ${req.user.name} successfully`,
      },
    };
    
    
    await admin.messaging().sendToDevice(token, payload);
    await admin.messaging().sendToDevice(userToken, payload);
    // const message1= `you have purchazed producs from the owner ${owner.email}`;
    // await sendMail({
    //   mail:req.user.email,
    //   subject: "Product Purchased",
    //   message:message1
    // });

    return res.status(201).json({
      success: true,
      message: "Product purchased successfully",
    });
  
});
