const express = require('express');
const {
  getProducts,
  getProduct,
  addProduct,
  updateProduct,
  deleteProduct,
  purchaseProduct
} = require('../controllers/products');
const router = express.Router({ mergeParams: true });
const { protect, authorize } = require("../middleware/auth");
router.route('/search').post(getProducts)
router
  .route('/')
 .post(protect, authorize('publisher', 'admin'), addProduct);

router
  .route('/:id')
  .get(getProduct)
  .put(protect, authorize('publisher', 'admin'), updateProduct)
  .delete(protect, authorize('publisher', 'admin'), deleteProduct);
  router.route("/:id/purchase").post(protect,purchaseProduct);

module.exports = router;
