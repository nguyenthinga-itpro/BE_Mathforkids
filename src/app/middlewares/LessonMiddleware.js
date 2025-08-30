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
  limit,
  startAfter,
} = require("firebase/firestore");

const db = getFirestore();

const queryLessonName = async (lessonName) => {
  const qEn = query(
    collection(db, "lessons"),
    where("name.en", "==", lessonName.en)
  );
  const qVi = query(
    collection(db, "lessons"),
    where("name.vi", "==", lessonName.vi)
  );
  const [snapEn, snapVi] = await Promise.all([getDocs(qEn), getDocs(qVi)]);
  return [snapEn, snapVi];
};

class LessonMiddleware {
  // Check lesson is already exist or not
  checkLessonExistById = (paramName = "id") => {
    return async (req, res, next) => {
      try {
        const lessonId = req.params[paramName];
        const lessonRef = doc(db, "lessons", lessonId);
        const lessonSnap = await getDoc(lessonRef);

        if (!lessonSnap.exists()) {
          return res.status(404).json({
            message: {
              en: "Lesson not found!",
              vi: "Không tìm thấy bài học!",
            },
          });
        }

        req.lesson = {
          id: lessonSnap.id,
          ...lessonSnap.data(),
        };

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

  // Check if the lesson name already exists FOR CREATE
  checkNameExistForCreate = async (req, res, next) => {
    try {
      const { name } = req.body;
      const [snapEn, snapVi] = await queryLessonName(name);
      if (!snapEn.empty) {
        return res.status(409).json({
          message: {
            en: "English lesson name already exists!",
            vi: "Tên bài học tiếng Anh đã tồn tại!",
          },
        });
      } else if (!snapVi.empty) {
        return res.status(409).json({
          message: {
            en: "Vietnamese lesson name already exists!",
            vi: "Tên bài học tiếng Việt đã tồn tại!",
          },
        });
      }
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

  // Check if the lesson name already exists FOR UPDATE
  checkNameExistForUpdate = async (req, res, next) => {
    try {
      const id = req.params.id;
      const { name } = req.body;
      const [snapEn, snapVi] = await queryLessonName(name);
      const isEnDuplicate = snapEn.docs.some((doc) => doc.id !== id);
      const isViDuplicate = snapVi.docs.some((doc) => doc.id !== id);
      if (isEnDuplicate) {
        return res.status(409).json({
          message: {
            en: "English lesson name already exists.",
            vi: "Tên bài học tiếng Anh đã tồn tại.",
          },
        });
      } else if (isViDuplicate) {
        return res.status(409).json({
          message: {
            en: "Vietnamese lesson name already exists.",
            vi: "Tên bài học tiếng Việt đã tồn tại.",
          },
        });
      }
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

module.exports = new LessonMiddleware();
