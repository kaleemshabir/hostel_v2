const Notification = require("../models/Notification");
exports.getNotifications = async (req, res) => {
  const query = {
    $or: [
      {
      publisher: req.user.id 
    },
      {user: req.user.id }
    ]
  }
  const notifications = await Notification.find(query)
    .populate("user", "name email photo contactNumber")
    .select("-publisher")
    .sort([['createdAt', -1]]);
  return res.status(200).json({
    success: true,
    message:
      notifications.length > 0
        ? "Notifications found successfully"
        : "No Notification found",
    data: notifications || [],
  });
};
