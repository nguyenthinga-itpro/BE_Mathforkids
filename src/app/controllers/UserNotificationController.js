const UserNotification = require("../models/UserNotification");
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
  Timestamp,
  query,
  where,
  orderBy,
} = require("firebase/firestore");

const db = getFirestore();

class UserNotificationController {
  // Create user notification
  create = async (req, res, next) => {
    try {
      const data = req.body;
      const notificationData = {
        ...data,
        isRead: false,
        createdAt: serverTimestamp(),
      };
      await addDoc(collection(db, "user_notifications"), notificationData);
      res.status(201).send({
        message: {
          en: "User notification created successfully!",
          vi: "Thông báo của người dùng đã được tạo thành công!",
        },
      });
    } catch (error) {
      res.status(500).send({
        message: {
          en: error.message,
          vi: "Đã xảy ra lỗi nội bộ.",
        },
      });
    }
  };

  // Get user notifications within 30 days by user ID
  getWithin30DaysByUserId = async (req, res, next) => {
    try {
      const userId = req.params.userId;
      // Tính timestamp 30 ngày trước
      const thirtyDaysAgo = Timestamp.fromDate(
        new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      );
      const q = query(
        collection(db, "user_notifications"),
        where("userId", "==", userId),
        where("createdAt", ">=", thirtyDaysAgo),
        orderBy("createdAt", "desc")
      );
      const notificationSnapshot = await getDocs(q);
      const notifications = notificationSnapshot.docs.map((doc) =>
        UserNotification.fromFirestore(doc)
      );
      res.status(200).send(notifications);
    } catch (error) {
      res.status(500).send({
        message: {
          en: error.message,
          vi: "Đã xảy ra lỗi nội bộ.",
        },
      });
    }
  };

  // Get an user notification by ID
  getById = async (req, res, next) => {
    const id = req.params.id;
    const userNotification = req.userNotification;
    res.status(200).send({ id: id, ...userNotification });
  };

  // Update user notification status
  updateStatus = async (req, res, next) => {
    try {
      const id = req.params.id;
      const ref = doc(db, "user_notifications", id);
      await updateDoc(ref, { isRead: true });
      res.status(200).send({
        message: {
          en: "User notification status updated successfully!",
          vi: "Trạng thái thông báo của người dùng đã được cập nhật thành công!",
        },
      });
    } catch (error) {
      res.status(500).send({
        message: {
          en: error.message,
          vi: "Đã xảy ra lỗi nội bộ.",
        },
      });
    }
  };
}

module.exports = new UserNotificationController();
