const express = require("express");
const lessonController = require("../app/controllers/LessonController");
const lessonMiddleware = require("../app/middlewares/LessonMiddleware");
const router = express.Router();

// Create lesson
router.post(
  "/",
  lessonMiddleware.checkNameExistForCreate,
  lessonController.create
);
// Filter paginated lessons by grade, type & disabled state
router.get("/filterByDisabled", lessonController.filterByDisabledStatus);
// Count lessons by grade, type & disabled state
router.get("/countByDisabledStatus", lessonController.countByDisabledStatus);
// Count all lessons by grade & type
router.get("/countAll", lessonController.countAll);
// Count all lessons
router.get("/countEnabledLesson", lessonController.countEnabledLesson);
// Get all paginated lessons by grade & type
router.get("/getAll", lessonController.getAll);
// Get enabled lessons by grade & type
router.get("/getByGradeAndType", lessonController.getByGradeAndType);
// Get enabled lessons by grade & type
router.get(
  "/getLessonsByGradeAndTypeFiltered",
  lessonController.getLessonsByGradeAndTypeFiltered
);
// Get a lesson by ID
router.get(
  "/:id",
  lessonMiddleware.checkLessonExistById(),
  lessonController.getById
);
// Count all enable lessons
router.get("/countlesson", lessonController.countLessons);
// Update lesson
router.patch(
  "/:id",
  lessonMiddleware.checkLessonExistById(),
  lessonMiddleware.checkNameExistForUpdate,
  lessonController.update
);
router.patch(
  "/order/:id",
  lessonMiddleware.checkLessonExistById(),
  lessonController.update
);
module.exports = router;
