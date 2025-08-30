const express = require("express");
const completedLessonController = require("../app/controllers/CompletedLessonController");
const pupilMiddleware = require("../app/middlewares/PupilMiddleware");
const lessonMiddleware = require("../app/middlewares/LessonMiddleware");
const completedLessonMiddleware = require("../app/middlewares/CompletedLessonMiddleware");
const router = express.Router();

// Create completed lesson
router.post("/", completedLessonController.create);
// Get completed lessons by pupil ID
router.get(
  "/getByPupil/:pupilId",
  pupilMiddleware.checkPupilExistById("pupilId"),
  completedLessonController.getByPupil
);
router.get(
  "/countCompletedPupil/:pupilId",
  pupilMiddleware.checkPupilExistById("pupilId"),
  completedLessonController.countCompletedPupil
);
// Get completed lesson by pupil ID & lesson
router.get(
  "/getByPupilAndLesson/:pupilId/lesson/:lessonId",
  pupilMiddleware.checkPupilExistById("pupilId"),
  lessonMiddleware.checkLessonExistById("lessonId"),
  completedLessonController.getByPupilLesson
);
router.patch(
  "/completeAndUnlockNext/:pupilId/lesson/:lessonId",
  pupilMiddleware.checkPupilExistById("pupilId"),
  lessonMiddleware.checkLessonExistById("lessonId"),
  completedLessonController.completeAndUnlockNext
);
router.get("/getAll", completedLessonController.getAll);
// Update completed lesson status
router.patch(
  "/:id",
  completedLessonMiddleware.checkCompletedLessonExistById,
  completedLessonController.updateStatus
);
// Update completed lesson status
router.patch(
  "/updateIsblock/:pupilId/lesson/:lessonId",
  pupilMiddleware.checkPupilExistById("pupilId"),
  lessonMiddleware.checkLessonExistById("lessonId"),
  completedLessonController.updateStatusIsBlock
);
router.patch(
  "/unBlockByGrade/:pupilId",
  pupilMiddleware.checkPupilExistById("pupilId"),
  completedLessonController.unlockPreviousGradeLesson
);
module.exports = router;
