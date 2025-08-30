const express = require("express");
const userController = require("../app/controllers/UserController");
const userMiddleware = require("../app/middlewares/UserMiddleware");
const multer = require("multer");
const upload = multer({ storage: multer.memoryStorage() });
const router = express.Router();

// Create user
router.post(
  "/",
  userMiddleware.checkPhoneExistForCreate,
  userMiddleware.checkEmailExistForCreate,
  userController.create
);
// Get count by isDisabled status
router.get("/countByDisabledStatus", userController.countByDisabledStatus);
// Filter by isDisabled with pagination
router.get("/filterByDisabledStatus", userController.filterByDisabledStatus);
// Filter user by role
router.get("/filterByRole", userController.filterByRole);
// router.get("/countByGender", userController.countByGender);
// Count users by role
router.get("/countByRole", userController.countByRole);
// Get total count of all users
router.get("/countAll", userController.countAll);
// Count all parents
router.get("/countParents", userController.countParents);
// Get all users
router.get("/", userController.getAll);
// Count all exist user
router.get("/countuser", userController.countUsers);
// Count new users by month
router.get("/countusersbymonth", userController.countUsersByMonth);
// Count new users by quarter
router.get("/countUsersByQuarter", userController.countUsersByQuarter);
// Count new users by season
router.get("/countUsersBySeason", userController.countUsersBySeason);
// Count new users by week
router.get("/countusersbyweek", userController.countUsersByWeek);
// Count new users by year
router.get("/countusersbyyear", userController.countUsersByYear);
// Update user information
router.patch(
  "/updateProfile/:id",
  userMiddleware.checkUserExistById(),
  userController.update
);
// Get an user by ID
router.get("/:id", userMiddleware.checkUserExistById(), userController.getById);
// Update image profile
router.patch(
  "/updateImageProfile/:id",
  upload.single("image"),
  userMiddleware.checkUserExistById(),
  userController.uploadImageProfileToS3
);
// Update pin
router.patch(
  "/updatePin/:id",
  userMiddleware.checkUserExistById(),
  userMiddleware.checkPin,
  userController.update
);

module.exports = router;
