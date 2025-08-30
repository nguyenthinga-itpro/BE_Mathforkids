const express = require("express");
const ceController = require("../app/controllers/CompletedExerciseController");
const pupilMiddleware = require("../app/middlewares/PupilMiddleware");
const lessonMiddleware = require("../app/middlewares/LessonMiddleware");
const ceMiddleware = require("../app/middlewares/CompletedExerciseMiddleware");
const router = express.Router();

// Create completed exercise
router.post("/", ceController.create);
// Get completed exercise by ID
router.get(
  "/:id",
  ceMiddleware.checkCompletedExerciseExistById(),
  ceController.getById
);
// Count all completed exercise
router.get("/countAll", ceController.countAll);
router.get(
  "/countCompletedExercisePupil/:pupilId",
  pupilMiddleware.checkPupilExistById("pupilId"),
  ceController.countCompletedExercisePupil
);
// Get all paginated completed exercises
router.get("/getAll", ceController.getAll);
// Count all completed exercise by pupil ID
router.get(
  "/countByPupilId/:pupilId",
  pupilMiddleware.checkPupilExistById("pupilID"),
  ceController.countTestsByPupilID
);
// Filter paginated completed exercise by pupilID
router.get(
  "/filterByPupilID/:pupilID",
  pupilMiddleware.checkPupilExistById("pupilID"),
  ceController.filterByPupilID
);
// Count completed exercise by lesson ID
router.get(
  "/countByLessonId/:lessonId",
  lessonMiddleware.checkLessonExistById("lessonID"),
  ceController.countCompletedExerciseByLessonID
);
// Filter paginated completed exercise by lessonID
router.get(
  "/filterByLessonID/:lessonID",
  lessonMiddleware.checkLessonExistById("lessonID"),
  ceController.filterByLessonID
);
// Count completed exercise by point
router.get("/countByPoint", ceController.countCompletedExerciseByPoint);
// Filter paginated completed exercise by point
router.get("/filterByPoint", ceController.filterByPoint);
// Count completed exercise by pupilID & lessonID
router.get(
  "/countByPupilIDAndLessonID/:pupilID/:lessonID",
  pupilMiddleware.checkPupilExistById("pupilID"),
  lessonMiddleware.checkLessonExistById("lessonID"),
  ceController.countCompletedExerciseByPupilIdAndLessonId
);
// Filter by pupilID & lessonID
router.get(
  "/filterByPupilAndLesson/:pupilID/:lessonID",
  pupilMiddleware.checkPupilExistById("pupilID"),
  lessonMiddleware.checkLessonExistById("lessonID"),
  ceController.filterByPupilAndLesson
);
// Count completed exercise by lessonID & point
router.get(
  "/countByLessonIDAndPoint/:lessonID",
  lessonMiddleware.checkLessonExistById("lessonID"),
  ceController.countCompletedExerciseByLessonIdAndPoint
);
// Filter by lessonID & point
router.get(
  "/filterByLessonIDAndPoint/:lessonID",
  lessonMiddleware.checkLessonExistById("lessonID"),
  ceController.filterByLessonIDAndPoint
);

module.exports = router;
