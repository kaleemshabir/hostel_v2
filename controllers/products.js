const asyncHandler = require('../middleware/async');
const ErrorResponse = require('../utils/errorResponse');
const Product = require('../models/Product');
const Shop = require('../models/Shop');

// @desc        Get all rooms
// @route       GET /api/v1/rooms
//@route        GET /api/v1/hostels/:hostelId/rooms
// @access      Public
exports.getProducts = asyncHandler(async (req, res, next) => {

    let products = await Product.find().populate({
      path: 'shop'
    });
    const search = req.body.search;
  let copy=[];
 

    products.forEach(element => {
      if( element.name.toLowerCase().includes(search.toLowerCase()) ||
      element.address.toLowerCase().includes(search.toLowerCase()) || 
      element.price.toLowerCase().includes(search.toLowerCase()) ||
      element.description.toLowerCase().includes(search.toLowerCase()) ||
      element.category.toLowerCase().includes(search.toLowerCase()) ||
      element.shop.name.toLowerCase().includes(search.toLowerCase())){
        copy.push(element);
        
      }

      if(copy.length > 0 ) {
        products = copy;
      }
    });
    return res.status(200).json({
      success: true,
      count: products.length,
      data: products,
    });
 
});

// @desc        Get single room
// @route       GET /api/v1/rooms/:id
// @access      Public
exports.getProduct = asyncHandler(async (req, res, next) => {
  const product = await Product.findById(req.params.id).populate({
    path: 'shop'
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
  console.log("userId", req.body.user);

  const shop = await Shop.findById(req.params.shopId);
  if (!shop) {
    return next(
      new ErrorResponse(`No shop with the id of ${req.params.shopId}`, 404)
    );
  }

  // Make sure user is hostel owner
  if (shop.user.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(
      new ErrorResponse(
        `User ${req.user.id} is not authorized to add a product to the  ${shop._id}`,
        400
      )
    );
  }
  const products = await Product.find({ shop: req.params.shopId });
  let totalProducts = products.length;
 

  let count = totalProducts + 1;
  req.body.roomNumber = count;
  

  const product = await Product.create(req.body);

  res.status(200).json({
    success: true,
    data: {product, shop},
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
  if (product.user.toString() !== req.user.id && req.user.role !== 'admin') {
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
  if (product.user.toString() !== req.user.id && req.user.role !== 'admin') {
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
