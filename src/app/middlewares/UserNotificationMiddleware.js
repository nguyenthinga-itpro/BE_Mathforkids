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
  Timestamp,
  writeBatch,
  deleteField,
} = require("firebase/firestore");
const db = getFirestore();

class UserNotificationMiddleware {
  // Check user notification is already exist or not by ID
  checkUserNotiExistById = async (req, res, next) => {
    try {
      const userNotificationId = req.params.id;
      const userNotificationRef = doc(
        db,
        "user_notifications",
        userNotificationId
      );
      const userNotificationSnap = await getDoc(userNotificationRef);

      if (!userNotificationSnap.exists()) {
        return res.status(404).json({
          message: {
            en: "User notification not found!",
            vi: "Không tìm thấy thông báo của người dùng!",
          },
        });
      }
      req.userNotification = userNotificationSnap.data();
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

module.exports = new UserNotificationMiddleware();
