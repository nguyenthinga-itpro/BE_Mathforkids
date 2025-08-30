const express = require("express");
const exerciseController = require("../app/controllers/ExerciseController");
const lessonMiddleware = require("../app/middlewares/LessonMiddleware");
const levelMiddleware = require("../app/middlewares/LevelMiddleware");
const exerciseMiddleware = require("../app/middlewares/ExerciseMiddleware");
const router = express.Router();
const multer = require("multer");
const upload = multer({ storage: multer.memoryStorage() });
// Map multiple file fields
const uploadFields = upload.fields([
  { name: "image", maxCount: 1 },
  { name: "option", maxCount: 3 },
  { name: "answer", maxCount: 1 },
]);

// Create exercise
router.post("/", uploadFields, exerciseController.create);
// Count all exercises by lesson ID
router.get(
  "/countByLesson/:lessonId",
  lessonMiddleware.checkLessonExistById("lessonId"),
  exerciseController.countByLesson
);
router.get(
  "/countByLessonAndLevel/:lessonId/:levelId",
  lessonMiddleware.checkLessonExistById("lessonId"),
  levelMiddleware.checkLevelExistById("levelId"),
  exerciseController.countByLessonAndLevel
);

router.get(
  "/countByLessonAndDisabledStatus/:lessonId",
  lessonMiddleware.checkLessonExistById("lessonId"),
  exerciseController.countByLessonAndDisabledStatus
);
router.get(
  "/countByLessonAndLevelAndDisabledStatus/:lessonId/:levelId",
  lessonMiddleware.checkLessonExistById("lessonId"),
  levelMiddleware.checkLevelExistById("levelId"),
  exerciseController.countByLessonAndLevelAndDisabledStatus
);
// Get all paginated exercises by lesson ID
router.get(
  "/getByLesson/:lessonId",
  lessonMiddleware.checkLessonExistById("lessonId"),
  exerciseController.getByLesson
);
// Filter paginated exercises by lesson ID & level ID
router.get(
  "/filterByLevel/:lessonId/:levelId",
  lessonMiddleware.checkLessonExistById("lessonId"),
  levelMiddleware.checkLevelExistById("levelId"),
  exerciseController.filterByLessonAndLevel
);
// Filter all paginated exercises by lesson ID and disabled state
router.get(
  "/filterByIsDisabled/:lessonId",
  lessonMiddleware.checkLessonExistById("lessonId"),
  exerciseController.filterByIsDisabled
);
// Filter all paginated exercises by lesson ID, level ID and disabled state
router.get(
  "/filterByLevelAndIsDisabled/:lessonId/:levelId",
  lessonMiddleware.checkLessonExistById("lessonId"),
  levelMiddleware.checkLevelExistById("levelId"),
  exerciseController.filterByLevelAndIsDisabled
);
// Get enabled exercises by lessonId
router.get(
  "/getEnabledByLesson/:lessonId",
  lessonMiddleware.checkLessonExistById("lessonId"),
  exerciseController.getEnabledByLesson
);
// Get enabled exercise by grade & type
router.get("/getByGradeAndType", exerciseController.getByGradeAndType);
// Average exercise per enabled lesson
router.get(
  "/averageExercisePerLesson",
  exerciseController.averageExercisePerLesson
);
// Update exercise
router.put(
  "/:id",
  exerciseMiddleware.checkExerciseExistById,
  uploadFields,
  exerciseController.update
);
// Random exercises
router.post(
  "/randomExercises/:lessonId",
  lessonMiddleware.checkLessonExistById("lessonId"),
  exerciseController.randomExercises
);
// Random tests
router.get(
  "/randomTests/:lessonId",
  lessonMiddleware.checkLessonExistById("lessonId"),
  exerciseController.randomTests
);
// Random assessments
router.get("/randomAssessments/:grade", exerciseController.randomAssessments);
// Count by lesson and levels
router.post(
  "/countByLessonAndLevels/:lessonId",
  lessonMiddleware.checkLessonExistById("lessonId"),
  exerciseController.countByLessonAndLevels
);
// Get an exercise by ID
router.get(
  "/:id",
  exerciseMiddleware.checkExerciseExistById,
  exerciseController.getById
);
router.post(
  "/countLevelIdsInLesson/:lessonId",
  exerciseController.countLevelIdsInLesson
);
module.exports = router;
