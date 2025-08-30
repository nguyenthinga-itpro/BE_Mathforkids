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

class AssessmentMiddleware {
  // Check assessment is already exist or not by ID
  checkAssessmentExistById = async (req, res, next) => {
    try {
      const assessmentId = req.params.id;
      const assessmentRef = doc(db, "assessments", assessmentId);
      const assessmentSnap = await getDoc(assessmentRef);

      if (!assessmentSnap.exists()) {
        return res.status(404).json({
          message: {
            en: "Assessment not found!",
            vi: "Không tìm thấy bài kiểm tra đầu vào!",
          },
        });
      }
      req.assessment = assessmentSnap.data();
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

module.exports = new AssessmentMiddleware();
