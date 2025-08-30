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

class ExerciseMiddleware {
  // Check exercise is already exist or not by ID
  checkExerciseExistById = async (req, res, next) => {
    try {
      const exerciseId = req.params.id;
      const exerciseRef = doc(db, "exercises", exerciseId);
      const exerciseSnap = await getDoc(exerciseRef);

      if (!exerciseSnap.exists()) {
        return res.status(404).json({
          message: {
            en: "Exercise not found!",
            vi: "Không tìm thấy bài tập!",
          },
        });
      }
      req.exercise = exerciseSnap.data();
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

module.exports = new ExerciseMiddleware();
