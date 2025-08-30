const express = require("express");
const testController = require("../app/controllers/TestController");
const pupilMiddleware = require("../app/middlewares/PupilMiddleware");
const lessonMiddleware = require("../app/middlewares/LessonMiddleware");
const testMiddleware = require("../app/middlewares/TestMiddleware");
const router = express.Router();

// Create test
router.post("/", testController.create);
// Ranking by grade
router.get(
  "/rankingByGrade/:grade",
  testController.rankingByGrade
);
// Count all paginated tests
router.get("/countAll", testController.countAll);
router.get(
  "/countCompletedTestPupil/:pupilId",
  pupilMiddleware.checkPupilExistById("pupilId"),
  testController.countCompletedTestPupil
);
// Get all paginated tests
router.get("/getAll", testController.getAll);
// Count tests by pupil ID
router.get(
  "/countByPupilId/:pupilId",
  pupilMiddleware.checkPupilExistById("pupilID"),
  testController.countTestsByPupilID
);
// Filter paginated tests by pupilID
router.get(
  "/filterByPupilID/:pupilID",
  pupilMiddleware.checkPupilExistById("pupilID"),
  testController.filterByPupilID
);
// Count tests by lesson ID
router.get(
  "/countByLessonId/:lessonId",
  lessonMiddleware.checkLessonExistById("lessonID"),
  testController.countTestsByLessonID
);
// Filter paginated tests by lessonID
router.get(
  "/filterByLessonID/:lessonID",
  lessonMiddleware.checkLessonExistById("lessonID"),
  testController.filterByLessonID
);
// Count tests by point
router.get("/countByPoint", testController.countTestsByPoint);
// Filter paginated tests by point
router.get("/filterByPoint/", testController.filterByPoint);
// Count tests by lesson ID and pupil ID
router.get(
  "/countByPupilIDAndLessonID/:pupilID/:lessonID",
  pupilMiddleware.checkPupilExistById("pupilID"),
  lessonMiddleware.checkLessonExistById("lessonID"),
  testController.countTestsByPupilIdAndLessonId
);
// Filter by pupilID & lessonID
router.get(
  "/filterByPupilAndLesson/:pupilID/:lessonID",
  pupilMiddleware.checkPupilExistById("pupilID"),
  lessonMiddleware.checkLessonExistById("lessonID"),
  testController.filterByPupilAndLesson
);
// Count tests by lessonID & point
router.get(
  "/countByLessonIDAndPoint/:lessonID",
  lessonMiddleware.checkLessonExistById("lessonID"),
  testController.countTestsByLessonIdAndPoint
);
// Filter by lessonID & point
router.get(
  "/filterByLessonIDAndPoint/:lessonID",
  lessonMiddleware.checkLessonExistById("lessonID"),
  testController.filterByLessonIDAndPoint
);
// Thống kê top 10 học sinh có điểm trung bình cao nhất
router.get(
  "/top10PupilsByAveragePoint",
  testController.top10PupilsByAveragePoint
);
// // Get tests by pupil ID
// router.get(
//   "/getByPupil/:pupilId",
//   pupilMiddleware.checkPupilExistById("pupilId"),
//   testController.getTestByPupilId
// );
// // Get tests by lesson ID
// router.get(
//   "/getByLesson/:lessonId",
//   lessonMiddleware.checkLessonExistById("lessonId"),
//   testController.getTestsByLesson
// );
// Get test by pupil ID & lesson ID
router.get(
  "/getTestsByPupilIdAndLessonId/:pupilId/lesson/:lessonId",
  pupilMiddleware.checkPupilExistById("pupilId"),
  lessonMiddleware.checkLessonExistById("lessonId"),
  testController.getTestsByPupilIdAndLessonId
);
// Get point statistic by lessons
router.get("/getPointStatsByLessons", testController.getPointStatsByLessons);
router.get("/getPointStatsByGrade", testController.getPointStatsByGrade);
// Get test by ID
router.get("/:id", testMiddleware.checkTestExistById(), testController.getById);
//Get point statistic by pupilId
router.get(
  "/getUserPointStatsComparison/:pupilId",
  pupilMiddleware.checkPupilExistById("pupilId"),
  testController.getUserPointStatsComparison
);
router.get(
  "/getUserPointFullLesson/:pupilId",
  pupilMiddleware.checkPupilExistById("pupilId"),
  testController.getUserPointFullLesson
);
//Get point statistic by pupilId
router.get(
  "/getAnswerStats/:pupilId/:lessonId",
  pupilMiddleware.checkPupilExistById("pupilId"),
  lessonMiddleware.checkLessonExistById("lessonId"),
  testController.getAnswerStats
);
router.get(
  "/getUserPointFullLesson/:pupilId",
  pupilMiddleware.checkPupilExistById("pupilId"),
  testController.getUserPointFullLesson
);
module.exports = router;
