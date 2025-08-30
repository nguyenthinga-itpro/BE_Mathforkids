const {
  getFirestore,
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  query,
  where,
  Timestamp,
  writeBatch,
  deleteField,
} = require("firebase/firestore");
const db = getFirestore();

class DailyTaskMiddleware {
  // Check daily task is already exist or not by ID
  checkDailyTaskExistById = async (req, res, next) => {
    try {
      const dailyTaskId = req.params.id;
      const dailyTaskRef = doc(db, "daily_tasks", dailyTaskId);
      const dailyTaskSnap = await getDoc(dailyTaskRef);

      if (!dailyTaskSnap.exists()) {
        return res.status(404).json({
          message: {
            en: "Daily task not found!",
            vi: "Không tìm thấy nhiệm vụ hằng ngày này!",
          },
        });
      }
      req.dailyTask = dailyTaskSnap.data();
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

module.exports = new DailyTaskMiddleware();
