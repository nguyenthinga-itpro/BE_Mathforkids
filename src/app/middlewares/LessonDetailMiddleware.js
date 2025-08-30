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
} = require("firebase/firestore");

const db = getFirestore();

class LessonDetailMiddleware {
  // Check lesson detail is already exist or not
  checkLessonDeatailExistById = async (req, res, next) => {
    try {
      const lessonDetailId = req.params.id;
      const lessonDetailRef = doc(db, "lesson_details", lessonDetailId);
      const lessonDetailSnap = await getDoc(lessonDetailRef);
      if (!lessonDetailSnap.exists()) {
        return res.status(404).json({
          message: {
            en: "Lesson detail not found!",
            vi: "Không tìm thấy chi tiết bài học!",
          },
        });
      }
      req.lessonDetail = lessonDetailSnap.data();
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

module.exports = new LessonDetailMiddleware();
