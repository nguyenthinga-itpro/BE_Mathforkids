const {
  getFirestore,
  collection,
  doc,
  getDoc,
  getDocs,
  serverTimestamp,
  query,
  where,
  Timestamp,
} = require("firebase/firestore");
const db = getFirestore();

class PupilMiddleware {
  // Check pupil is already exist or not by ID
  checkPupilExistById = (paramName = "id") => {
    return async (req, res, next) => {
      try {
        const pupilId = req.params[paramName];
        const pupilRef = doc(db, "pupils", pupilId);
        const pupilSnap = await getDoc(pupilRef);

        if (!pupilSnap.exists()) {
          return res.status(404).json({
            message: {
              en: "Pupil not found!",
              vi: "Không tìm thấy học sinh!",
            },
          });
        }
        req.pupil = pupilSnap.data();
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

  // Check if the nickname already exists FOR CREATE
  checkNicknameExistForCreate = async (req, res, next) => {
    try {
      const { nickName } = req.body;
      const q = query(
        collection(db, "pupils"),
        where("nickName", "==", nickName)
      );
      const snapshot = await getDocs(q);
      if (!snapshot.empty) {
        return res.status(409).json({
          message: {
            en: "Nickname already exists!",
            vi: "Biệt danh đã tồn tại!",
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

  // Check if the nickname already exists FOR UPDATE
  checkNicknameExistForUpdate = async (req, res, next) => {
    try {
      const id = req.params.id;
      const { nickName } = req.body;
      const q = query(
        collection(db, "pupils"),
        where("nickName", "==", nickName)
      );
      const snapshot = await getDocs(q);
      const isDuplicate = snapshot.docs.some((doc) => doc.id !== id);
      if (isDuplicate) {
        return res.status(409).json({
          message: {
            en: "Nickname already exists!",
            vi: "Biệt danh đã tồn tại!",
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

module.exports = new PupilMiddleware();
