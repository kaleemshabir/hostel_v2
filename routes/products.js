const express = require('express');
const {
  getProducts,
  getProduct,
  addProduct,
  updateProduct,
  deleteProduct,
  purchaseProduct,
  getAllProducts
} = require('../controllers/products');
const router = express.Router({ mergeParams: true });
const { protect, authorize } = require("../middleware/auth");
router.route('/search').post(protect, getAllProducts)
router
  .route('/')
 .post(protect,  addProduct).get(protect, getProducts);

router
  .route('/:id')
  .get(getProduct)
  .put(protect, authorize('publisher', 'admin','user'), updateProduct)
  .delete(protect, authorize('publisher', 'admin','user'), deleteProduct);
  router.route("/purchase").post(protect,purchaseProduct);

module.exports = router;
