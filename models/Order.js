const mongoose = require("mongoose");

const OrderSchema = new mongoose.Schema({
  amount: {
    type: Number,
    required: [true, "Please add a amount"],
    unique: true,
    trim: true,
    maxlength: [50, "Amount cannot be more than 50 characters"],
  },

  transaction_id: {
    type: String,
    required: [true, "Please transaction id"],
  },
 
  shop: {
    type: mongoose.Schema.ObjectId,
    ref: "Shop",
  },
  product: {
    type: mongoose.Schema.ObjectId,
    ref: "Product",
  },
  orderBy: {
    type: mongoose.Schema.ObjectId,
    ref: "User",
  },
publisher: {
  type: mongoose.Schema.ObjectId,
  ref: "User",
}
},{timestamps: true});

module.exports = mongoose.model("Order", OrderSchema);
