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

class CompletedQuestionMiddleware {
  // Check completed question is already exist or not by ID
  checkCompletedQuestionExistById = async (req, res, next) => {
    try {
      const completedQuestionId = req.params.id;
      const completedQuestionRef = doc(
        db,
        "completed_questions",
        completedQuestionId
      );
      const completedQuestionSnap = await getDoc(completedQuestionRef);

      if (!completedQuestionSnap.exists()) {
        return res.status(404).json({
          message: {
            en: "Completed question not found!",
            vi: "Không tìm thấy câu hỏi của bài tập!",
          },
        });
      }
      req.completedQuestion = completedQuestionSnap.data();
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

module.exports = new CompletedQuestionMiddleware();
