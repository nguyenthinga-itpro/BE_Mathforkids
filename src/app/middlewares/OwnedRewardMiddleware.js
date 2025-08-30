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

class OwnedRewardMiddleware {
  // Check owned reward is already exist or not by ID
  checkOwnedRewardExistById = async (req, res, next) => {
    try {
      const ownedRewardId = req.params.id;
      const ownedRewardRef = doc(db, "owned_rewards", ownedRewardId);
      const ownedRewardSnap = await getDoc(ownedRewardRef);

      if (!ownedRewardSnap.exists()) {
        return res.status(404).json({
          message: {
            en: "Owned reward not found!",
            vi: "Không tìm thấy phần thưởng này của học sinh!",
          },
        });
      }
      req.ownedReward = ownedRewardSnap.data();
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

module.exports = new OwnedRewardMiddleware();
