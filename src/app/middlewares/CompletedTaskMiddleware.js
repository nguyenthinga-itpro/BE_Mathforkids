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

class CompletedTaskMiddleware {
  // Check completed task is already exist or not by ID
  checkCompletedTaskExistById = async (req, res, next) => {
    try {
      const completedTaskId = req.params.id;
      const completedTaskRef = doc(db, "complete_tasks", completedTaskId);
      const completedTaskSnap = await getDoc(completedTaskRef);

      if (!completedTaskSnap.exists()) {
        return res.status(404).json({
          message: {
            en: "Completed task not found!",
            vi: "Không tìm thấy nhiệm vụ này của học sinh!",
          },
        });
      }
      req.completedTask = completedTaskSnap.data();
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

module.exports = new CompletedTaskMiddleware();
