const express = require("express");
const goalController = require("../app/controllers/GoalController");
const pupilMiddleware = require("../app/middlewares/PupilMiddleware");
const goalMiddleware = require("../app/middlewares/GoalMiddleware");
const lessonMiddleware = require("../app/middlewares/LessonMiddleware");
const rewardMiddleware = require("../app/middlewares/RewardMiddleware");
const router = express.Router();

// Create goal
router.post("/", goalController.create);
// Get goals in 30 days by pupil ID
router.get(
  "/getWithin30Days/:pupilId",
  pupilMiddleware.checkPupilExistById("pupilId"),
  goalController.getWithin30DaysByPupilId
);
// Get a goal by ID
router.get("/:id", goalMiddleware.checkGoalExistById, goalController.getById);
// Update goal
router.patch("/:id", goalMiddleware.checkGoalExistById, goalController.update);
//autoMarkCompletedGoals
router.get(
  "/completedgoal/:pupilId/:lessonId",
  pupilMiddleware.checkPupilExistById("pupilId"),
  lessonMiddleware.checkLessonExistById("lessonId"),
  goalController.autoMarkCompletedGoals
);
//getAvailableLessons
router.get(
  "/availablelessons/:pupilId/:skillType/:startDate/:endDate",
  pupilMiddleware.checkPupilExistById("pupilId"),
  goalController.getAvailableLessons
);

module.exports = router;
