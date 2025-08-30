const {
  getFirestore,
  collection,
  doc,
  getDoc,
  serverTimestamp,
  query,
  where,
  getDocs,
  Timestamp,
} = require("firebase/firestore");
const db = getFirestore();

const queryLevelName = async (levelName) => {
  const qEn = query(
    collection(db, "levels"),
    where("name.en", "==", levelName.en)
  );
  const qVi = query(
    collection(db, "levels"),
    where("name.vi", "==", levelName.vi)
  );
  const [snapEn, snapVi] = await Promise.all([getDocs(qEn), getDocs(qVi)]);
  return [snapEn, snapVi];
};

class LevelMiddleware {
  // Check level is already exist or not by ID
  checkLevelExistById = (paramName = "id") => {
    return async (req, res, next) => {
      try {
        const levelId = req.params[paramName];
        const levelRef = doc(db, "levels", levelId);
        const levelSnap = await getDoc(levelRef);

        if (!levelSnap.exists()) {
          return res.status(404).json({
            message: {
              en: "Level not found!",
              vi: "Không tìm thấy cấp độ!",
            },
          });
        }
        req.level = levelSnap.data();
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

  // Check if the level name already exists FOR CREATE
  checkNameExistForCreate = async (req, res, next) => {
    try {
      const { name } = req.body;
      const [snapEn, snapVi] = await queryLevelName(name);
      if (!snapEn.empty) {
        return res.status(409).json({
          message: {
            en: "English level name already exists!",
            vi: "Tên cấp độ tiếng Anh đã tồn tại!",
          },
        });
      } else if (!snapVi.empty) {
        return res.status(409).json({
          message: {
            en: "Vietnamese level name already exists!",
            vi: "Tên cấp độ tiếng Việt đã tồn tại!",
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

  // Check if the level name already exists FOR UPDATE
  checkNameExistForUpdate = async (req, res, next) => {
    try {
      const id = req.params.id;
      const { name } = req.body;
      const [snapEn, snapVi] = await queryLevelName(name);
      const isEnDuplicate = snapEn.docs.some((doc) => doc.id !== id);
      const isViDuplicate = snapVi.docs.some((doc) => doc.id !== id);
      if (isEnDuplicate) {
        return res.status(409).json({
          message: {
            en: "English level name already exists!",
            vi: "Tên cấp độ tiếng Anh đã tồn tại!",
          },
        });
      } else if (isViDuplicate) {
        return res.status(409).json({
          message: {
            en: "Vietnamese level name already exists!",
            vi: "Tên cấp độ tiếng Việt đã tồn tại!",
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

module.exports = new LevelMiddleware();
