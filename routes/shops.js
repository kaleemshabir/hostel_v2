const express = require('express');
var multer = require('multer');
const {
  createShop,
  getShop,
  orderItems,
  getShops,
  updateShop,
  deleteShop,
getShopInRadius,
getProducts
} = require('../controllers/shops');

const Shop = require('../models/Shop');

// Include other resource routers
const productRouter = require('./products');
const reviewsRouter = require('./shopReview');


const router = express.Router();

const { protect, authorize } = require('../middleware/auth');
router.use('/:shopId/products', productRouter);
router.use('/:shopId/reviews', reviewsRouter);
router.route('/:id/order-item').post(protect, orderItems);
router.route('/search')
.post( getShops);
router
  .route('/') 

  .post(protect, authorize('publisher', 'admin'), createShop);
router
  .route('/:id')
  .get(getShop)
  .put(protect, authorize('publisher', 'admin'), updateShop)
  .delete(protect, authorize('publisher', 'admin'), deleteShop);

  router.route("/products")
  .get(getProducts);

// router.put(
//   '/:id/photo',
//   protect,
//   authorize('publisher', 'admin'),
//   upload.single('file'),
//   hostelPhotoUpload
// );

router.route('/radius').get(getShopInRadius);

module.exports = router;
