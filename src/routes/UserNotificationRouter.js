const express = require("express");
const userNotificationController = require("../app/controllers/UserNotificationController");
const userMiddleware = require("../app/middlewares/UserMiddleware");
const userNotificationMiddleware = require("../app/middlewares/UserNotificationMiddleware");
const router = express.Router();

// Create user notification
router.post("/", userNotificationController.create);
// Get user notifications within 30 days by user ID
router.get(
  "/getWithin30Days/:userId",
  userMiddleware.checkUserExistById("userId"),
  userNotificationController.getWithin30DaysByUserId
);
// Get an user notification by ID
router.get(
  "/:id",
  userNotificationMiddleware.checkUserNotiExistById,
  userNotificationController.getById
);
// Update user notification status
router.patch(
  "/:id",
  userNotificationMiddleware.checkUserNotiExistById,
  userNotificationController.updateStatus
);

module.exports = router;
