const Order = require("../models/Order");
exports.getOrders = async (req, res) => {
  const orders = await Order.find({ shop: req.params.id })
    .populate("user", "name email photo contactNumber")
    .select("-publisher");
  return res.status(200).json({
    success: true,
    message:
      orders.length > 0
        ? "Notifications found successfully"
        : "No Notification found",
    data: orders || [],
  });
};
