const express = require("express");
const ownedRewardController = require("../app/controllers/OwnedRewardsController");
const pupilMiddleware = require("../app/middlewares/PupilMiddleware");
const rewardMiddleware = require("../app/middlewares/RewardMiddleware");
const ownedRewardMiddleware = require("../app/middlewares/OwnedRewardMiddleware");
const router = express.Router();

// Create or update owned reward
router.post(
  "/create/:pupilId/:rewardId",
  pupilMiddleware.checkPupilExistById("pupilId"),
  rewardMiddleware.checkRewardExistById("rewardId"),
  ownedRewardController.createOrUpdate
);
// Get owned rewards by pupil ID
router.get(
  "/getByPupilId/:pupilId",
  pupilMiddleware.checkPupilExistById("pupilId"),
  ownedRewardController.getByPupilId
);
router.get(
  "/countByPupilId/:pupilId",
  pupilMiddleware.checkPupilExistById("pupilId"),
  ownedRewardController.countByPupilId
);
// Get an owned reward by ID
router.get(
  "/:id",
  ownedRewardMiddleware.checkOwnedRewardExistById,
  ownedRewardController.getById
);

module.exports = router;
