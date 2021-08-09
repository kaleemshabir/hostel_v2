const express = require('express');
const {
  createShop,
  getShop,
  orderItems,
  getShops,
  updateShop,
  deleteShop,
getShopInRadius,
getProducts,
getOrders
} = require('../controllers/shops');
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
  .post(protect, authorize('publisher', 'admin','user'), createShop);
router
  .route('/:id')
  .get(getShop)
  .put(protect, authorize('publisher', 'admin','user'), updateShop)
  .delete(protect, authorize('publisher', 'admin','user'), deleteShop);
router.route("/:id/orders").get(protect, authorize("publisher", "admin",'user'), getOrders)

  router.route("/products")
  .get(getProducts);

router.route('/radius').get(getShopInRadius);

module.exports = router;
