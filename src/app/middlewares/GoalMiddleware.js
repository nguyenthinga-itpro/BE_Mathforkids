const {
  getFirestore,
  collection,
  doc,
  getDoc,
  getDocs,
  serverTimestamp,
  query,
  where,
  Timestamp,
} = require("firebase/firestore");
const db = getFirestore();

class GoalMiddleware {
  // Check goal is already exist or not by ID
  checkGoalExistById = async (req, res, next) => {
    try {
      const goalId = req.params.id;
      const goalRef = doc(db, "goal", goalId);
      const goalSnap = await getDoc(goalRef);

      if (!goalSnap.exists()) {
        return res.status(404).json({
          message: {
            en: "Goal not found!",
            vi: "Không tìm thấy mục tiêu này!",
          },
        });
      }
      req.goal = goalSnap.data();
      return next();
    } catch (error) {
      return res.status(500).json({
        message: {
          en: error.message,
          vi: "Đã xảy ra lỗi nội bộ.",
        },
      });
    }
  };
}
module.exports = new GoalMiddleware();
