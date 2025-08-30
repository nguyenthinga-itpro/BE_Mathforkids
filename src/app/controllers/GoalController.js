const Goal = require("../models/Goal");
const {
  getFirestore,
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  updateDoc,
  serverTimestamp,
  query,
  where,
  orderBy,
} = require("firebase/firestore");

const db = getFirestore();
// Hàm chuẩn hóa: chỉ giữ lại phần ngày
function toDateOnly(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}
class GoalController {
  parseDate = (value) => {
    if (!value) return null;
    const date = new Date(value);
    return isNaN(date.getTime()) ? null : date;
  };

  // Create goal
  create = async (req, res) => {
    try {
      const data = req.body;
      const newDocRef = await addDoc(collection(db, "goal"), {
        ...data,
        isCompleted: false,
        createdAt: serverTimestamp(),
      });
      res.status(201).send({
        message: {
          en: "Goal created successfully!",
          vi: "Tạo mục tiêu thành công!",
        },
        id: newDocRef.id,
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

  // Update goal
  update = async (req, res) => {
    try {
      const goalId = req.params.id;
      const { createdAt, ...data } = req.body;

      const docRef = doc(db, "goal", goalId);
      await updateDoc(docRef, {
        ...data,
        updatedAt: serverTimestamp(),
      });

      res.status(200).send({
        message: {
          en: "Goal updated successfully!",
          vi: "Cập nhật mục tiêu thành công!",
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

  // Get within 30 days by pupilId
  getWithin30DaysByPupilId = async (req, res) => {
    try {
      const { pupilId } = req.params;
      const now = new Date();
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      const q = query(
        collection(db, "goal"),
        where("pupilId", "==", pupilId),
        where("createdAt", ">=", thirtyDaysAgo),
        orderBy("createdAt", "desc")
      );

      const snapshot = await getDocs(q);
      const goals = snapshot.docs.map((doc) => Goal.fromFirestore(doc));

      res.status(200).send(goals);
    } catch (error) {
      console.error("getWithin30DaysByPupilId Error:", error);
      res.status(500).send({
        message: {
          en: error.message || "Internal error",
          vi: "Đã xảy ra lỗi nội bộ.",
        },
      });
    }
  };

  getById = async (req, res) => {
    const id = req.params.id;
    const goal = req.goal;
    res.status(200).send({ id: id, ...goal });
  };

  //cập nhật nhiệm vụ đã hoàn thành
  autoMarkCompletedGoals = async (req, res) => {
    try {
      const { pupilId, lessonId } = req.params;
      const { exercise } = req.query;

      // Tách danh sách exercise (level)
      const exerciseList = exercise
        ? exercise
            .split(",")
            .map((e) => e.trim())
            .filter(Boolean)
        : [];

      if (!pupilId || !lessonId) {
        return res.status(400).send({
          message: {
            en: "Missing pupilId or lessonId",
            vi: "Thiếu pupilId hoặc lessonId",
          },
        });
      }

      // 1. Goals chưa hoàn thành
      const goalSnap = await getDocs(
        query(
          collection(db, "goal"),
          where("pupilId", "==", pupilId),
          where("lessonId", "==", lessonId),
          where("isCompleted", "==", false)
        )
      );
      const allGoals = goalSnap.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      if (allGoals.length === 0) {
        return res.status(404).send({
          message: {
            en: "No uncompleted goal found",
            vi: "Không tìm thấy nhiệm vụ chưa hoàn thành",
          },
        });
      }

      // 2. completed_lessons
      const completedLessonsSnap = await getDocs(
        query(
          collection(db, "completed_lessons"),
          where("pupilId", "==", pupilId),
          where("lessonId", "==", lessonId)
        )
      );
      const completedLessons = completedLessonsSnap.docs.map((doc) =>
        doc.data()
      );

      // 3. completed_exercises
      const exerciseSnap = await getDocs(
        query(
          collection(db, "completed_exercises"),
          where("pupilId", "==", pupilId),
          where("lessonId", "==", lessonId)
        )
      );
      const completedExercises = exerciseSnap.docs
        .map((doc) => {
          const data = doc.data();
          let createdAt = null;

          if (typeof data.createdAt?.toDate === "function") {
            createdAt = data.createdAt.toDate();
          } else if (data.createdAt) {
            const parsed = new Date(data.createdAt);
            if (!isNaN(parsed)) createdAt = parsed;
          }

          return createdAt
            ? {
                ...data,
                createdAt,
                createdDay: createdAt.toISOString().split("T")[0],
              }
            : null;
        })
        .filter(Boolean);

      // 4. Lọc goals phù hợp
      const today = toDateOnly(new Date());

      const matchingGoals = allGoals.filter((goal) => {
        const start = toDateOnly(goal.dateStart);
        const end = toDateOnly(goal.dateEnd);
        const goalLevels = goal.exercise || [];

        // ✅ Bỏ qua goal đã hết hạn
        if (end < today) {
          console.log("Bỏ goal vì đã hết hạn:", goal.id);
          return false;
        }

        // Nếu có exercise trong query mà goal không chứa → bỏ
        const matchExerciseQuery =
          exerciseList.length === 0 ||
          exerciseList.some((e) => goalLevels.includes(e));

        if (!matchExerciseQuery) {
          console.log("Bỏ goal vì không khớp exercise query:", goal.id);
          return false;
        }

        // Kiểm tra completed_lessons
        const hasMatchingLesson = completedLessons.some((cl) => {
          const updated = toDateOnly(
            cl.updatedAt?.toDate?.() || new Date(cl.updatedAt)
          );
          return (
            cl.lessonId === lessonId &&
            cl.isCompleted &&
            updated >= start &&
            updated <= end
          );
        });

        // Kiểm tra completed_exercises
        const hasMatchingExercise = completedExercises.some((ex) => {
          const completedLevels = ex.levelId || [];
          const updated = toDateOnly(ex.createdAt);

          const exLevelMatch =
            goalLevels.length > 0 &&
            goalLevels.every((level) => completedLevels.includes(level));

          return (
            ex.lessonId === lessonId &&
            exLevelMatch &&
            updated >= start &&
            updated <= end
          );
        });

        return hasMatchingLesson || hasMatchingExercise;
      });

      if (matchingGoals.length === 0) {
        return res.status(200).send({
          message: {
            en: "No matching completed goal found.",
            vi: "Không tìm thấy mục tiêu phù hợp đã hoàn thành.",
          },
        });
      }

      // 5. Cập nhật goals
      const matchedData = [...completedLessons, ...completedExercises].find(
        (x) => x.lessonId === lessonId
      );

      for (const goal of matchingGoals) {
        await updateDoc(doc(db, "goal", goal.id), {
          isCompleted: true,
          completedAt: matchedData?.createdAt || new Date(),
          updatedAt: serverTimestamp(),
        });

        // Thưởng
        const { rewardId, rewardQuantity } = goal;
        if (rewardId && rewardQuantity) {
          const rewardRef = collection(db, "owned_rewards");
          const ownedRewardQuery = query(
            rewardRef,
            where("pupilId", "==", pupilId),
            where("rewardId", "==", rewardId)
          );
          const ownedRewardSnap = await getDocs(ownedRewardQuery);

          if (!ownedRewardSnap.empty) {
            const existingDoc = ownedRewardSnap.docs[0];
            const existingData = existingDoc.data();
            const newQuantity =
              (existingData.quantity || 0) + Number(rewardQuantity || 0);

            await updateDoc(doc(db, "owned_rewards", existingDoc.id), {
              quantity: newQuantity,
              updatedAt: serverTimestamp(),
            });
          } else {
            await addDoc(rewardRef, {
              pupilId,
              rewardId,
              quantity: Number(rewardQuantity || 0),
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp(),
            });
          }
        }
      }

      // Trả kết quả
      const lessonDoc = await getDoc(doc(db, "lessons", lessonId));
      const lessonName =
        lessonDoc.exists() && lessonDoc.data().name?.vi
          ? lessonDoc.data().name.vi
          : "nhiệm vụ";

      return res.status(200).send({
        message: {
          en: `Marked ${matchingGoals.length} goal(s) as completed.`,
          vi: `Đã đánh dấu ${matchingGoals.length} mục tiêu hoàn thành: "${lessonName}".`,
        },
      });
    } catch (error) {
      console.error("autoMarkCompletedGoals Error:", error);
      res.status(500).send({
        message: {
          en: error.message || "Internal error",
          vi: "Đã xảy ra lỗi nội bộ.",
        },
      });
    }
  };

  getAvailableLessons = async (req, res) => {
    try {
      const { pupilId, skillType, startDate, endDate } = req.params;

      if (!pupilId || !skillType || !startDate || !endDate) {
        // console.log("Thiếu tham số:", {
        //   pupilId,
        //   skillType,
        //   startDate,
        //   endDate,
        // });
        return res.status(400).send({
          message: {
            en: "Missing required parameters",
            vi: "Thiếu tham số bắt buộc",
          },
        });
      }

      const start = new Date(startDate);
      const end = new Date(endDate);
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
      // console.log("Khoảng thời gian:", { start, end });
      const snapshot = await getDocs(
        query(
          collection(db, "goal"),
          where("pupilId", "==", pupilId),
          where("skillType", "==", skillType),
          where("isCompleted", "==", false)
        )
      );

      // console.log(`Goals chưa hoàn thành: ${snapshot.size}`);

      const levelOptions = ["Easy", "Medium", "Hard"];
      const resultMap = {};

      snapshot.forEach((doc) => {
        const goal = doc.data();
        const gStart = new Date(goal.dateStart);
        const gEnd = new Date(goal.dateEnd);
        gStart.setHours(0, 0, 0, 0);
        gEnd.setHours(23, 59, 59, 999);

        const isOverlap = gStart <= end && gEnd >= start;
        if (!isOverlap) {
          // console.log(`Goal ${goalId} bị bỏ qua (ngoài khoảng ngày)`);
          return;
        }

        const lessonId = goal.lessonId;
        if (!lessonId) {
          // console.log(`Goal ${goalId} không có lessonId`);
          return;
        }

        if (!resultMap[lessonId]) {
          resultMap[lessonId] = new Set();
        }

        (goal.exercise || []).forEach((e) => resultMap[lessonId].add(e));

        // console.log(
        //   `Goal ${goalId} lessonId=${lessonId} | exercise=`,
        //   goal.exercise
        // );
      });

      const availableLessons = [];

      for (const lessonId in resultMap) {
        const disabledSet = resultMap[lessonId];
        const allLevelsCovered = levelOptions.every((lv) =>
          disabledSet.has(lv)
        );

        // console.log(
        //   ` Lesson ${lessonId} - disabled:`,
        //   Array.from(disabledSet)
        // );

        if (!allLevelsCovered) {
          availableLessons.push({
            lessonId,
            disabledExercises: Array.from(disabledSet),
          });
        } else {
          // console.log(` Lesson ${lessonId} bị ẩn vì đủ cả 3 mức độ`);
        }
      }

      // console.log("Kết quả trả về:", availableLessons);
      return res.status(200).send(availableLessons);
    } catch (error) {
      console.error("❌ getAvailableLessons Error:", error);
      return res.status(500).send({
        message: {
          en: error.message || "Internal error",
          vi: "Đã xảy ra lỗi nội bộ.",
        },
      });
    }
  };
}

module.exports = new GoalController();
