const express = require("express");
const CompletedTaskController = require("../app/controllers/CompletedTaskController");
const pupilMiddleware = require("../app/middlewares/PupilMiddleware");
const completedTaskMiddleware = require("../app/middlewares/CompletedTaskMiddleware");
const router = express.Router();

// Create completed task
router.post("/", CompletedTaskController.create);
// Get completed tasks within 7 days by pupil ID
router.get(
  "/getWithin7Days/:pupilId",
  pupilMiddleware.checkPupilExistById("pupilId"),
  CompletedTaskController.getWithin7DaysByPupilId
);
// Get a completed task by ID
router.get(
  "/:id",
  completedTaskMiddleware.checkCompletedTaskExistById,
  CompletedTaskController.getById
);
// Update completed task status
router.patch(
  "/:id",
  completedTaskMiddleware.checkCompletedTaskExistById,
  CompletedTaskController.updateStatus
);

module.exports = router;
