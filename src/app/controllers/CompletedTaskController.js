const CompleteTask = require("../models/CompletedTask");
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
  orderBy,
} = require("firebase/firestore");

const db = getFirestore();

class CompleteTaskController {
  // Create completed task
  create = async (req, res, next) => {
    try {
      const { pupilId, taskId, lessonId, isCompleted } = req.body;
      const taskData = {
        pupilId,
        taskId,
        lessonId,
        isCompleted: false,
        createdAt: serverTimestamp(),
      };
      await addDoc(collection(db, "complete_tasks"), taskData);
      res.status(201).send({
        message: {
          en: "Complete task created successfully!",
          vi: "Thêm nhiệm vụ mới thành công!",
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
  getAll = async (req, res, next) => {
    try {
      const taskSnapshot = await getDocs(collection(db, "complete_tasks"));
      const tasks = taskSnapshot.docs.map((doc) =>
        CompleteTask.fromFirestore(doc)
      );
      res.status(200).send(tasks);
    } catch (error) {
      res.status(500).send({
        message: {
          en: error.message,
          vi: "Đã xảy ra lỗi nội bộ.",
        },
      });
    }
  };

  // Get completed tasks within 7 days by pupil ID
  getWithin7DaysByPupilId = async (req, res, next) => {
    try {
      const pupilId = req.params.pupilId;
      const sevenDaysAgo = Timestamp.fromDate(
        new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      );
      const q = query(
        collection(db, "complete_tasks"),
        where("pupilId", "==", pupilId),
        where("createdAt", ">=", sevenDaysAgo),
        orderBy("createdAt", "desc")
      );
      const taskSnapshot = await getDocs(q);
      const tasks = taskSnapshot.docs.map((doc) =>
        CompleteTask.fromFirestore(doc)
      );
      res.status(200).send(tasks);
    } catch (error) {
      res.status(500).send({
        message: {
          en: error.message,
          vi: "Đã xảy ra lỗi nội bộ.",
        },
      });
    }
  };

  // Get a completed task by ID
  getById = async (req, res, next) => {
    try {
      const id = req.params.id;
      const ref = doc(db, "complete_tasks", id);
      const docSnap = await getDoc(ref);
      if (!docSnap.exists()) {
        return res.status(404).send({ message: "Complete task not found!" });
      }
      const task = CompleteTask.fromFirestore(docSnap);
      res.status(200).send(task);
    } catch (error) {
      res.status(500).send({
        message: {
          en: error.message,
          vi: "Đã xảy ra lỗi nội bộ.",
        },
      });
    }
  };

  // Update completed task status
  updateStatus = async (req, res, next) => {
    try {
      const id = req.params.id;
      const ref = doc(db, "complete_tasks", id);
      await updateDoc(ref, {
        isCompleted: true,
        updatedAt: serverTimestamp(),
      });
      res.status(200).send({
        message: {
          en: "Complete task updated successfully!",
          vi: "Đã cập nhật trạng thái hoàn thành nhiệm vụ!",
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

module.exports = new CompleteTaskController();
