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

class TestQuestionMiddleware {
  // Check test question is already exist or not by ID
  checkTestQuestionExistById = async (req, res, next) => {
    try {
      const testQuestionId = req.params.id;
      const testQuestionRef = doc(db, "test_questions", testQuestionId);
      const testQuestionSnap = await getDoc(testQuestionRef);

      if (!testQuestionSnap.exists()) {
        return res.status(404).json({
          message: {
            en: "Test question not found!",
            vi: "Không tìm thấy câu hỏi của bài kiểm tra!",
          },
        });
      }
      req.testQuestion = testQuestionSnap.data();
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

module.exports = new TestQuestionMiddleware();
