const express = require('express');
const {
  getProducts,
  getProduct,
  addProduct,
  updateProduct,
  deleteProduct
} = require('../controllers/products');
const router = express.Router({ mergeParams: true });

const Product = require('../models/Product');

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

module.exports = router;
