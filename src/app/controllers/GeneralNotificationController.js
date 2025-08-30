const GeneralNotification = require("../models/GeneralNotification");
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
  getCountFromServer,
  orderBy,
  limit,
  startAfter,
  where,
  query
} = require("firebase/firestore");

const db = getFirestore();

class GeneralNotificationController {
  // Create general notification
  create = async (req, res, next) => {
    try {
      const data = req.body;
      const newDocRef = await addDoc(collection(db, "general_notifications"), {
        ...data,
        createdAt: serverTimestamp(),
      });
      res.status(201).send({
        message: {
          en: "General notification created successfully!",
          vi: "Tạo thông báo chung thành công!",
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

  // Count all generalNotification
  countAll = async (req, res, next) => {
    try {
      const q = query(
        collection(db, "general_notifications"),
      );
      const snapshot = await getCountFromServer(q);
      res.status(200).send({ count: snapshot.data().count });
    } catch (error) {
      res.status(500).send({
        message: {
          en: error.message,
          vi: "Đã xảy ra lỗi nội bộ.",
        },
      });
    }
  };

  getAll = async (req, res) => {
    try {
      const pageSize = parseInt(req.query.pageSize) || 10;
      const startAfterId = req.query.startAfterId || null;

      let q;

      if (startAfterId) {
        const startDoc = await getDoc(doc(db, "general_notifications", startAfterId));
        q = query(
          collection(db, "general_notifications"),
          orderBy("createdAt", "desc"),
          startAfter(startDoc),
          limit(pageSize)
        );
      } else {
        q = query(
          collection(db, "general_notifications"),
          orderBy("createdAt", "desc"),
          limit(pageSize)
        );
      }

      const snapshot = await getDocs(q);
      const notifications = snapshot.docs.map((doc) =>
        GeneralNotification.fromFirestore(doc)
      );

      const lastVisible = snapshot.docs[snapshot.docs.length - 1];
      const lastVisibleId = lastVisible ? lastVisible.id : null;

      res.status(200).send({
        data: notifications,
        nextPageToken: lastVisibleId, // dùng làm startAfterId cho lần gọi sau
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


  getAllWithin30Days = async (req, res, next) => {
    try {
      const thirtyDaysAgo = Timestamp.fromDate(
        new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      );
      const q = query(
        collection(db, "general_notifications"),
        where("createdAt", ">=", thirtyDaysAgo),
        orderBy("createdAt", "desc")
      );
      const querySnapshot = await getDocs(q);
      const notifications = [];
      querySnapshot.forEach((doc) => {
        notifications.push(GeneralNotification.fromFirestore(doc));
      });
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

  // Get general notification by ID
  getById = async (req, res, next) => {
    const id = req.params.id;
    const generalNotification = req.generalNotification;
    res.status(200).send({ id: id, ...generalNotification });
  };
}

module.exports = new GeneralNotificationController();
