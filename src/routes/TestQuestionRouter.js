const express = require("express");
const testQuestionController = require("../app/controllers/TestQuestionController");
const testMiddleware = require("../app/middlewares/TestMiddleware");
const testQuestionMiddleware = require("../app/middlewares/TestQuestionMiddleware");
const router = express.Router();

// Create multiple test questions
router.post("/multiple", testQuestionController.createMultiple);
// Get test questions by test ID
router.get(
  "/getByTest/:testId",
  testMiddleware.checkTestExistById("testId"),
  testQuestionController.getByTest
);
// Count test questions by exercise ID
router.post(
  "/countOptionByExercise/:exerciseId",
  testQuestionController.countOptionByExercise
);
// Get test question by ID
router.get(
  "/:id",
  testQuestionMiddleware.checkTestQuestionExistById,
  testQuestionController.getById
);

module.exports = router;
