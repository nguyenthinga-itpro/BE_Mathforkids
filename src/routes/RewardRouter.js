const express = require("express");
const rewardController = require("../app/controllers/RewardController");
const rewardMiddleware = require("../app/middlewares/RewardMiddleware");
const router = express.Router();
const multer = require("multer");
const upload = multer({ storage: multer.memoryStorage() });

// Map multiple file fields
const uploadFields = upload.fields([{ name: "image", maxCount: 1 }]);
// Create reward
router.post("/", uploadFields, rewardController.create);
// Get enabled rewards
router.get("/getEnabledRewards", rewardController.getEnabledRewards);
// Get count by isDisabled status
router.get("/countByDisabledStatus", rewardController.countByDisabledStatus);
// Filter by isDisabled with pagination
router.get("/filterByDisabledStatus", rewardController.filterByDisabledStatus);
// Get total count of all rewards
router.get("/countAll", rewardController.countAll);
// Get all rewards (with pagination)
router.get("/", rewardController.getAll);
// Get reward by ID
router.get(
  "/:id",
  rewardMiddleware.checkRewardExistById(),
  rewardController.getById
);
// Update reward by ID
router.patch(
  "/:id",
  rewardMiddleware.checkRewardExistById(),
  uploadFields,
  rewardController.update
);

module.exports = router;
