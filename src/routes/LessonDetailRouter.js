const express = require("express");
const router = express.Router();
const controller = require("../app/controllers/LessonDetailController");
const lessonMiddleware = require("../app/middlewares/LessonMiddleware");
const middleware = require("../app/middlewares/LessonDetailMiddleware");
const multer = require("multer");
const upload = multer({ storage: multer.memoryStorage() });

// Create a lesson detail
router.post(
  "/",
  upload.fields([{ name: "image", maxCount: 1 }]),
  controller.create
);
// Create full lesson details
router.post(
  "/full",
  upload.fields([
    { name: "define", maxCount: 1 },
    { name: "example", maxCount: 1 },
    { name: "remember", maxCount: 1 },
  ]),
  controller.createFullLesson
);
// Count all lesson details by lesson ID
router.get(
  "/countByLesson/:lessonId",
  lessonMiddleware.checkLessonExistById("lessonId"),
  controller.countByLesson
);
// Filter all paginated lesson details by lesson ID & disabled state
router.get(
  "/filtergetByLesson/:lessonId",
  lessonMiddleware.checkLessonExistById("lessonId"),
  controller.filterByLessonAndDisabledState
);
// Get all paginated lesson details by lesson ID
router.get(
  "/getByLesson/:lessonId",
  lessonMiddleware.checkLessonExistById("lessonId"),
  controller.getByLesson
);
// Count all lesson details by lesson ID & disabled state
router.get(
  "/countByLessonAndDisabledState/:lessonId",
  lessonMiddleware.checkLessonExistById("lessonId"),
  controller.countByLessonAndDisabledState
);
// Get enabled lesson details by lesson ID
router.get(
  "/getEnabledByLesson/:lessonId",
  lessonMiddleware.checkLessonExistById("lessonId"),
  controller.getEnabledByLesson
);
// Get a lesson detail by ID
router.get("/:id", middleware.checkLessonDeatailExistById, controller.getById);
// Update lesson detail
router.put(
  "/:id",
  middleware.checkLessonDeatailExistById,
  upload.fields([{ name: "image", maxCount: 1 }]),
  controller.update
);

module.exports = router;
