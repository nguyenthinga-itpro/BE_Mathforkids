const CompletedExercises = require("../models/CompletedExercise");
const {
  getFirestore,
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  getCountFromServer,
  serverTimestamp,
  query,
  where,
  orderBy,
  limit,
  startAfter,
} = require("firebase/firestore");
const db = getFirestore();

class CompletedExerciseController {
  // Create completed exercise
  create = async (req, res, next) => {
    try {
      const data = req.body;
      await addDoc(collection(db, "completed_exercises"), {
        ...data,
        createdAt: serverTimestamp(),
      });
      res.status(201).send({
        message: {
          en: "Completed exercise created successfully",
          vi: "Lưu bài tập đã hoàn thành thành công!",
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

  // Get completed exercise by ID
  getById = async (req, res, next) => {
    const id = req.params.id;
    const completedExercise = req.completedExercise;
    res.status(200).send({ id: id, ...completedExercise });
  };

  // Count all  completed exercises
  countAll = async (req, res, next) => {
    try {
      const q = query(collection(db, "completed_exercises"));
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
  countCompletedExercisePupil = async (req, res, next) => {
    try {
      const pupilId = req.params.pupilId;
      const grade = req.query.grade;
      console.log("Querying for pupilId:", pupilId); // Debug log
      const lessonQuery = query(
        collection(db, "lessons"),
        where("grade", "==", parseInt(grade))
      );
      const lessonSnapshot = await getDocs(lessonQuery);
      const lessonIds = lessonSnapshot.docs.map(doc => doc.id);
      if (lessonIds.length === 0) {
        return res.status(200).send({
          totalLessons: 0,
          completedLessons: 0,
          completedExercises: 0
        })
      }
      const chunkArray = (array, size) => {
        const chunks = [];
        for (let i = 0; i < array.length; i += size) {
          chunks.push(array.slice(i, i + size));
        }
        return chunks;
      }
      const lessonIdChunks = chunkArray(lessonIds, 30);
      let totalLessons = lessonIds.length;
      let completedLessons = 0;
      let uniqueExercises = new Set();
      for (const chunk of lessonIdChunks) {
        const lessonQuery = query(
          collection(db, "completed_lessons"),
          where("pupilId", "==", pupilId),
          where("lessonId", "in", chunk),
          where("isBlock", "==", false),
          where("isCompleted", "==", true),
        );
        const LessonSnapshot = await getCountFromServer(lessonQuery);
        completedLessons += LessonSnapshot.data().count;

        const exerciseQuery = query(
          collection(db, "completed_exercises"),
          where("pupilId", "==", pupilId),
          where("lessonId", "in", chunk)
        )
        const ExerciseSnapshot = await getDocs(exerciseQuery);
        ExerciseSnapshot.docs.forEach(doc => {
          const data = doc.data();
          if (data.lessonId) {
            uniqueExercises.add(data.lessonId);
          }
        })
      }
      res.status(200).send({
        totalLessons,
        completedLessons,
        completedExercises: uniqueExercises.size
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
  // Get all paginated completed exercises
  getAll = async (req, res) => {
    try {
      const pageSize = parseInt(req.query.pageSize) || 10;
      const startAfterId = req.query.startAfterId || null;

      let q;
      if (startAfterId) {
        const startDoc = await getDoc(
          doc(db, "completed_exercises", startAfterId)
        );
        q = query(
          collection(db, "completed_exercises"),
          startAfter(startDoc),
          orderBy("createdAt", "desc"),
          limit(pageSize)
        );
      } else {
        q = query(
          collection(db, "tests"),
          orderBy("createdAt", "desc"),
          limit(pageSize)
        );
      }

      const snapshot = await getDocs(q);
      const tests = snapshot.docs.map((doc) =>
        CompletedExercises.fromFirestore(doc)
      );
      const lastVisible = snapshot.docs[snapshot.docs.length - 1];
      const lastVisibleId = lastVisible ? lastVisible.id : null;

      res.status(200).send({
        data: tests,
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

  //Count completed exercise by pupilID
  countTestsByPupilID = async (req, res, next) => {
    try {
      const { pupilId } = req.params;
      const q = query(
        collection(db, "completed_exercises"),
        where("pupilId", "==", pupilId)
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

  //Filter paginated completed exercise by pupilID
  filterByPupilID = async (req, res) => {
    try {
      const pageSize = parseInt(req.query.pageSize) || 10;
      const startAfterId = req.query.startAfterId || null;
      const { pupilID } = req.params;

      let q;
      if (startAfterId) {
        const startDoc = await getDoc(
          doc(db, "completed_exercises", startAfterId)
        );
        q = query(
          collection(db, "completed_exercises"),
          where("pupilId", "==", pupilID),
          startAfter(startDoc),
          orderBy("createdAt", "desc"),
          limit(pageSize)
        );
      } else {
        q = query(
          collection(db, "completed_exercises"),
          where("pupilId", "==", pupilID),
          orderBy("createdAt", "desc"),
          limit(pageSize)
        );
      }

      const snapshot = await getDocs(q);
      const Completedexercise = snapshot.docs.map((doc) =>
        CompletedExercises.fromFirestore(doc)
      );
      const lastVisible = snapshot.docs[snapshot.docs.length - 1];
      const lastVisibleId = lastVisible ? lastVisible.id : null;

      res.status(200).send({
        data: Completedexercise,
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

  // Count completed exercise by lesson ID
  countCompletedExerciseByLessonID = async (req, res, next) => {
    try {
      const { lessonId } = req.params;
      const q = query(
        collection(db, "completed_exercises"),
        where("lessonId", "==", lessonId)
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

  //Filter completed exercise by lessonID
  filterByLessonID = async (req, res) => {
    try {
      const pageSize = parseInt(req.query.pageSize) || 10;
      const startAfterId = req.query.startAfterId || null;
      const { lessonID } = req.params;

      let q;
      if (startAfterId) {
        const startDoc = await getDoc(
          doc(db, "completed_exercises", startAfterId)
        );
        q = query(
          collection(db, "completed_exercises"),
          where("lessonId", "==", lessonID),
          startAfter(startDoc),
          orderBy("createdAt", "desc"),
          limit(pageSize)
        );
      } else {
        q = query(
          collection(db, "completed_exercises"),
          where("lessonId", "==", lessonID),
          orderBy("createdAt", "desc"),
          limit(pageSize)
        );
      }

      const snapshot = await getDocs(q);
      const Completedexercise = snapshot.docs.map((doc) =>
        CompletedExercises.fromFirestore(doc)
      );
      const lastVisible = snapshot.docs[snapshot.docs.length - 1];
      const lastVisibleId = lastVisible ? lastVisible.id : null;

      res.status(200).send({
        data: Completedexercise,
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

  // Count completed exercise by point
  countCompletedExerciseByPoint = async (req, res, next) => {
    try {
      const { condition, point } = req.query;
      const q = query(
        collection(db, "completed_exercises"),
        where("point", condition, parseInt(point))
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

  //Filter completed exercise by point
  filterByPoint = async (req, res) => {
    try {
      const pageSize = parseInt(req.query.pageSize) || 10;
      const startAfterId = req.query.startAfterId || null;
      const { condition, point } = req.query;
      let q;
      if (startAfterId) {
        const startDoc = await getDoc(
          doc(db, "completed_exercises", startAfterId)
        );
        q = query(
          collection(db, "completed_exercises"),
          where("point", condition, parseInt(point)),
          startAfter(startDoc),
          orderBy("createdAt", "desc"),
          limit(pageSize)
        );
      } else {
        q = query(
          collection(db, "completed_exercises"),
          where("point", condition, parseInt(point)),
          orderBy("createdAt", "desc"),
          limit(pageSize)
        );
      }

      const snapshot = await getDocs(q);
      const Completedexercise = snapshot.docs.map((doc) =>
        CompletedExercises.fromFirestore(doc)
      );
      const lastVisible = snapshot.docs[snapshot.docs.length - 1];
      const lastVisibleId = lastVisible ? lastVisible.id : null;

      res.status(200).send({
        data: Completedexercise,
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

  // Count completed exercise by pupilID & lessonID
  countCompletedExerciseByPupilIdAndLessonId = async (req, res, next) => {
    try {
      const { lessonID, pupilID } = req.params;
      const q = query(
        collection(db, "completed_exercises"),
        where("lessonID", "==", lessonID),
        where("pupilID", "==", pupilID)
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

  // Filter completed exercise by pupilID & lessonID
  filterByPupilAndLesson = async (req, res) => {
    try {
      const pageSize = parseInt(req.query.pageSize) || 10;
      const startAfterId = req.query.startAfterId || null;
      const { pupilID, lessonID } = req.params;

      let q;
      if (startAfterId) {
        const startDoc = await getDoc(
          doc(db, "completed_exercises", startAfterId)
        );
        q = query(
          collection(db, "completed_exercises"),
          where("pupilId", "==", pupilID),
          where("lessonId", "==", lessonID),
          startAfter(startDoc),
          orderBy("createdAt", "desc"),
          limit(pageSize)
        );
      } else {
        q = query(
          collection(db, "completed_exercises"),
          where("pupilId", "==", pupilID),
          where("lessonId", "==", lessonID),
          orderBy("createdAt", "desc"),
          limit(pageSize)
        );
      }

      const snapshot = await getDocs(q);
      const Completedexercise = snapshot.docs.map((doc) =>
        CompletedExercises.fromFirestore(doc)
      );
      const lastVisible = snapshot.docs[snapshot.docs.length - 1];
      const lastVisibleId = lastVisible ? lastVisible.id : null;

      res.status(200).send({
        data: Completedexercise,
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

  // Filter completed exercise by lessonID & point
  countCompletedExerciseByLessonIdAndPoint = async (req, res, next) => {
    try {
      const { lessonID } = req.params;
      const { condition, point } = req.query;

      const parsedPoint = parseInt(point);

      const q = query(
        collection(db, "completed_exercises"),
        where("lessonID", "==", lessonID),
        where("point", condition, parsedPoint)
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

  //Filter completed exercise by lessonID & point
  filterByLessonIDAndPoint = async (req, res) => {
    try {
      const pageSize = parseInt(req.query.pageSize) || 10;
      const startAfterId = req.query.startAfterId || null;
      const { lessonID } = req.params;
      const { condition, point } = req.query;
      let q;
      if (startAfterId) {
        const startDoc = await getDoc(
          doc(db, "completed_exercises", startAfterId)
        );
        q = query(
          collection(db, "completed_exercises"),
          where("lessonId", "==", lessonID),
          where("point", condition, parseInt(point)),
          startAfter(startDoc),
          orderBy("createdAt", "desc"),
          limit(pageSize)
        );
      } else {
        q = query(
          collection(db, "completed_exercises"),
          where("lessonId", "==", lessonID),
          where("point", condition, parseInt(point)),
          orderBy("createdAt", "desc"),
          limit(pageSize)
        );
      }

      const snapshot = await getDocs(q);
      const Completedexercise = snapshot.docs.map((doc) =>
        CompletedExercises.fromFirestore(doc)
      );
      const lastVisible = snapshot.docs[snapshot.docs.length - 1];
      const lastVisibleId = lastVisible ? lastVisible.id : null;

      res.status(200).send({
        data: Completedexercise,
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
}

module.exports = new CompletedExerciseController();
