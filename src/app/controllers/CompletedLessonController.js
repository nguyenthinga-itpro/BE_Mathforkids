const CompletedLesson = require("../models/CompletedLesson");
const {
  getFirestore,
  collection,
  doc,
  getDoc,
  addDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  documentId,
  getCountFromServer,
} = require("firebase/firestore");
const db = getFirestore();

class CompletedLessonController {
  // Create completed lesson
  create = async (req, res, next) => {
    try {
      const data = req.body;
      await addDoc(collection(db, "completed_lessons"), {
        ...data,
        isCompleted: false,
        isBlock: data.isBlock ?? false,
        createAt: serverTimestamp(),
      });
      res.status(201).send({
        message: {
          en: "Completed lesson created successfully!",
          vi: "Tạo thông tin lưu trạng thái bài học thành công!",
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
      const pageSize = parseInt(req.query.pageSize) || 10;
      const startAfterId = req.query.startAfterId || null;
      const { grade, type, pupilId } = req.query;

      if (!pupilId || !grade || !type) {
        return res.status(400).send({
          message: {
            en: "pupilId, grade, and type are required!",
            vi: "Yêu cầu cung cấp pupilId, grade và type!",
          },
        });
      }

      // Step 1: Get all completed lessons by pupilId
      const completedQuery = query(
        collection(db, "completed_lessons"),
        where("pupilId", "==", pupilId)
      );
      const completedSnapshot = await getDocs(completedQuery);
      console.log("✅ Completed lessons found:", completedSnapshot.size);

      const completedLessons = completedSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      if (completedLessons.length === 0) {
        return res.status(200).send({
          data: [],
          nextPageToken: null,
        });
      }

      // Step 2: Get lessonIds from completed lessons
      const completedLessonIds = completedLessons.map((cl) => cl.lessonId);

      // Step 3: Fetch lesson documents by ID using getDoc (Firestore does not support where(documentId(), "in", [...]) > 10)
      const lessonSnapshots = await Promise.all(
        completedLessonIds.map((id) => getDoc(doc(db, "lessons", id)))
      );

      const lessons = lessonSnapshots
        .filter((snap) => snap.exists())
        .map((snap) => ({
          id: snap.id,
          ...snap.data(),
        }))
        .filter(
          (lesson) =>
            lesson.grade === parseInt(grade) &&
            lesson.type === type &&
            lesson.isDisabled === false
        );

      // Step 4: Optional - sort by 'order'
      lessons.sort((a, b) => a.order - b.order);

      // Step 5: Apply pagination manually
      let pagedLessons = lessons;
      if (startAfterId) {
        const startIndex = lessons.findIndex((l) => l.id === startAfterId);
        if (startIndex >= 0) {
          pagedLessons = lessons.slice(
            startIndex + 1,
            startIndex + 1 + pageSize
          );
        } else {
          pagedLessons = lessons.slice(0, pageSize);
        }
      } else {
        pagedLessons = lessons.slice(0, pageSize);
      }

      const nextPageToken =
        pagedLessons.length === pageSize
          ? pagedLessons[pagedLessons.length - 1].id
          : null;

      // Step 6: Merge with completionStatus
      const completedMap = {};
      completedLessons.forEach((cl) => (completedMap[cl.lessonId] = cl));

      const result = pagedLessons.map((lesson) => {
        const completed = completedMap[lesson.id];
        return {
          ...lesson,
          completedLessonId: completed ? completed.id : null, // Add completed_lesson ID
          isBlock: completed ? completed.isBlock : true,
          isCompleted: completed ? completed.isCompleted : false,
        };
      });

      return res.status(200).send({
        data: result,
        nextPageToken,
      });
    } catch (error) {
      console.error("Error in getAll:", error);
      return res.status(500).send({
        message: {
          en: error.message,
          vi: "Đã xảy ra lỗi nội bộ.",
        },
      });
    }
  };

  // Get completed lesson by pupil ID & lesson
  getByPupilLesson = async (req, res, next) => {
    try {
      const { pupilId, lessonId } = req.params;
      console.log("Querying for lessonId:", pupilId, "and lessonId", lessonId); // Debug log
      const q = query(
        collection(db, "completed_lessons"),
        where("pupilId", "==", pupilId),
        where("lessonId", "==", lessonId)
      );
      const completedlessonSnapshot = await getDocs(q);
      const completedlessonArray = completedlessonSnapshot.docs.map((doc) =>
        CompletedLesson.fromFirestore(doc)
      );
      res.status(200).send(completedlessonArray);
    } catch (error) {
      res.status(500).send({
        message: {
          en: error.message,
          vi: "Đã xảy ra lỗi nội bộ.",
        },
      });
    }
  };

  // Get completed lessons by pupil ID
  getByPupil = async (req, res, next) => {
    try {
      const pupilId = req.params.pupilId;
      console.log("Querying for pupilId:", pupilId); // Debug log
      const q = query(
        collection(db, "completed_lessons"),
        where("pupilId", "==", pupilId)
      );
      const completedlessonSnapshot = await getDocs(q);
      const completedlessonArray = completedlessonSnapshot.docs.map((doc) =>
        CompletedLesson.fromFirestore(doc)
      );
      res.status(200).send(completedlessonArray);
    } catch (error) {
      res.status(500).send({
        message: {
          en: error.message,
          vi: "Đã xảy ra lỗi nội bộ.",
        },
      });
    }
  };
  countCompletedPupil = async (req, res, next) => {
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
          totalCount: 0,
          completedCount: 0
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
      let totalCount = 0;
      let completedCount = 0;
      for (const chunk of lessonIdChunks) {
        const totalQuery = query(
          collection(db, "completed_lessons"),
          where("pupilId", "==", pupilId),
          where("lessonId", "in", chunk)
        );
        const TotalSnapshot = await getCountFromServer(totalQuery);
        totalCount += TotalSnapshot.data().count;
        const completed = query(
          collection(db, "completed_lessons"),
          where("pupilId", "==", pupilId),
          where("lessonId", "in", chunk),
          where("isBlock", "==", false),
          where("isCompleted", "==", true),
        )
        const CompletedSnapshot = await getCountFromServer(completed);
        completedCount += CompletedSnapshot.data().count;
      }
      res.status(200).send({
        totalCount,
        completedCount,
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
  // Update completed lesson status
  updateStatus = async (req, res, next) => {
    try {
      const id = req.params.id;
      const data = req.body;
      const completed_lessons = doc(db, "completed_lessons", id);
      await updateDoc(completed_lessons, { ...data, updatedAt: serverTimestamp() });
      res.status(200).send({
        message: {
          en: "Completed lesson updated successfully!",
          vi: "Cập nhật trạng thái bài học thành công!",
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

  // Update completed lesson status
  updateStatusIsBlock = async (req, res, next) => {
    try {
      const { pupilId, lessonId } = req.params;

      // Step 1: Tìm bản ghi completed lesson dựa trên pupilId và lessonId
      const completedQuery = query(
        collection(db, "completed_lessons"),
        where("pupilId", "==", pupilId),
        where("lessonId", "==", lessonId)
      );
      const completedSnapshot = await getDocs(completedQuery);

      if (completedSnapshot.empty) {
        return res.status(404).send({
          message: {
            en: "Completed lesson record not found!",
            vi: "Không tìm thấy bản ghi hoàn thành bài học!",
          },
        });
      }

      // Step 2: Cập nhật isCompleted và isBlock cho bản ghi
      const completedLessonDoc = completedSnapshot.docs[0];
      await updateDoc(completedLessonDoc.ref, {
        isCompleted: true,
        isBlock: false,
        updatedAt: serverTimestamp(),
      });

      res.status(200).send({
        message: {
          en: "Completed lesson updated successfully!",
          vi: "Cập nhật trạng thái bài học thành công!",
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
  // Complete lesson and unlock next lesson
  completeAndUnlockNext = async (req, res, next) => {
    try {
      const { pupilId, lessonId } = req.params;

      // Step 1: Get the current lesson to retrieve its order, grade, and type
      const currentLessonDoc = await getDoc(doc(db, "lessons", lessonId));
      if (!currentLessonDoc.exists()) {
        return res.status(404).send({
          message: {
            en: "Lesson not found!",
            vi: "Không tìm thấy bài học!",
          },
        });
      }
      const currentLesson = currentLessonDoc.data();
      const { grade, type, order } = currentLesson;

      // Step 2: Update the current completed lesson to isCompleted: true, isBlock: false
      const completedQuery = query(
        collection(db, "completed_lessons"),
        where("pupilId", "==", pupilId),
        where("lessonId", "==", lessonId)
      );
      const completedSnapshot = await getDocs(completedQuery);
      if (completedSnapshot.empty) {
        return res.status(404).send({
          message: {
            en: "Completed lesson record not found!",
            vi: "Không tìm thấy bản ghi hoàn thành bài học!",
          },
        });
      }

      const completedLessonDoc = completedSnapshot.docs[0];
      await updateDoc(completedLessonDoc.ref, {
        isCompleted: true,
        isBlock: false,
        updatedAt: serverTimestamp(),
      });

      // Step 3: Find the next lesson based on order, grade, and type
      const nextLessonQuery = query(
        collection(db, "lessons"),
        where("grade", "==", grade),
        where("type", "==", type),
        where("isDisabled", "==", false),
        orderBy("order"),
        startAfter(currentLessonDoc),
        limit(1)
      );
      const nextLessonSnapshot = await getDocs(nextLessonQuery);
      let responseMessage = {
        en: "Lesson completed successfully!",
        vi: "Hoàn thành bài học thành công!",
      };
      let nextLessonName = null;
      // Step 4: If a next lesson exists, update its completed lesson record to isBlock: false
      if (!nextLessonSnapshot.empty) {
        const nextLesson = nextLessonSnapshot.docs[0];
        nextLessonName = nextLesson.data().name;
        const nextCompletedQuery = query(
          collection(db, "completed_lessons"),
          where("pupilId", "==", pupilId),
          where("lessonId", "==", nextLesson.id)
        );
        const nextCompletedSnapshot = await getDocs(nextCompletedQuery);
        if (!nextCompletedSnapshot.empty) {
          const nextCompletedDoc = nextCompletedSnapshot.docs[0];
          await updateDoc(nextCompletedDoc.ref, {
            isBlock: false,
            updatedAt: serverTimestamp(),
          });
        }
        responseMessage = {
          en: `Lesson completed and next lesson "${nextLessonName}" unlocked successfully!`,
          vi: `Hoàn thành bài học và mở khóa bài học tiếp theo "${nextLessonName}" thành công!`,
        };
      } else {
        if (grade < 3) {
          const nextGrade = grade + 1;
          let firstLessonNextGradeQuery;

          if (grade === 1) {
            // Từ lớp 1 lên lớp 2
            if (type === "addition") {
              // Mở bài đầu tiên của phép cộng và một bài phép nhân lớp 2
              firstLessonNextGradeQuery = query(
                collection(db, "lessons"),
                where("grade", "==", nextGrade),
                where("type", "in", ["addition", "multiplication"]),
                where("isDisabled", "==", false),
                orderBy("order"),
                limit(2)
              );
            } else if (type === "subtraction") {
              // Mở bài đầu tiên của phép trừ và một bài phép chia lớp 2
              firstLessonNextGradeQuery = query(
                collection(db, "lessons"),
                where("grade", "==", nextGrade),
                where("type", "in", ["subtraction", "division"]),
                where("isDisabled", "==", false),
                orderBy("order"),
                limit(2)
              );
            }
          } else if (grade === 2) {
            // Từ lớp 2 lên lớp 3: Chỉ mở bài đầu tiên của cùng loại phép toán
            firstLessonNextGradeQuery = query(
              collection(db, "lessons"),
              where("grade", "==", nextGrade),
              where("type", "==", type),
              where("isDisabled", "==", false),
              orderBy("order"),
              limit(1)
            );
          }
          const firstLessonNextGradeSnapshot = await getDocs(firstLessonNextGradeQuery);
          if (!firstLessonNextGradeSnapshot.empty) {
            const unlockedLessons = [];
            for (const lessonDoc of firstLessonNextGradeSnapshot.docs) {
              const lesson = lessonDoc.data();
              const lessonId = lessonDoc.id;
              unlockedLessons.push(lesson.name);

              const nextCompletedQuery = query(
                collection(db, "completed_lessons"),
                where("pupilId", "==", pupilId),
                where("lessonId", "==", lessonId)
              );
              const nextCompletedSnapshot = await getDocs(nextCompletedQuery);
              if (!nextCompletedSnapshot.empty) {
                const nextCompletedDoc = nextCompletedSnapshot.docs[0];
                await updateDoc(nextCompletedDoc.ref, {
                  isBlock: false,
                  updatedAt: serverTimestamp(),
                });
              }
            }
            nextLessonName = unlockedLessons.join(" and ");
            responseMessage = {
              en: `All lessons in grade ${grade} completed! Lesson(s) "${nextLessonName}" in grade ${nextGrade} unlocked successfully!`,
              vi: `Đã hoàn thành tất cả bài học của lớp CS${grade}! Bài học "${nextLessonName}" của lớp ${nextGrade} đã được mở khóa!`,
            };
          } else {
            responseMessage = {
              en: `All lessons in grade ${grade} completed! No lessons available in grade ${nextGrade} for multiplication or division.`,
              vi: `Đã hoàn thành tất cả bài học của lớp ${grade}! Không có bài học nào ở lớp ${nextGrade} cho phép nhân hoặc chia.`,
            };
          }

        } else {
          responseMessage = {
            en: `Congratulations! All lessons in grade ${grade} completed. You have finished all available grades!`,
            vi: `Chúc mừng! Đã hoàn thành tất cả bài học của lớp ${grade}. Bạn đã hoàn thành tất cả các lớp học!`,
          };
        }
      }
      res.status(200).send({
        message: responseMessage,
        nextLessonName: nextLessonName, // Include next lesson name in response
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

  unlockPreviousGradeLesson = async (req, res, next) => {
    try {
      const { pupilId } = req.params;

      // Query the pupils collection to get the pupil's grade
      const pupilQuery = query(
        collection(db, "pupils"),
        where(documentId(), "==", pupilId)
      );
      const pupilSnapshot = await getDocs(pupilQuery);

      if (pupilSnapshot.empty) {
        return res.status(404).send({
          message: {
            en: `Pupil with ID ${pupilId} not found!`,
            vi: `Không tìm thấy học sinh với ID ${pupilId}!`,
          },
        });
      }

      const pupilData = pupilSnapshot.docs[0].data();
      const grade = pupilData.grade;

      if (!grade || isNaN(parseInt(grade))) {
        return res.status(400).send({
          message: {
            en: "Pupil's grade is invalid or not set!",
            vi: "Lớp của học sinh không hợp lệ hoặc chưa được thiết lập!",
          },
        });
      }

      const currentGrade = parseInt(grade);

      // Nếu grade là lớp 1, trả về phản hồi thành công mà không làm gì thêm
      if (currentGrade === 1) {
        return res.status(200).send({
          message: {
            en: `No previous grade exists for grade ${grade}, no lessons to unlock.`,
            vi: `Không có lớp trước đó cho lớp ${grade}, không có bài học để mở khóa.`,
          },
        });
      }
      const gradesToUnLock = [];
      for (let i = 1; i < currentGrade; i++) {
        gradesToUnLock.push(i);
      }
      const updatePromises = [];
      for (const targetGrade of gradesToUnLock) {
        const lessonQuery = query(
          collection(db, "lessons"),
          where("grade", "==", targetGrade)
        );
        const lessonSnapshots = await getDocs(lessonQuery);
        if (lessonSnapshots.empty) {
          continue;
        }
        const lessonIds = lessonSnapshots.docs.map((doc) => doc.id);
        lessonIds.forEach((lessonId) => {
          const completedQuery = query(
            collection(db, "completed_lessons"),
            where("pupilId", "==", pupilId),
            where("lessonId", "==", lessonId)
          );
          updatePromises.push(
            getDocs(completedQuery).then((completedSnapshot) => {
              if (!completedSnapshot.empty) {
                const completedLessonDoc = completedSnapshot.docs[0];
                return updateDoc(completedLessonDoc.ref, {
                  isCompleted: true,
                  isBlock: false,
                  update: serverTimestamp(),
                })
              }
            })
          )
        })
      }
      await Promise.all(updatePromises.filter(Boolean));
      if (updatePromises.length === 0) {
        return res.status(200).send({
          message: {
            en: `No lessons found or no completed lessons to unlock for grades 1 to ${currentGrade - 1}.`,
            vi: `Không tìm thấy bài học hoặc không có bài học đã hoàn thành để mở khóa cho các lớp từ 1 đến ${currentGrade - 1}.`,
          },
        });
      }
      res.status(200).send({
        message: {
          en: `Successfully unlocked all lessons for grades 1 to ${currentGrade - 1}!`,
          vi: `Đã mở khóa thành công tất cả bài học của các lớp từ 1 đến ${currentGrade - 1}!`,
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
module.exports = new CompletedLessonController();
