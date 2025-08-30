const express = require("express");
const dailyTaskController = require("../app/controllers/DailyTaskController");
const dailyTaskMiddleware = require("../app/middlewares/DailyTaskMiddleware");
const router = express.Router();

// Create daily task
router.post("/", dailyTaskController.create);
// Get count by isDisabled status
router.get("/countByDisabledStatus", dailyTaskController.countByDisabledStatus);
// Filter by isDisabled with pagination
router.get("/filterByDisabledStatus", dailyTaskController.filterByDisabledStatus);
// Get total count of all daily tasks
router.get("/countAll", dailyTaskController.countAll);
// Get all daily tasks
router.get("/", dailyTaskController.getAll);
// Get enabled daily tasks
router.get("/getEnabledDailyTask", dailyTaskController.getEnabledDailyTask);
// Get a daily task by ID
router.get(
  "/:id",
  dailyTaskMiddleware.checkDailyTaskExistById,
  dailyTaskController.getById
);
// Update daily task
router.patch(
  "/:id",
  dailyTaskMiddleware.checkDailyTaskExistById,
  dailyTaskController.update
);

module.exports = router;
