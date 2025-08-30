const express = require("express");
const levelController = require("../app/controllers/LevelController");
const levelMiddleware = require("../app/middlewares/LevelMiddleware");
const router = express.Router();

// Create level
router.post(
  "/",
  levelMiddleware.checkNameExistForCreate,
  levelController.create
);
// Count by disabled state
router.get("/countByDisabledStatus", levelController.countByDisabledStatus);
// Filter paginated levels by disabled state
router.get("/filterByDisabledStatus", levelController.filterByDisabledState);
// Count all levels
router.get("/countAll", levelController.countAll);
// Get all levels
router.get("/", levelController.getAll);
// Get enabled levels
router.get("/getEnabledLevels", levelController.getEnabledLevels);
// Get level by ID
router.get(
  "/:id",
  levelMiddleware.checkLevelExistById(),
  levelController.getById
);
// Update level
router.patch(
  "/:id",
  levelMiddleware.checkLevelExistById(),
  levelMiddleware.checkNameExistForUpdate,
  levelController.update
);

router.patch(
  "/updateOrder/:id",
  levelMiddleware.checkLevelExistById(),
  levelController.update
);

module.exports = router;
