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

class PupilNotificationMiddleware {
  // Check pupil notification is already exist or not by ID
  checkPupilNotiExistById = async (req, res, next) => {
    try {
      const pupilNotificationId = req.params.id;
      const pupilNotificationRef = doc(db, "pupil_notifications", pupilNotificationId);
      const pupilNotificationSnap = await getDoc(pupilNotificationRef);

      if (!pupilNotificationSnap.exists()) {
        return res.status(404).json({
          message: {
            en: "Pupil notification not found!",
            vi: "Không tìm thấy thông báo này của học sinh!",
          },
        });
      }
      req.pupilNotification = pupilNotificationSnap.data();
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

module.exports = new PupilNotificationMiddleware();
