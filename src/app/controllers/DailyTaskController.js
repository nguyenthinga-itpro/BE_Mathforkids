const DailyTask = require("../models/DailyTask");
const {
  getFirestore,
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  orderBy,
  limit,
  getCountFromServer,
  startAfter,
  serverTimestamp,
  query,
  where,
} = require("firebase/firestore");
const db = getFirestore();

class DailyTaskController {
  countByDisabledStatus = async (req, res, next) => {
    try {
      const { isDisabled } = req.query;
      const q = query(
        collection(db, "daily_tasks"),
        where("isDisabled", "==", isDisabled === "true")
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

  filterByDisabledStatus = async (req, res) => {
    try {
      const pageSize = parseInt(req.query.pageSize) || 10;
      const startAfterId = req.query.startAfterId || null;
      const { isDisabled } = req.query;
      let q;
      if (startAfterId) {
        const startDoc = await getDoc(doc(db, "daily_tasks", startAfterId));
        q = query(
          collection(db, "daily_tasks"),
          where("isDisabled", "==", isDisabled === "true"),
          orderBy("createdAt", "desc"),
          startAfter(startDoc),
          limit(pageSize)
        );
      } else {
        q = query(
          collection(db, "daily_tasks"),
          where("isDisabled", "==", isDisabled === "true"),
          orderBy("createdAt", "desc"),
          limit(pageSize)
        );
      }

      const snapshot = await getDocs(q);
      const tasks = snapshot.docs.map((doc) => DailyTask.fromFirestore(doc));
      const lastVisible = snapshot.docs[snapshot.docs.length - 1];
      const lastVisibleId = lastVisible ? lastVisible.id : null;

      res.status(200).send({
        data: tasks,
        nextPageToken: lastVisibleId,
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

  // Create daily task
  create = async (req, res, next) => {
    try {
      const data = req.body;
      await addDoc(collection(db, "daily_tasks"), {
        ...data,
        isDisabled: false,
        createdAt: serverTimestamp(),
      });
      res.status(201).send({
        message: {
          en: "Daily task created successfully!",
          vi: "Tạo nhiệm vụ hằng ngày thành công!",
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

  countAll = async (req, res, next) => {
    try {
      const q = query(collection(db, "daily_tasks"));
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

  // Get all daily tasks
  getAll = async (req, res, next) => {
    try {
      const pageSize = parseInt(req.query.pageSize) || 10;
      const startAfterId = req.query.startAfterId || null;

      let q;

      if (startAfterId) {
        // Lấy document bắt đầu sau đó
        const startDocRef = doc(db, "daily_tasks", startAfterId);
        const startDocSnap = await getDoc(startDocRef);

        if (!startDocSnap.exists()) {
          return res.status(400).send({
            message: {
              en: "Invalid startAfterId",
              vi: "startAfterId không hợp lệ",
            },
          });
        }

        q = query(
          collection(db, "daily_tasks"),
          orderBy("createdAt", "desc"),
          startAfter(startDocSnap),
          limit(pageSize)
        );
      } else {
        q = query(
          collection(db, "daily_tasks"),
          orderBy("createdAt", "desc"),
          limit(pageSize)
        );
      }

      const snapshot = await getDocs(q);
      const dailyTasks = snapshot.docs.map((doc) =>
        DailyTask.fromFirestore(doc)
      );

      const lastVisible = snapshot.docs[snapshot.docs.length - 1];
      const lastVisibleId = lastVisible ? lastVisible.id : null;

      res.status(200).send({
        data: dailyTasks,
        nextPageToken: lastVisibleId,
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

  // Get enable daily tasks
  getEnabledDailyTask = async (req, res, next) => {
    try {
      const q = query(
        collection(db, "daily_tasks"),
        where("isDisabled", "==", false)
      );
      const dailyTasks = await getDocs(q);
      const dailyTaskArray = dailyTasks.docs.map((doc) =>
        DailyTask.fromFirestore(doc)
      );
      res.status(200).send(dailyTaskArray);
    } catch (error) {
      res.status(500).send({
        message: {
          en: error.message,
          vi: "Đã xảy ra lỗi nội bộ.",
        },
      });
    }
  };

  // Get a daily task by ID
  getById = async (req, res, next) => {
    const id = req.params.id;
    const dailyTask = req.dailyTask;
    res.status(200).send({ id: id, ...dailyTask });
  };

  // Update daily task
  update = async (req, res, next) => {
    try {
      const id = req.params.id;
      const { createdAt, ...data } = req.body;
      const ref = doc(db, "daily_tasks", id);
      await updateDoc(ref, { ...data, updatedAt: serverTimestamp() });
      res.status(200).send({
        message: {
          en: "Daily task updated successfully!",
          vi: "Cập nhật nhiệm vụ hằng ngày thành công!",
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

module.exports = new DailyTaskController();
