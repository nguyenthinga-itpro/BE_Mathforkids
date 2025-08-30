const express = require("express");
const generalNotificationController = require("../app/controllers/GeneralNotificationController");
const generalNotificationMiddleware = require("../app/middlewares/GeneralNotificationMiddleware");
const router = express.Router();

// Create general notification
router.post("/", generalNotificationController.create);
// Count all general notifications
router.get("/countAll", generalNotificationController.countAll);
// Get all general notifications
router.get("/getAll", generalNotificationController.getAll);
// Get all general notifications within 30 days
router.get("/getAllWithin30Days", generalNotificationController.getAllWithin30Days);
// Get general notification by ID
router.get(
  "/:id",
  generalNotificationMiddleware.checkGeneralNotiExistById,
  generalNotificationController.getById
);

module.exports = router;
