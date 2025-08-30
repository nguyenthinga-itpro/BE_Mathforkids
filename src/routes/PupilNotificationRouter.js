const express = require("express");
const notificationController = require("../app/controllers/PupilNotificationController");
const pupilMiddleware = require("../app/middlewares/PupilMiddleware");
const pupilNotiMiddleware = require("../app/middlewares/PupilNotificationMiddleware");
const router = express.Router();

// Create pupil notification
router.post("/", notificationController.create);
// Get pupil notifications within 30 days by pupil ID
router.get(
  "/pupil/:pupilId",
  pupilMiddleware.checkPupilExistById("pupilId"),
  notificationController.getWithin30DaysByPupilId
);
router.get(
  "/getWithin30Days/:pupilId",
  pupilMiddleware.checkPupilExistById("pupilId"),
  notificationController.getWithin30DaysByPupilId
);
// Get pupil notification by ID
router.get(
  "/:id",
  pupilNotiMiddleware.checkPupilNotiExistById,
  notificationController.getById
);
// Update pupil notification status
router.patch(
  "/:id",
  pupilNotiMiddleware.checkPupilNotiExistById,
  notificationController.updateStatus
);

module.exports = router;
