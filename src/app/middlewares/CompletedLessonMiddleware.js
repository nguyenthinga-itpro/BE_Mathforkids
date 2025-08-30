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

class CompletedLessonMiddleware {
  // Check completed lesson is already exist or not by ID
  checkCompletedLessonExistById = async (req, res, next) => {
    try {
      const completedLessonId = req.params.id;
      const completedLessonRef = doc(
        db,
        "completed_lessons",
        completedLessonId
      );
      const completedLessonSnap = await getDoc(completedLessonRef);

      if (!completedLessonSnap.exists()) {
        return res.status(404).json({
          message: {
            en: "Completed lesson not found!",
            vi: "Bài học chưa được đánh dấu hoàn thành!",
          },
        });
      }
      req.completedLesson = completedLessonSnap.data();
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

module.exports = new CompletedLessonMiddleware();
