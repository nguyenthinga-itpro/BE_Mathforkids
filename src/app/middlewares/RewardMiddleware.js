const {
  getFirestore,
  collection,
  doc,
  getDoc,
  serverTimestamp,
  query,
  where,
  Timestamp,
} = require("firebase/firestore");
const db = getFirestore();

class RewardMiddleware {
  // Check reward is already exist or not by ID
  checkRewardExistById = (paramName = "id") => {
    return async (req, res, next) => {
      try {
        const rewardId = req.params[paramName];
        const rewardRef = doc(db, "reward", rewardId);
        const rewardSnap = await getDoc(rewardRef);

        if (!rewardSnap.exists()) {
          return res.status(404).json({
            message: {
              en: "Reward not found!",
              vi: "Không tìm thấy bài tập!",
            },
          });
        }
        req.reward = rewardSnap.data();
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
  };
}

module.exports = new RewardMiddleware();
