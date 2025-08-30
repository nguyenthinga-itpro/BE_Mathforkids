const express = require("express");
const cqQuestionController = require("../app/controllers/CompletedQuestionController");
const ceMiddleware = require("../app/middlewares/CompletedExerciseMiddleware");
const cqQuestionMiddleware = require("../app/middlewares/CompletedQuestionMiddleware");
const router = express.Router();

// Create multiple completed questions
router.post("/", cqQuestionController.createMultiple);
// Get completed questions by completed exercise ID
router.get(
  "/getByCompletedExercise/:completedExerciseId",
  ceMiddleware.checkCompletedExerciseExistById("completedExerciseId"),
  cqQuestionController.getByCompletedExercise
);
// Get completed question by ID
router.get(
  "/:id",
  cqQuestionMiddleware.checkCompletedQuestionExistById,
  cqQuestionController.getById
);

module.exports = router;
