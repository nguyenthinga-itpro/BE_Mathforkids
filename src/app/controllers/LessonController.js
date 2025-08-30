const Lesson = require("../models/Lesson");
const CompletedLesson = require("../models/CompletedLesson");
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
  limit,
  startAfter,
  getCountFromServer,
} = require("firebase/firestore");

const db = getFirestore();

class LessonController {
  // Create lesson
  create = async (req, res, next) => {
    try {
      const data = req.body;
      const lessonRef = await addDoc(collection(db, "lessons"), {
        ...data,
        isDisabled: false,
        createdAt: serverTimestamp(),
      });
      // Fetch all pupil IDs from the pupils collection
      const pupilsSnapshot = await getDocs(collection(db, "pupils"));
      const pupilIds = pupilsSnapshot.docs.map((doc) => doc.id);

      // Create completed lesson records for each pupil
      const completedLessonsPromises = pupilIds.map((pupilId) =>
        addDoc(collection(db, "completed_lessons"), {
          pupilId,
          lessonId: lessonRef.id,
          isCompleted: false,
          isBlock: true,
          isDisabled: false,
          createdAt: serverTimestamp(),
        })
      );
      // Execute all completed lesson creations
      await Promise.all(completedLessonsPromises);

      res.status(201).send({
        message: {
          en: "Lesson created successfully!",
          vi: "Tạo bài học thành công!",
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

  // Count all lessons by grade & type
  countAll = async (req, res, next) => {
    try {
      const { grade, type } = req.query;
      const q = query(
        collection(db, "lessons"),
        where("grade", "==", parseInt(grade)),
        where("type", "==", type)
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
  countEnabledLesson = async (req, res, next) => {
    try {
      const q = query(
        collection(db, "lessons"),
        where("isDisabled", "==", false)
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
  // Get all paginated lessons by grade & type
  getAll = async (req, res, next) => {
    try {
      const pageSize = parseInt(req.query.pageSize); // số bài học mỗi trang
      const startAfterId = req.query.startAfterId || null; // ID của document bắt đầu sau đó
      const { grade, type } = req.query;
      let q;

      if (startAfterId) {
        const startDoc = await getDoc(doc(db, "lessons", startAfterId));
        q = query(
          collection(db, "lessons"),
          where("grade", "==", parseInt(grade)),
          where("type", "==", type),
          orderBy("order"),
          startAfter(startDoc),
          limit(pageSize)
        );
      } else {
        q = query(
          collection(db, "lessons"),
          where("grade", "==", parseInt(grade)),
          where("type", "==", type),
          orderBy("order"),
          limit(pageSize)
        );
      }
      const snapshot = await getDocs(q);
      const lessons = snapshot.docs.map((doc) => Lesson.fromFirestore(doc));

      const lastVisible = snapshot.docs[snapshot.docs.length - 1];
      const lastVisibleId = lastVisible ? lastVisible.id : null;

      res.status(200).send({
        data: lessons,
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

  // Count lessons by grade, type & disabled state
  countByDisabledStatus = async (req, res, next) => {
    try {
      const { grade, type, isDisabled } = req.query;
      const q = query(
        collection(db, "lessons"),
        where("grade", "==", parseInt(grade)),
        where("type", "==", type),
        where("isDisabled", "==", isDisabled == "true")
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

  // Filter paginated lessons by grade, type & disabled state
  filterByDisabledStatus = async (req, res, next) => {
    try {
      const pageSize = parseInt(req.query.pageSize); // số bài học mỗi trang
      const startAfterId = req.query.startAfterId || null; // ID của document bắt đầu sau đó
      const { grade, type, isDisabled } = req.query;
      let q;

      if (startAfterId) {
        const startDoc = await getDoc(doc(db, "lessons", startAfterId));
        q = query(
          collection(db, "lessons"),
          where("grade", "==", parseInt(grade)),
          where("type", "==", type),
          where("isDisabled", "==", isDisabled === "true"),
          orderBy("order"),
          startAfter(startDoc),
          limit(pageSize)
        );
      } else {
        q = query(
          collection(db, "lessons"),
          where("grade", "==", parseInt(grade)),
          where("type", "==", type),
          where("isDisabled", "==", isDisabled === "true"),
          orderBy("order"),
          limit(pageSize)
        );
      }
      const snapshot = await getDocs(q);
      const lessons = snapshot.docs.map((doc) => Lesson.fromFirestore(doc));

      const lastVisible = snapshot.docs[snapshot.docs.length - 1];
      const lastVisibleId = lastVisible ? lastVisible.id : null;

      res.status(200).send({
        data: lessons,
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

  getByGradeAndType = async (req, res, next) => {
    try {
      const { grade, type } = req.query;
      const gradeNumber = Number(grade);
      const q = query(
        collection(db, "lessons"),
        where("grade", "==", gradeNumber),
        where("type", "==", type),
        where("isDisabled", "==", false)
      );

      const lessons = await getDocs(q);
      lessons.docs.forEach((doc) => {
        console.log("Found lesson:", doc.data());
      });
      const lessonArray = lessons.docs.map((doc) => Lesson.fromFirestore(doc));
      res.set("Cache-Control", "no-store");
      res.status(200).send(lessonArray);
    } catch (error) {
      res.status(500).send({
        message: {
          en: error.message,
          vi: "Đã xảy ra lỗi nội bộ.",
        },
      });
    }
  };

  getLessonsByGradeAndTypeFiltered = async (req, res, next) => {
    try {
      const { grade, type, pupilId } = req.query;

      if (!grade || !type || !pupilId) {
        return res.status(400).send({
          message: {
            en: "Missing grade, type or pupilId",
            vi: "Thiếu thông tin grade, type hoặc pupilId",
          },
        });
      }

      const gradeNumber = Number(grade);

      // 1. Lấy tất cả lessons theo grade, type, isDisabled = false
      const lessonQuery = query(
        collection(db, "lessons"),
        where("grade", "==", gradeNumber),
        where("type", "==", type),
        where("isDisabled", "==", false),
        orderBy("order"),
      );
      const lessonSnap = await getDocs(lessonQuery);

      // 2. Map bài học theo id
      const lessonMap = new Map();
      lessonSnap.docs.forEach((doc) => {
        lessonMap.set(doc.id, { id: doc.id, ...doc.data() });
      });

      // 3. Lấy thông tin completed của học sinh
      const completedQuery = query(
        collection(db, "completed_lessons"),
        where("pupilId", "==", pupilId)
      );
      const completedSnap = await getDocs(completedQuery);

      // Map lessonId → completed info
      const completedMap = new Map();
      completedSnap.docs.forEach((doc) => {
        const data = doc.data();
        completedMap.set(data.lessonId, {
          isCompleted: data.isCompleted || false,
          isBlock: data.isBlock || false,
          isDisabled: data.isDisabled || false,
          completedId: doc.id,
          completedAt: data.createdAt
            ? data.createdAt.toDate().toISOString()
            : null,
          updatedAt: data.updatedAt
            ? data.updatedAt.toDate().toISOString()
            : null,
        });
      });

      // 4. Trả về toàn bộ lessons (dù completed hay chưa)
      const fullLessons = Array.from(lessonMap.entries()).map(
        ([lessonId, lesson]) => {
          const completed = completedMap.get(lessonId);
          return {
            ...lesson,
            isCompleted: completed?.isCompleted || false,
            isBlock: completed?.isBlock || false,
            isDisabled: completed?.isDisabled || false,
            completedId: completed?.completedId || null,
            completedAt: completed?.completedAt || null,
            updatedAt: completed?.updatedAt || null,
          };
        }
      );

      res.status(200).send(fullLessons);
    } catch (error) {
      console.error("Error in getLessonsByGradeAndTypeFiltered:", error);
      res.status(500).send({
        message: {
          en: error.message,
          vi: "Lỗi lọc bài học",
        },
      });
    }
  };

  // Get a lesson by ID
  getById = async (req, res, next) => {
    const id = req.params.id;
    const lesson = req.lesson;
    res.status(200).send({ id: id, ...lesson });
  };

  // Update lesson
  update = async (req, res, next) => {
    try {
      const id = req.params.id;
      const { createdAt, ...data } = req.body;
      const lessonRef = doc(db, "lessons", id);

      await updateDoc(lessonRef, { ...data, updatedAt: serverTimestamp() });

      if (data.hasOwnProperty("isDisabled")) {
        const completedLessonQuery = query(
          collection(db, "completed_lessons"),
          where("lessonId", "==", id)
        );
        const completedlessonSnapshot = await getDocs(completedLessonQuery);
        const updatePromises = completedlessonSnapshot.docs.map((doc) =>
          updateDoc(doc.ref, {
            isDisabled: data.isDisabled,
            updatedAt: serverTimestamp(),
          })
        );
        await Promise.all(updatePromises);
      }

      res.status(200).send({
        message: {
          en: "Lesson and related completed lessons updated successfully!",
          vi: "Cập nhật bài học và bản ghi hoàn thành bài học thành công!",
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

  // Count all enable lessons
  countLessons = async (req, res, next) => {
    try {
      const q = query(
        collection(db, "lessons"),
        where("isDisabled", "==", false)
      );
      const snapshot = await getDocs(q);
      const count = snapshot.size;
      res.status(200).send({ count: count });
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

module.exports = new LessonController();
