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

class CompletedExerciseMiddleware {
  // Check completed exercise is already exist or not by ID
  checkCompletedExerciseExistById = (paramName = "id") => {
    return async (req, res, next) => {
      try {
        const completedExerciseId = req.params[paramName];
        const completedExerciseRef = doc(
          db,
          "completed_exercises",
          completedExerciseId
        );
        const completedExerciseSnap = await getDoc(completedExerciseRef);

        if (!completedExerciseSnap.exists()) {
          return res.status(404).json({
            message: {
              en: "Completed exercise not found!",
              vi: "Không tìm thấy bài tập đã hoàn thành!",
            },
          });
        }
        req.completedExercise = completedExerciseSnap.data();
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

module.exports = new CompletedExerciseMiddleware();
