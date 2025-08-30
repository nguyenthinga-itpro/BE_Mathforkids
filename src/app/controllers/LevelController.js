const Level = require("../models/Level");
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
  query,
  where,
  limit,
  startAfter,
  orderBy,
} = require("firebase/firestore");

const db = getFirestore();

class LevelController {
  // Create level
  create = async (req, res) => {
    try {
      const data = req.body;
      const newDocRef = await addDoc(collection(db, "levels"), {
        ...data,
        isDisabled: false,
        createdAt: serverTimestamp(),
      });
      res.status(201).send({
        message: {
          en: "Level created successfully!",
          vi: "Tạo cấp độ thành công!",
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

  // Count all levels
  countAll = async (req, res, next) => {
    try {
      const q = query(
        collection(db, "levels"),
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

  // Get all paginated levels
  getAll = async (req, res) => {
    try {
      const pageSize = parseInt(req.query.pageSize) || 10;
      const startAfterId = req.query.startAfterId || null;

      let q;

      if (startAfterId) {
        const startDoc = await getDoc(doc(db, "levels", startAfterId));
        q = query(
          collection(db, "levels"),
          orderBy("level"),
          startAfter(startDoc),          
          limit(pageSize)
        );
      } else {
        q = query(
          collection(db, "levels"),
          orderBy("level"),
          limit(pageSize)
        );
      }

      const snapshot = await getDocs(q);
      const levels = snapshot.docs.map((doc) => Level.fromFirestore(doc));

      const lastVisible = snapshot.docs[snapshot.docs.length - 1];
      const lastVisibleId = lastVisible ? lastVisible.id : null;

      res.status(200).send({
        data: levels,
        nextPageToken: lastVisibleId, // dùng cho trang kế tiếp
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

  // Get enabled levels
  getEnabledLevels = async (req, res) => {
    try {
      const levelsRef = collection(db, "levels");
      const q = query(levelsRef, where("isDisabled", "==", false), orderBy("level"),);
      const snapshot = await getDocs(q);
      const levels = snapshot.docs.map((doc) => Level.fromFirestore(doc));
      res.status(200).send(levels);
    } catch (error) {
      res.status(500).send({
        message: {
          en: error.message,
          vi: "Đã xảy ra lỗi nội bộ.",
        },
      });
    }
  };

  // Get level by ID
  getById = async (req, res) => {
    const id = req.params.id;
    const level = req.level;
    res.status(200).send({ id: id, ...level });
  };

  // Count levels by disabled state
  countByDisabledStatus = async (req, res, next) => {
    try {
      const { isDisabled } = req.query;
      const q = query(
        collection(db, "levels"),
        where("isDisabled", "==", isDisabled === "true"),
        orderBy("level"),
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

  // Filter all paginated levels by disabled state
  filterByDisabledState = async (req, res) => {
    try {
      const pageSize = parseInt(req.query.pageSize) || 10; // số bài học mỗi trang
      const startAfterId = req.query.startAfterId || null;
      const { isDisabled } = req.query;
      let q;
      if (startAfterId) {
        const startDoc = await getDoc(doc(db, "levels", startAfterId));
        q = query(
          collection(db, "levels"),
          where("isDisabled", "==", isDisabled === "true"),
          orderBy("level"),
          startAfter(startDoc),
          limit(pageSize)
        );
      } else {
        q = query(
          collection(db, "levels"),
          where("isDisabled", "==", isDisabled === "true"),
          orderBy("level"),
          limit(pageSize)
        );
      }
      const snapshot = await getDocs(q);
      const level = snapshot.docs.map((doc) =>
        Level.fromFirestore(doc)
      );
      const lastVisible = snapshot.docs[snapshot.docs.length - 1];
      const lastVisibleId = lastVisible ? lastVisible.id : null;
      res.status(200).send({
        data: level,
        nextPageToken: lastVisibleId, // Dùng làm startAfterId cho trang kế
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

  // Update level
  update = async (req, res) => {
    try {
      const levelId = req.params.id;
      const { createdAt, ...data } = req.body;
      const docRef = doc(db, "levels", levelId);
      await updateDoc(docRef, {
        ...data,
        updatedAt: serverTimestamp(),
      });
      res.status(200).send({
        message: {
          en: "Level updated successfully!",
          vi: "Cập nhật cấp độ thành công!",
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

module.exports = new LevelController();
