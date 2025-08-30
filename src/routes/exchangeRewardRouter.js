const express = require("express");
const exchangeRewardController = require("../app/controllers/ExchangeRewardController");
const pupilMiddleware = require("../app/middlewares/PupilMiddleware");
const exchangeRewardMiddleware = require("../app/middlewares/ExchangeRewardMiddleward");

const router = express.Router();
// 
router.post("/", exchangeRewardController.create);
// 
router.get("/getByPupilId/:pupilId",
    pupilMiddleware.checkPupilExistById("pupilId"),
    exchangeRewardController.getByPupilId);
//
router.get(
    "/countRewardByPupilId/:pupilId",
    pupilMiddleware.checkPupilExistById("pupilId"),
    exchangeRewardController.countRewardByPupilId
);
//
router.get("/:id", exchangeRewardController.getById);
//
router.patch(
    "/:id",
    exchangeRewardMiddleware.checkExchangeRewardExistById(),
    exchangeRewardController.update
);

module.exports = router;
