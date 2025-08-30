const express = require("express");
const router = express.Router();
const assessmentController = require("../app/controllers/AssessmentsController");
const assessmentMiddleware = require("../app/middlewares/AssessmentMiddleware");
const multer = require("multer");
const upload = multer({ storage: multer.memoryStorage() });
// Map multiple file fields
const uploadFields = upload.fields([
  { name: "image", maxCount: 1 },
  { name: "option", maxCount: 3 },
  { name: "answer", maxCount: 1 },
]);

// Create assessment
router.post("/", uploadFields, assessmentController.create);
// Get all assessments
router.get("/", assessmentController.getAll);

// Get enabled assessments
router.get(
  "/getEnabledAssessments",
  assessmentController.getEnabledAssessments
);
// Get assessment by ID
router.get(
  "/:id",
  assessmentMiddleware.checkAssessmentExistById,
  assessmentController.getById
);
// Update assessment
router.patch(
  "/:id",
  assessmentMiddleware.checkAssessmentExistById,
  uploadFields,
  assessmentController.update
);

module.exports = router;
