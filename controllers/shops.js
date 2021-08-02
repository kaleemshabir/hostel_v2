const Hostel = require('../models/Hostel');
const asyncHandler = require('../middleware/async');
const geocoder = require('../utils/geocoder');
const ErrorResponse = require('../utils/errorResponse');
const Shop = require('../models/Shop');
const Order = require("../models/Order");


// @desc        Get all shops
// @route       GET /api/v1/shops
// @access      Public
exports.getShops = asyncHandler(async (req, res, next) => {
  let query;
  if (!req.body.search) {
    query = {};
  } else {
    query = {
      $or: [
        { name: { $regex: req.body.search, $options: "i" } },
        {
          address: { $regex: req.body.search, $options: "i" },
        },
        {
          description: { $regex: req.body.search, $options: "i" },
        }
      ],
    };
  }


  let shops = await Shop.find({}).sort([[("created_at", -1)]]).lean();;

  return res.status(200).json({
    success: true,
    count: shops.length,
    data: shops,
  });
});

// @desc        Get single hostel
// @route       GET /api/v1/hostels/:id
// @access      Public
exports.getShop = asyncHandler(async (req, res, next) => {
  const shop = await Shop.findById(req.params.id);

  if (!shop) {
    return next(
      new ErrorResponse(`shop not found with id of ${req.params.id}`, 404)
    );
  }
  res.status(200).json({ success: true, data: shop });

});

// @desc        Create Shop
// @route       POST /api/v1/shops
// @access      Private
exports.createShop = asyncHandler(async (req, res, next) => {
  // Add user to req.body
  req.body.user = req.user.id;

  // Check for published hostel
  const publishedShop = await Shop.findOne({ user: req.body.user });

  // if the user is not an admin, they can only add one hostel
  if (publishedShop && req.user.role !== 'admin') {
    next(
      new ErrorResponse(
        `The user with ID ${req.user.id} has already published a shop`,
        400
      )
    );
  }
  const shop = await Shop.create(req.body);

  res.status(201).json({
    success: true,
    data: shop,
  });
});

// @desc        Update hostel
// @route       POST /api/v1/hostels/:id
// @access      Private
exports.updateShop = asyncHandler(async (req, res, next) => {
  let shop = await Shop.findById(req.params.id);
  const item = {
    item: req.body,
    shop: shop
  }
  if (!shop) {
    return next(
      new ErrorResponse(`Shop not found with id of ${req.params.id}`, 404)
    );
  }

  // Make sure user is hostel owner
  if (shop.user.toString() !== req.user.id && req.user.role !== 'admin') {
    next(
      new ErrorResponse(
        `User ${req.params.id} is not authorized to update this shop`,
        401
      )
    );
  }

  shop = await Shop.findByIdAndUpdate(req.params.id,{
    $push: {
      items: item,

    }
  }, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({ success: true, data: shop });
});

exports.orderItems = asyncHandler(async(req, res, next) => {
  //req.body.user = req.user.id;
  const ordersBy = {
    orderedBy: req.user.id,
    items: req.body.items
  }
  let shop = await Shop.findById(req.params.id);
  if(!shop) {
   return res.status(400).json({success:false, message:"shop not found"});
  }

   shop = await Shop.findByIdAndUpdate(req.params.id, {
     $push: {orders:ordersBy }
   }, {new: true} );

  res.status(201).json({
    success: true,
    data: shop,
  });
})

// // @desc        Delete hostel
// // @route       POST /api/v1/hostels/:id
// // @access      Private
exports.deleteShop = asyncHandler(async (req, res, next) => {
  const shop = await Shop.findById(req.params.id);
  if (!shop) {
    return next(
      new ErrorResponse(`Shop not found with id of ${req.params.id}`, 404)
    );
  }

  // Make sure the user is shop owner
  if (shop.user.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(
      new ErrorResponse(
        `User ${req.params.id} is not authorized to delete this shop`,
        401
      )
    );
  }
  hostel.remove();

  res.status(200).json({ success: true, data: {} });
});

// @desc        Get hostels within radius
// @route       GET /api/v1/hostels/radius/:zipcode/:distance
// @access      Public
exports.getShopInRadius = asyncHandler(async (req, res, next) => {
  const { distance,latitude,longitude } = req.body;

  // Get lat/lng from geocoder
  // const loc = await geocoder.geocode(zipcode);
  // const lat = loc[0].latitude;
  // const lng = loc[0].longitude;
  const lat = latitude;
  const lng = longitude;

  // Calc radius using radians
  // Divide distance by radius of earth
  // Earth Radius = 3,963 mi / 6,378 km
  const radius = distance / 3963;

  const shops = await Shop.find({
    location: { $geoWithin: { $centerSphere: [[lng, lat], radius] } },
  });

  res.status(200).json({
    success: true,
    count: shops.length,
    data: shops,
  });
});

exports.getProducts = asyncHandler(async(req, res, next) =>{
  let products=[];
  const shops = await Shop.find();
  shops.forEach(shop => {
    products.concat(shop.items);
  });
  return res.send({products, })
} );


exports.getOrders = async (req, res) => {
  const orders = await Order.find({ shop: req.params.id })
    .populate("user", "name email photo contactNumber")
    .populate("product","name category")
    .select("-publisher");
  return res.status(200).json({
    success: true,
    message:
      orders.length > 0
        ? "Orders found successfully"
        : "No Order found",
    data: orders || [],
  });
};
