const Exercise = require("../models/Exercise");
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
const { uploadMultipleFiles } = require("./FileController");

const db = getFirestore();

class ExerciseController {
  // Create exercise
  create = async (req, res, next) => {
    try {
      const { levelId, lessonId, question, option, answer } = req.body;
      const parsedQuestion = JSON.parse(question);
      const parsedOption = JSON.parse(option);
      const parsedAnswer = JSON.parse(answer);

      const { image } = await uploadMultipleFiles(req.files);
      const exercisesRef = await addDoc(collection(db, "exercises"), {
        levelId,
        lessonId,
        question: parsedQuestion,
        option: parsedOption, // Array of text or image URLs
        answer: parsedAnswer,
        image,
        isDisabled: false,
        createdAt: serverTimestamp(),
      });

      res.status(201).send({
        message: {
          en: "Exercises created successfully!",
          vi: "Tạo mới bài tập thành công!",
        },
        data: exercisesRef.id,
      });
    } catch (error) {
      console.error("Error in create:", error.message);
      res.status(500).send({
        message: {
          en: error.message,
          vi: "Đã xảy ra lỗi nội bộ.",
        },
      });
    }
  };

  // Count all exercises by lesson ID
  countByLesson = async (req, res, next) => {
    try {
      const { lessonId } = req.params;
      const q = query(
        collection(db, "exercises"),
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
  countByLessonAndDisabledStatus = async (req, res, next) => {
    try {
      const { lessonId } = req.params;
      const { isDisabled } = req.query;
      const q = query(
        collection(db, "exercises"),
        where("lessonId", "==", lessonId),
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
  countByLessonAndLevelAndDisabledStatus = async (req, res, next) => {
    try {
      const { lessonId, levelId } = req.params;
      const { isDisabled } = req.query;
      const q = query(
        collection(db, "exercises"),
        where("lessonId", "==", lessonId),
        where("levelId", "==", levelId),
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
  // Count by lesson and levels
  countByLessonAndLevels = async (req, res, next) => {
    try {
      const { lessonId } = req.params;
      const { levelIds } = req.body;

      const count = [];

      for (const levelId of levelIds) {
        const q = query(
          collection(db, "exercises"),
          where("lessonId", "==", lessonId),
          where("levelId", "==", levelId),
          where("isDisabled", "==", false)
        );

        const snapshot = await getCountFromServer(q);
        count.push(snapshot.data().count);
      }

      res.status(200).send(count);
    } catch (error) {
      res.status(500).send({
        message: {
          en: error.message,
          vi: "Đã xảy ra lỗi nội bộ.",
        },
      });
    }
  };
  // Get all paginated exercises by lesson ID
  getByLesson = async (req, res, next) => {
    try {
      const pageSize = parseInt(req.query.pageSize) || 10;
      const startAfterId = req.query.startAfterId || null;
      const { lessonId } = req.params;
      let q;
      if (startAfterId) {
        const startDoc = await getDoc(doc(db, "exercises", startAfterId));
        q = query(
          collection(db, "exercises"),
          where("lessonId", "==", lessonId),
          orderBy("createdAt", "desc"),
          startAfter(startDoc),
          limit(pageSize)
        );
      } else {
        q = query(
          collection(db, "exercises"),
          where("lessonId", "==", lessonId),
          orderBy("createdAt", "desc"),
          limit(pageSize)
        );
      }
      const snapshot = await getDocs(q);
      const exercises = snapshot.docs.map((doc) => Exercise.fromFirestore(doc));

      const lastVisible = snapshot.docs[snapshot.docs.length - 1];
      const lastVisibleId = lastVisible ? lastVisible.id : null;

      res.status(200).send({
        data: exercises,
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

  // Filter exercises by isDisabled
  filterByIsDisabled = async (req, res, next) => {
    try {
      const pageSize = parseInt(req.query.pageSize) || 10;
      const startAfterId = req.query.startAfterId || null;
      const { lessonId } = req.params;
      const { isDisabled } = req.query;

      let q;
      if (startAfterId) {
        const startDoc = await getDoc(doc(db, "exercises", startAfterId));
        q = query(
          collection(db, "exercises"),
          where("lessonId", "==", lessonId),
          where("isDisabled", "==", isDisabled === "true"),
          orderBy("createdAt", "desc"),
          startAfter(startDoc),
          limit(pageSize)
        );
      } else {
        q = query(
          collection(db, "exercises"),
          where("lessonId", "==", lessonId),
          where("isDisabled", "==", isDisabled === "true"),
          orderBy("createdAt", "desc"),
          limit(pageSize)
        );
      }
      const snapshot = await getDocs(q);
      const exercises = snapshot.docs.map((doc) => Exercise.fromFirestore(doc));
      const lastVisible = snapshot.docs[snapshot.docs.length - 1];
      const lastVisibleId = lastVisible ? lastVisible.id : null;

      res.status(200).send({
        data: exercises,
        nextPageToken: lastVisibleId, // Dùng làm startAfterId cho trang kế
      });
    } catch (error) {
      console.error("Error in filterByIsDisabled:", error.message);
      res.status(500).send({
        message: {
          en: error.message,
          vi: "Đã xảy ra lỗi nội bộ.",
        },
      });
    }
  };

  // Filter exercises by isDisabled and level
  filterByLevelAndIsDisabled = async (req, res, next) => {
    try {
      const pageSize = parseInt(req.query.pageSize) || 10;
      const startAfterId = req.query.startAfterId || null;
      const { lessonId, levelId } = req.params;
      const { isDisabled } = req.query;

      let q;
      if (startAfterId) {
        const startDoc = await getDoc(doc(db, "exercises", startAfterId));
        q = query(
          collection(db, "exercises"),
          where("lessonId", "==", lessonId),
          where("levelId", "==", levelId),
          where("isDisabled", "==", isDisabled === "true"),
          orderBy("createdAt", "desc"),
          startAfter(startDoc),
          limit(pageSize)
        );
      } else {
        q = query(
          collection(db, "exercises"),
          where("lessonId", "==", lessonId),
          where("levelId", "==", levelId),
          where("isDisabled", "==", isDisabled === "true"),
          orderBy("createdAt", "desc"),
          limit(pageSize)
        );
      }
      const snapshot = await getDocs(q);
      const exercises = snapshot.docs.map((doc) => Exercise.fromFirestore(doc));
      const lastVisible = snapshot.docs[snapshot.docs.length - 1];
      const lastVisibleId = lastVisible ? lastVisible.id : null;

      res.status(200).send({
        data: exercises,
        nextPageToken: lastVisibleId, // Dùng làm startAfterId cho trang kế
      });
    } catch (error) {
      console.error("Error in filterByIsDisabled:", error.message);
      res.status(500).send({
        message: {
          en: error.message,
          vi: "Đã xảy ra lỗi nội bộ.",
        },
      });
    }
  };

  // Count all exercises by lesson ID & level ID
  countByLessonAndLevel = async (req, res, next) => {
    try {
      const { lessonId, levelId } = req.params;
      const q = query(
        collection(db, "exercises"),
        where("lessonId", "==", lessonId),
        where("levelId", "==", levelId)
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

  // Filter all paginated exercises by lesson ID & level ID
  filterByLessonAndLevel = async (req, res, next) => {
    try {
      const pageSize = parseInt(req.params.pageSize) || 10;
      const startAfterId = req.query.startAfterId || null;
      const { lessonId, levelId } = req.params;
      let q;
      if (startAfterId) {
        const startDoc = await getDoc(doc(db, "exercises", startAfterId));
        q = query(
          collection(db, "exercises"),
          where("lessonId", "==", lessonId),
          where("levelId", "==", levelId),
          orderBy("createdAt", "desc"),
          startAfter(startDoc),
          limit(pageSize)
        );
      } else {
        q = query(
          collection(db, "exercises"),
          where("lessonId", "==", lessonId),
          where("levelId", "==", levelId),
          orderBy("createdAt", "desc"),
          limit(pageSize)
        );
      }
      const snapshot = await getDocs(q);
      const exercises = snapshot.docs.map((doc) => Exercise.fromFirestore(doc));
      const lastVisible = snapshot.docs[snapshot.docs.length - 1];
      const lastVisibleId = lastVisible ? lastVisible.id : null;

      res.status(200).send({
        data: exercises,
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

  // Get enable exercises by lessonId
  getEnabledByLesson = async (req, res, next) => {
    try {
      const lessonId = req.params.lessonId;
      const q = query(
        collection(db, "exercises"),
        where("lessonId", "==", lessonId),
        where("isDisabled", "==", false)
      );
      const exercises = await getDocs(q);
      const exerciseArray = exercises.docs.map((doc) =>
        Exercise.fromFirestore(doc)
      );
      res.status(200).send(exerciseArray);
    } catch (error) {
      res.status(500).send({
        message: {
          en: error.message,
          vi: "Đã xảy ra lỗi nội bộ.",
        },
      });
    }
  };

  // Get an exercise by type and grade
  getByGradeAndType = async (req, res, next) => {
    try {
      const { grade, type } = req.query;

      const q = query(
        collection(db, "exercises"),
        where("grade", "==", Number(grade)),
        where("type", "==", type),
        where("isDisabled", "==", false)
      );

      const snapshot = await getDocs(q);
      const exerciseArray = snapshot.docs.map((doc) =>
        Exercise.fromFirestore(doc)
      );

      res.status(200).send(exerciseArray);
    } catch (error) {
      res.status(500).send({
        message: {
          en: error.message,
          vi: "Đã xảy ra lỗi nội bộ.",
        },
      });
    }
  };

  // Get an exercise by ID
  getById = async (req, res, next) => {
    const id = req.params.id;
    const exercise = req.exercise;
    res.status(200).send({ id: id, ...exercise });
  };
  update = async (req, res, next) => {
    try {
      const id = req.params.id;
      const exerciseRef = doc(db, "exercises", id);
      const oldData = req.exercise;
      const { levelId, lessonId, question, option, answer, isDisabled } =
        req.body;
      const updateData = {
        updatedAt: serverTimestamp(),
      };

      // Handle isDisabled-only update
      if (
        typeof isDisabled !== "undefined" &&
        !levelId &&
        !lessonId &&
        !question &&
        !option &&
        !answer &&
        (!req.files || Object.keys(req.files).length === 0)
      ) {
        updateData.isDisabled = isDisabled === "true" || isDisabled === true;
      } else {
        const parsedQuestion = question
          ? JSON.parse(question)
          : oldData.question;
        const parsedOption = option ? JSON.parse(option) : oldData.option;
        const parsedAnswer = answer ? JSON.parse(answer) : oldData.answer;

        const { image } = await uploadMultipleFiles(req.files || {});
        const finalImage = image != null ? image : oldData.image;

        // Build update data
        updateData.levelId = levelId || oldData.levelId;
        updateData.lessonId = lessonId || oldData.lessonId;
        updateData.question = parsedQuestion;
        updateData.option = parsedOption;
        updateData.answer = parsedAnswer;
        updateData.image = finalImage;

        if (typeof isDisabled !== "undefined") {
          updateData.isDisabled = isDisabled === "true" || isDisabled === true;
        }
      }

      await updateDoc(exerciseRef, updateData);
      res.status(200).send({
        message: {
          en: "Exercise updated successfully!",
          vi: "Cập nhật bài tập thành công!",
        },
      });
    } catch (error) {
      console.error("Error in update:", error.message);
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
      const exercises = await getDocs(collection(db, "exercises"));
      const exerciseArray = exercises.docs.map((doc) =>
        Exercise.fromFirestore(doc)
      );
      res.status(200).send(exerciseArray);
    } catch (error) {
      res.status(500).send({ message: error.message });
    }
  };

  // Random exercises
  randomExercises = async (req, res, next) => {
    try {
      const lessonId = req.params.lessonId;
      const levelIds = req.body.levelIds;
      console.log("lessonId:", lessonId);
      console.log("levelIds:", levelIds);
      // Lấy tất cả bài tập theo lessonId
      const q = query(
        collection(db, "exercises"),
        where("lessonId", "==", lessonId),
        where("isDisabled", "==", false)
      );
      const snapshot = await getDocs(q);
      const allExercises = snapshot.docs.map((doc) =>
        Exercise.fromFirestore(doc)
      );
      // Random exercise for each level
      const randomResults = [];
      for (let i = 0; i < levelIds.length; i++) {
        const levelId = levelIds[i];
        const exercisesByLevel = allExercises.filter(
          (e) => e.levelId === levelId
        );
        // Xáo trộn và chọn 10 bài nếu cấp độ được chọn có 1,
        // 5 bài nếu cấp độ được chọn gồm 2 cái trở lên
        const shuffled = exercisesByLevel.sort(() => 0.5 - Math.random());
        const selected = shuffled.slice(
          0,
          levelIds.length === 1
            ? 10
            : levelIds.length === 2
            ? (levelIds.length - i) * 4
            : (levelIds.length - i) * 2
        );
        randomResults.push(...selected);
      }
      res.status(200).send(randomResults);
    } catch (error) {
      res.status(500).send({
        message: {
          en: error.message,
          vi: "Đã xảy ra lỗi nội bộ.",
        },
      });
    }
  };

  // Random tests
  randomTests = async (req, res, next) => {
    try {
      const lessonId = req.params.lessonId;

      // 1. Lấy tất cả levelId
      const levelSnapshot = await getDocs(
        query(
          collection(db, "levels"),
          where("isDisabled", "==", false),
          orderBy("level")
        )
      );
      const levelIds = levelSnapshot.docs.map((doc) => doc.id);

      // 2. Lấy toàn bộ exercises theo lessonId
      const exerciseSnapshot = await getDocs(
        query(
          collection(db, "exercises"),
          where("lessonId", "==", lessonId),
          where("isDisabled", "==", false)
        )
      );
      const allExercises = exerciseSnapshot.docs.map((doc) =>
        Exercise.fromFirestore(doc)
      );

      // 3. Random 6 bài từ mỗi level
      const randomResults = [];

      for (let i = 0; i < levelIds.length; i++) {
        const levelId = levelIds[i];
        const exercisesByLevel = allExercises.filter(
          (e) => e.levelId === levelId
        );
        const shuffled = exercisesByLevel.sort(() => 0.5 - Math.random());
        const selected = shuffled.slice(0, (levelIds.length - i) * 2);
        randomResults.push(...selected);
      }

      // 4. Xáo trộn toàn bộ kết quả
      const finalShuffled = randomResults.sort(() => 0.5 - Math.random());

      res.status(200).send(finalShuffled);
    } catch (error) {
      res.status(500).send({
        message: {
          en: error.message,
          vi: "Đã xảy ra lỗi nội bộ.",
        },
      });
    }
  };

  // Random assessments
  randomAssessments = async (req, res, next) => {
    try {
      const grade = req.params.grade;

      // 1. Lặp 4 loại type, mỗi loại lấy tối đa 2 lesson theo thứ tự
      const lessonTypes = [
        "addition",
        "subtraction",
        "multiplication",
        "division",
      ];
      const lessonsByType = {};

      for (const type of lessonTypes) {
        const snapshot = await getDocs(
          query(
            collection(db, "lessons"),
            where("grade", "==", parseInt(grade)),
            where("type", "==", type),
            where("isDisabled", "==", false),
            orderBy("order"),
            limit(2)
          )
        );
        lessonsByType[type] = snapshot.docs.map((doc) => doc.id);
      }

      // 2. Lấy tất cả level có isDisabled = false
      const levelSnapshot = await getDocs(
        query(
          collection(db, "levels"),
          where("isDisabled", "==", false),
          orderBy("level")
        )
      );
      const levelIds = levelSnapshot.docs.map((doc) => doc.id);

      // 3. Tạo danh sách các bài tập random 1 bài cho mỗi cặp (lessonId, levelId)
      const randomExercises = [];

      for (const type of lessonTypes) {
        const lessonIds = lessonsByType[type];
        for (const lessonId of lessonIds) {
          for (const levelId of levelIds) {
            const exerciseSnapshot = await getDocs(
              query(
                collection(db, "exercises"),
                where("lessonId", "==", lessonId),
                where("levelId", "==", levelId),
                where("isDisabled", "==", false)
              )
            );
            const exercises = exerciseSnapshot.docs.map((doc) =>
              Exercise.fromFirestore(doc)
            );
            if (exercises.length > 0) {
              // Xáo trộn và chọn 1 bài
              const shuffled = exercises.sort(() => 0.5 - Math.random());
              randomExercises.push(shuffled[0]);
            }
          }
        }
      }

      // 4. Xáo trộn toàn bộ danh sách cuối
      const finalShuffled = randomExercises.sort(() => 0.5 - Math.random());

      // 5. Trả về lessonsByType cùng với randomExercises
      res.status(200).send({
        lessonsByType, // Danh sách lessonId theo từng phép tính
        exercises: finalShuffled,
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

  averageExercisePerLesson = async (req, res, next) => {
    try {
      // 1. Get all lessons where isDisabled == false
      const lessonsSnapshot = await getDocs(
        query(collection(db, "lessons"), where("isDisabled", "==", false))
      );
      const lessons = lessonsSnapshot.docs;

      // 2. For each lesson, count exercises where isDisabled == false
      let totalExerciseCount = 0;
      for (const lessonDoc of lessons) {
        const lessonId = lessonDoc.id;
        const q = query(
          collection(db, "exercises"),
          where("lessonId", "==", lessonId),
          where("isDisabled", "==", false)
        );
        const countSnap = await getCountFromServer(q);
        totalExerciseCount += countSnap.data().count;
      }

      // 3. Calculate average
      const average = parseFloat(
        (totalExerciseCount / lessons.length).toFixed(2)
      );

      res.status(200).send(average);
    } catch (error) {
      res.status(500).send({
        message: {
          en: error.message,
          vi: "Đã xảy ra lỗi nội bộ.",
        },
      });
    }
  };

  countLevelIdsInLesson = async (req, res, next) => {
    try {
      const lessonId = req.params.lessonId;
      const { levelIds } = req.body;

      //step 1
      const countPromises = levelIds.map(async (levelId) => {
        const q = query(
          collection(db, "exercises"),
          where("lessonId", "==", lessonId),
          where("levelId", "==", levelId),
          where("isDisabled", "==", false)
        );
        const snapshot = await getCountFromServer(q);
        return { levelId, count: snapshot.data().count };
      });
      const results = await Promise.all(countPromises);
      const levelIdCounts = results.reduce((acc, { levelId, count }) => {
        acc[levelId] = count;
        return acc;
      }, {});
      res.status(200).send({
        data: {
          lessonId,
          levelIdCounts,
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

module.exports = new ExerciseController();
