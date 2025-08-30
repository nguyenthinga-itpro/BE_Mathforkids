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

class GeneralNotificationMiddleware {
  // Check general notification is already exist or not by ID
  checkGeneralNotiExistById = async (req, res, next) => {
    try {
      const generalNotificationId = req.params.id;
      const generalNotificationRef = doc(db, "general_notifications", generalNotificationId);
      const generalNotificationSnap = await getDoc(generalNotificationRef);

      if (!generalNotificationSnap.exists()) {
        return res.status(404).json({
          message: {
            en: "General notification not found!",
            vi: "Không tìm thấy thông báo chung này!",
          },
        });
      }
      req.generalNotification = generalNotificationSnap.data();
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

module.exports = new GeneralNotificationMiddleware();