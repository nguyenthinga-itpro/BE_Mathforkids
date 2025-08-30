const Tests = require("../models/Test");
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
  orderBy,
  limit,
  startAfter,
  Timestamp,
} = require("firebase/firestore");
const db = getFirestore();
const chunkArray = (arr, size) =>
  arr.reduce((acc, _, i) => {
    if (i % size === 0) acc.push(arr.slice(i, i + size));
    return acc;
  }, []);
class TestController {
  // Create test
  create = async (req, res, next) => {
    try {
      const data = req.body;
      const docRef = await addDoc(collection(db, "tests"), {
        ...data,
        createdAt: serverTimestamp(),
      });

      res.status(201).send({
        message: {
          id: docRef.id, // <-- đúng nè, ID thực tế của document mới tạo
          en: "Test created successfully",
          vi: "Tạo bài kiểm tra thành công!",
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

  // Get test by ID
  getById = async (req, res, next) => {
    const id = req.params.id;
    const test = req.test;
    res.status(200).send({ id: id, ...test });
  };

  // Count all test
  countAll = async (req, res, next) => {
    try {
      const q = query(collection(db, "tests"));
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
  countCompletedTestPupil = async (req, res, next) => {
    try {
      const pupilId = req.params.pupilId;
      const grade = req.query.grade;
      console.log("Querying for pupilId:", pupilId); // Debug log
      const lessonQuery = query(
        collection(db, "lessons"),
        where("grade", "==", parseInt(grade))
      );
      const lessonSnapshot = await getDocs(lessonQuery);
      const lessonIds = lessonSnapshot.docs.map((doc) => doc.id);
      if (lessonIds.length === 0) {
        return res.status(200).send({
          totalLessons: 0,
          completedLessons: 0,
          completedTest: 0,
        });
      }
      const chunkArray = (array, size) => {
        const chunks = [];
        for (let i = 0; i < array.length; i += size) {
          chunks.push(array.slice(i, i + size));
        }
        return chunks;
      };
      const lessonIdChunks = chunkArray(lessonIds, 30);
      let totalLessons = lessonIds.length;
      let completedLessons = 0;
      let uniqueTest = new Set();
      for (const chunk of lessonIdChunks) {
        const lessonQuery = query(
          collection(db, "completed_lessons"),
          where("pupilId", "==", pupilId),
          where("lessonId", "in", chunk),
          where("isBlock", "==", false),
          where("isCompleted", "==", true)
        );
        const LessonSnapshot = await getCountFromServer(lessonQuery);
        completedLessons += LessonSnapshot.data().count;

        const testQuery = query(
          collection(db, "tests"),
          where("pupilId", "==", pupilId),
          where("lessonId", "in", chunk)
        );
        const TestSnapshot = await getDocs(testQuery);
        TestSnapshot.docs.forEach((doc) => {
          const data = doc.data();
          if (data.lessonId) {
            uniqueTest.add(data.lessonId);
          }
        });
      }
      res.status(200).send({
        totalLessons,
        completedLessons,
        completedTest: uniqueTest.size,
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
  // Get all paginated tests
  getAll = async (req, res, next) => {
    try {
      const pageSize = parseInt(req.query.pageSize) || 10;
      const startAfterId = req.query.startAfterId || null;
      let q;
      if (startAfterId) {
        const startDocRef = doc(db, "tests", startAfterId);
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
          collection(db, "tests"),
          orderBy("createdAt", "desc"),
          startAfter(startDocSnap),
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
      const pupilArray = snapshot.docs.map((doc) => Tests.fromFirestore(doc));
      const lastVisible = snapshot.docs[snapshot.docs.length - 1];
      const lastVisibleId = lastVisible ? lastVisible.id : null;

      res.status(200).send({
        data: pupilArray,
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

  // Count tests by pupil ID
  countTestsByPupilID = async (req, res, next) => {
    try {
      const { pupilId } = req.params;
      const q = query(collection(db, "tests"), where("pupilId", "==", pupilId));
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

  //Filter paginated tests by pupilID
  filterByPupilID = async (req, res) => {
    try {
      const pageSize = parseInt(req.query.pageSize) || 10;
      const startAfterId = req.query.startAfterId || null;
      const { pupilID } = req.params;

      let q;
      if (startAfterId) {
        const startDoc = await getDoc(doc(db, "tests", startAfterId));
        q = query(
          collection(db, "tests"),
          where("pupilId", "==", pupilID),
          startAfter(startDoc),
          orderBy("createdAt", "desc"),
          limit(pageSize)
        );
      } else {
        q = query(
          collection(db, "tests"),
          where("pupilId", "==", pupilID),
          orderBy("createdAt", "desc"),
          limit(pageSize)
        );
      }

      const snapshot = await getDocs(q);
      const tests = snapshot.docs.map((doc) => Tests.fromFirestore(doc));
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

  // Count tests by lesson ID
  countTestsByLessonID = async (req, res, next) => {
    try {
      const { lessonId } = req.params;
      const q = query(
        collection(db, "tests"),
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

  //Filter by lessonID
  filterByLessonID = async (req, res) => {
    try {
      const pageSize = parseInt(req.query.pageSize) || 10;
      const startAfterId = req.query.startAfterId || null;
      const { lessonID } = req.params;

      let q;
      if (startAfterId) {
        const startDoc = await getDoc(doc(db, "tests", startAfterId));
        q = query(
          collection(db, "tests"),
          where("lessonId", "==", lessonID),
          startAfter(startDoc),
          orderBy("createdAt", "desc"),
          limit(pageSize)
        );
      } else {
        q = query(
          collection(db, "tests"),
          where("lessonId", "==", lessonID),
          orderBy("createdAt", "desc"),
          limit(pageSize)
        );
      }

      const snapshot = await getDocs(q);
      const tests = snapshot.docs.map((doc) => Tests.fromFirestore(doc));
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

  // Count tests by point
  countTestsByPoint = async (req, res, next) => {
    try {
      const { condition, point } = req.query;
      const q = query(
        collection(db, "tests"),
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

  //Filter by point
  filterByPoint = async (req, res) => {
    try {
      const pageSize = parseInt(req.query.pageSize) || 10;
      const startAfterId = req.query.startAfterId || null;
      const { condition, point } = req.query;

      let q;
      if (startAfterId) {
        const startDoc = await getDoc(doc(db, "tests", startAfterId));
        q = query(
          collection(db, "tests"),
          where("point", condition, parseInt(point)),
          startAfter(startDoc),
          orderBy("createdAt", "desc"),
          limit(pageSize)
        );
      } else {
        q = query(
          collection(db, "tests"),
          where("point", condition, parseInt(point)),
          orderBy("createdAt", "desc"),
          limit(pageSize)
        );
      }

      const snapshot = await getDocs(q);
      const tests = snapshot.docs.map((doc) => Tests.fromFirestore(doc));
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

  // Count tests by pupilID & lessonID
  countTestsByPupilIdAndLessonId = async (req, res, next) => {
    try {
      const { lessonID, pupilID } = req.params;
      const q = query(
        collection(db, "tests"),
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

  // Filter by pupilID & lessonID
  filterByPupilAndLesson = async (req, res) => {
    try {
      const pageSize = parseInt(req.query.pageSize) || 10;
      const startAfterId = req.query.startAfterId || null;
      const { pupilID, lessonID } = req.params;

      let q;
      if (startAfterId) {
        const startDoc = await getDoc(doc(db, "tests", startAfterId));
        q = query(
          collection(db, "tests"),
          where("pupilId", "==", pupilID),
          where("lessonId", "==", lessonID),
          startAfter(startDoc),
          orderBy("createdAt", "desc"),
          limit(pageSize)
        );
      } else {
        q = query(
          collection(db, "tests"),
          where("pupilId", "==", pupilID),
          where("lessonId", "==", lessonID),
          orderBy("createdAt", "desc"),
          limit(pageSize)
        );
      }

      const snapshot = await getDocs(q);
      const tests = snapshot.docs.map((doc) => Tests.fromFirestore(doc));
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
  //Count tests by lessonID & point
  countTestsByLessonIdAndPoint = async (req, res, next) => {
    try {
      const { lessonID } = req.params;
      const { condition, point } = req.query;

      const parsedPoint = parseInt(point);

      const q = query(
        collection(db, "tests"),
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

  //Filter by lessonID & point
  filterByLessonIDAndPoint = async (req, res) => {
    try {
      const pageSize = parseInt(req.query.pageSize) || 10;
      const startAfterId = req.query.startAfterId || null;
      const { lessonID } = req.params;
      const { condition, point } = req.query;
      let q;
      if (startAfterId) {
        const startDoc = await getDoc(doc(db, "tests", startAfterId));
        q = query(
          collection(db, "tests"),
          where("lessonId", "==", lessonID),
          where("point", condition, parseInt(point)),
          startAfter(startDoc),
          orderBy("createdAt", "desc"),
          limit(pageSize)
        );
      } else {
        q = query(
          collection(db, "tests"),
          where("lessonId", "==", lessonID),
          where("point", condition, parseInt(point)),
          orderBy("createdAt", "desc"),
          limit(pageSize)
        );
      }

      const snapshot = await getDocs(q);
      const tests = snapshot.docs.map((doc) => Tests.fromFirestore(doc));
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
  // Thống kê top 10 học sinh có điểm trung bình cao nhất
  top10PupilsByAveragePoint = async (req, res) => {
    try {
      // Lấy tất cả bài kiểm tra
      const snapshot = await getDocs(collection(db, "tests"));
      const tests = snapshot.docs.map((doc) => Tests.fromFirestore(doc));

      // Tạo object để lưu tổng điểm và số bài kiểm tra của từng học sinh
      const pupilStats = {};

      // Duyệt qua các bài kiểm tra để tính tổng điểm và số bài kiểm tra
      tests.forEach((test) => {
        const { pupilId, point } = test;
        if (!pupilStats[pupilId]) {
          pupilStats[pupilId] = { totalPoints: 0, testCount: 0 };
        }
        pupilStats[pupilId].totalPoints += point;
        pupilStats[pupilId].testCount += 1;
      });

      // Tính điểm trung bình và chuyển thành mảng
      const pupilAverages = Object.keys(pupilStats).map((pupilId) => ({
        pupilId,
        averagePoint:
          pupilStats[pupilId].totalPoints / pupilStats[pupilId].testCount,
        testCount: pupilStats[pupilId].testCount,
      }));

      // Sắp xếp theo điểm trung bình giảm dần và lấy top 10
      const top10Pupils = pupilAverages
        .sort((a, b) => b.averagePoint - a.averagePoint)
        .slice(0, 10);

      res.status(200).send({
        data: top10Pupils,
        message: {
          en: "Top 10 pupils by average point retrieved successfully",
          vi: "Lấy top 10 học sinh có điểm trung bình cao nhất thành công",
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

  // Get tests by pupil ID
  getTestByPupilId = async (req, res, next) => {
    try {
      const pupilId = req.params.id;
      console.log("Querying for pupilId:", pupilId); // Debug log
      const q = query(
        collection(db, "tests"),
        where("pupilId", "==", pupilId),
        orderBy("createdAt", "desc")
      );
      const testSnapshot = await getDocs(q);
      const testArray = testSnapshot.docs.map((doc) =>
        Tests.fromFirestore(doc)
      );
      res.status(200).send(testArray);
    } catch (error) {
      res.status(500).send({
        message: {
          en: error.message,
          vi: "Đã xảy ra lỗi nội bộ.",
        },
      });
    }
  };

  // Get point statistic by lessons
  getPointStatsByLessons = async (req, res) => {
    try {
      const { grade, type, startDate, endDate } = req.query;

      // Parse thời gian nếu có
      let start, end;
      if (startDate) start = Timestamp.fromDate(new Date(startDate));
      if (endDate) end = Timestamp.fromDate(new Date(endDate));

      // 1. Lấy tất cả bài học phù hợp
      const lessonSnapshot = await getDocs(
        query(
          collection(db, "lessons"),
          where("grade", "==", parseInt(grade)),
          where("type", "==", type),
          where("isDisabled", "==", false),
          orderBy("order")
        )
      );

      const results = [];

      for (const lessonDoc of lessonSnapshot.docs) {
        const lesson = lessonDoc.data();
        const lessonId = lessonDoc.id;

        // Hàm tạo query có điều kiện ngày nếu có
        const buildTestQuery = (pointCond) => {
          let q = query(
            collection(db, "tests"),
            where("lessonId", "==", lessonId),
            ...pointCond
          );
          if (start) q = query(q, where("createdAt", ">=", start));
          if (end) q = query(q, where("createdAt", "<=", end));
          return q;
        };

        // Các khoảng điểm
        const q9 = buildTestQuery([where("point", ">=", 9)]);
        const q7to9 = buildTestQuery([
          where("point", ">=", 7),
          where("point", "<", 9),
        ]);
        const q5to7 = buildTestQuery([
          where("point", ">=", 5),
          where("point", "<", 7),
        ]);
        const qlt5 = buildTestQuery([where("point", "<", 5)]);

        // Lấy count
        const count_9plus = await getCountFromServer(q9);
        const count_7to9 = await getCountFromServer(q7to9);
        const count_5to7 = await getCountFromServer(q5to7);
        const count_lt5 = await getCountFromServer(qlt5);

        results.push({
          lessonId,
          lessonName: lesson.name,
          counts: {
            "≥9": count_9plus.data().count,
            "≥7": count_7to9.data().count,
            "≥5": count_5to7.data().count,
            "<5": count_lt5.data().count,
          },
        });
      }

      res.status(200).json(results);
    } catch (error) {
      res.status(500).send({
        message: {
          en: error.message,
          vi: "Đã xảy ra lỗi nội bộ.",
        },
      });
    }
  };

  // Get point statistic by grade
  getPointStatsByGrade = async (req, res) => {
    try {
      const { grade, startDate, endDate } = req.query;

      // Parse thời gian nếu có
      let start, end;
      if (startDate) start = Timestamp.fromDate(new Date(startDate));
      if (endDate) end = Timestamp.fromDate(new Date(endDate));

      const gradeNumber = parseInt(grade);
      const types =
        gradeNumber === 1
          ? ["addition", "subtraction"]
          : ["addition", "subtraction", "multiplication", "division"];
      const results = [];
      for (const type of types) {
        // 1. Lấy tất cả bài học phù hợp
        const lessonSnapshot = await getDocs(
          query(
            collection(db, "lessons"),
            where("grade", "==", gradeNumber),
            where("type", "==", type),
            where("isDisabled", "==", false)
          )
        );

        let _9plus = 0;
        let _7to9 = 0;
        let _5to7 = 0;
        let _lt5 = 0;

        for (const lessonDoc of lessonSnapshot.docs) {
          const lessonId = lessonDoc.id;

          // Hàm tạo query có điều kiện ngày nếu có
          const buildTestQuery = (pointCond) => {
            let q = query(
              collection(db, "tests"),
              where("lessonId", "==", lessonId),
              ...pointCond
            );
            if (start) q = query(q, where("createdAt", ">=", start));
            if (end) q = query(q, where("createdAt", "<=", end));
            return q;
          };

          // Các khoảng điểm
          const q9 = buildTestQuery([where("point", ">=", 9)]);
          const q7to9 = buildTestQuery([
            where("point", ">=", 7),
            where("point", "<", 9),
          ]);
          const q5to7 = buildTestQuery([
            where("point", ">=", 5),
            where("point", "<", 7),
          ]);
          const qlt5 = buildTestQuery([where("point", "<", 5)]);

          // Lấy count
          _9plus += (await getCountFromServer(q9))?.data().count;
          _7to9 += (await getCountFromServer(q7to9))?.data().count;
          _5to7 += (await getCountFromServer(q5to7))?.data().count;
          _lt5 += (await getCountFromServer(qlt5))?.data().count;
        }
        results.push({
          mathType: type,
          counts: {
            "≥9": _9plus,
            "≥7": _7to9,
            "≥5": _5to7,
            "<5": _lt5,
          },
        });
      }

      res.status(200).json(results);
    } catch (error) {
      res.status(500).send({
        message: {
          en: error.message,
          vi: "Đã xảy ra lỗi nội bộ.",
        },
      });
    }
  };

  // Thống kê top 10 bài tập có điểm trung bình cao nhất
  top10TestsByAveragePoint = async (req, res) => {
    try {
      // Lấy tất cả bài kiểm tra
      const snapshot = await getDocs(collection(db, "tests"));
      const tests = snapshot.docs.map((doc) => Tests.fromFirestore(doc));

      // Tạo object để lưu tổng điểm và số học sinh làm bài cho từng bài kiểm tra
      const testStats = {};

      // Duyệt qua các bài kiểm tra để tính tổng điểm và số học sinh
      tests.forEach((test) => {
        const { lessonId, point } = test;
        if (!testStats[lessonId]) {
          testStats[lessonId] = { totalPoints: 0, pupilCount: 0 };
        }
        testStats[lessonId].totalPoints += point;
        testStats[lessonId].pupilCount += 1;
      });

      // Tính điểm trung bình và chuyển thành mảng
      const testAverages = Object.keys(testStats).map((lessonId) => ({
        lessonId,
        averagePoint:
          testStats[lessonId].totalPoints / testStats[lessonId].pupilCount,
        pupilCount: testStats[lessonId].pupilCount,
      }));

      // Sắp xếp theo điểm trung bình giảm dần và lấy top 10
      const top10Tests = testAverages
        .sort((a, b) => b.averagePoint - a.averagePoint)
        .slice(0, 10);

      res.status(200).send({
        data: top10Tests,
        message: {
          en: "Top 10 tests by average point retrieved successfully",
          vi: "Lấy top 10 bài tập có điểm trung bình cao nhất thành công",
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

    // Get tests by lesson ID
    getTestsByLesson = async (req, res, next) => {
      try {
        const lessonId = req.params.lessonId;
        const q = query(
          collection(db, "tests"),
          where("lessonId", "==", lessonId)
        );
        const testSnapshot = await getDocs(q);
        const allTests = testSnapshot.docs.map((doc) =>
          Tests.fromFirestore(doc)
        );
        // Lấy test mới nhất theo pupilId
        const latestTestsByPupil = {};
        for (const test of allTests) {
          const pupilId = test.pupilId;
          const current = latestTestsByPupil[pupilId];
          // Nếu chưa có hoặc test mới hơn => cập nhật
          if (
            !current ||
            new Date(test.createdAt) > new Date(current.createdAt)
          ) {
            latestTestsByPupil[pupilId] = test;
          }
        }
        // Trả về mảng kết quả
        const result = Object.values(latestTestsByPupil);
        res.status(200).send(result);
      } catch (error) {
        res.status(500).send({
          message: {
            en: error.message,
            vi: "Đã xảy ra lỗi nội bộ.",
          },
        });
      }
    };

    // Get test by pupil ID & lesson ID
    getTestsByPupilIdAndLesson = async (req, res, next) => {
      try {
        const { pupilId, lessonId } = req.params;
        console.log(
          "Querying for lessonId:",
          pupilId,
          "and lessonId",
          lessonId
        ); // Debug log
        const q = query(
          collection(db, "tests"),
          where("pupilId", "==", pupilId),
          where("lessonId", "==", lessonId)
        );
        const testSnapshot = await getDocs(q);
        const testArray = testSnapshot.docs.map((doc) =>
          Tests.fromFirestore(doc)
        );
        res.status(200).send(testArray);
      } catch (error) {
        res.status(500).send({
          message: {
            en: error.message,
            vi: "Đã xảy ra lỗi nội bộ.",
          },
        });
      }
    };
  };
  getUserPointStatsComparison = async (req, res) => {
    try {
      const { pupilId } = req.params;
      const { grade, ranges, lessonId } = req.query;

      // Kiểm tra các tham số bắt buộc
      if (!pupilId || !grade || !lessonId) {
        return res.status(400).json({
          message: {
            en: "Missing pupilId, lessonId (params) or grade (query).",
            vi: "Thiếu pupilId, lessonId (params) hoặc grade (query).",
          },
        });
      }

      const gradeNumber = parseInt(grade);
      const expectedTypes =
        gradeNumber === 1
          ? ["addition", "subtraction"]
          : ["addition", "subtraction", "multiplication", "division"];

      // Tính toán các khoảng thời gian
      const now = new Date();
      console.log("Current date:", now);

      const startOfWeek = (d) => {
        const day = d.getDay();
        const diff = d.getDate() - day + (day === 0 ? -6 : 1);
        return new Date(d.getFullYear(), d.getMonth(), diff);
      };

      const thisWeekStart = startOfWeek(new Date(now));
      const lastWeekStart = new Date(thisWeekStart);
      lastWeekStart.setDate(lastWeekStart.getDate() - 7);
      const lastWeekEnd = new Date(thisWeekStart);
      lastWeekEnd.setDate(lastWeekEnd.getDate() - 1);

      const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

      const currentQuarter = Math.floor(now.getMonth() / 3);
      const thisQuarterStart = new Date(
        now.getFullYear(),
        currentQuarter * 3,
        1
      );
      const thisQuarterEnd = new Date(
        now.getFullYear(),
        (currentQuarter + 1) * 3,
        0
      );
      const lastQuarterStart = new Date(
        now.getFullYear(),
        (currentQuarter - 1) * 3,
        1
      );
      const lastQuarterEnd = new Date(now.getFullYear(), currentQuarter * 3, 0);

      // Log các khoảng thời gian để debug
      console.log("thisQuarterStart:", thisQuarterStart);
      console.log("thisQuarterEnd:", thisQuarterEnd);
      console.log("lastQuarterStart:", lastQuarterStart);
      console.log("lastQuarterEnd:", lastQuarterEnd);

      const timeRanges = {
        thisWeek: [Timestamp.fromDate(thisWeekStart), Timestamp.fromDate(now)],
        lastWeek: [
          Timestamp.fromDate(lastWeekStart),
          Timestamp.fromDate(lastWeekEnd),
        ],
        thisMonth: [
          Timestamp.fromDate(thisMonthStart),
          Timestamp.fromDate(now),
        ],
        lastMonth: [
          Timestamp.fromDate(lastMonthStart),
          Timestamp.fromDate(lastMonthEnd),
        ],
        thisQuarter: [
          Timestamp.fromDate(thisQuarterStart),
          Timestamp.fromDate(now),
        ],
        lastQuarter: [
          Timestamp.fromDate(lastQuarterStart),
          Timestamp.fromDate(lastQuarterEnd),
        ],
      };

      // Xử lý ranges từ query
      const requestedRanges =
        ranges && typeof ranges === "string"
          ? ranges
            .split(",")
            .map((r) => r.trim())
            .filter((r) => r in timeRanges)
          : Object.keys(timeRanges);

      console.log("Requested ranges:", requestedRanges);

      const getPointStatsByType = async (start, end, label) => {
        const q = query(
          collection(db, "tests"),
          where("pupilId", "==", pupilId),
          where("lessonId", "==", lessonId),
          where("createdAt", ">=", start),
          where("createdAt", "<=", end)
        );
        const snapshot = await getDocs(q);
        const tests = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        console.log(
          `Found ${tests.length
          } tests for ${label} from ${start.toDate()} to ${end.toDate()}`
        );

        if (tests.length === 0) {
          return { message: `No tests found for ${label}` };
        }

        const lessonDoc = await getDoc(doc(db, "lessons", lessonId));
        if (!lessonDoc.exists()) {
          console.log(`Lesson ${lessonId} not found`);
          return {};
        }
        const lessonType = lessonDoc.data().type;

        if (!expectedTypes.includes(lessonType)) {
          console.log(`Invalid lesson type: ${lessonType}`);
          return {};
        }

        const stats = { [lessonType]: { "≥9": 0, "≥7": 0, "≥5": 0, "<5": 0 } };

        for (const test of tests) {
          const point = test.point;
          if (point >= 9) stats[lessonType]["≥9"]++;
          else if (point >= 7) stats[lessonType]["≥7"]++;
          else if (point >= 5) stats[lessonType]["≥5"]++;
          else stats[lessonType]["<5"]++;
        }

        return stats;
      };

      const result = {};

      for (const label of requestedRanges) {
        const [start, end] = timeRanges[label];
        const stats = await getPointStatsByType(start, end, label);

        if (stats.message) {
          result[label] = stats;
          continue;
        }

        const lessonDoc = await getDoc(doc(db, "lessons", lessonId));
        const lessonType = lessonDoc.exists() ? lessonDoc.data().type : null;

        if (lessonType && expectedTypes.includes(lessonType)) {
          if (!result[lessonType]) result[lessonType] = {};
          result[lessonType][label] = stats[lessonType] || {
            "≥9": 0,
            "≥7": 0,
            "≥5": 0,
            "<5": 0,
          };
        }
      }

      // Log kết quả cuối cùng
      console.log("Final result:", JSON.stringify(result, null, 2));

      return res.status(200).json({
        pupilId,
        lessonId,
        grade: gradeNumber,
        compareByType: result,
      });
    } catch (err) {
      console.error("Error:", err);
      return res.status(500).json({
        message: {
          en: err.message,
          vi: "Đã xảy ra lỗi khi thống kê điểm theo kỹ năng.",
        },
      });
    }
  };
  // Hàm chia mảng thành từng lô nhỏ (mỗi lô tối đa 10 phần tử)
  getUserPointFullLesson = async (req, res) => {
    try {
      const { pupilId } = req.params;
      const { grade, type, ranges } = req.query;

      // Validate pupilId, grade, and type
      if (!pupilId || !grade) {
        return res.status(400).json({
          message: {
            en: "Missing pupilId (params) or grade (query).",
            vi: "Thiếu pupilId (params) hoặc grade (query).",
          },
        });
      }

      const gradeNumber = parseInt(grade);
      const expectedTypes =
        gradeNumber === 1
          ? ["addition", "subtraction"]
          : ["addition", "subtraction", "multiplication", "division"];

      // Validate type if provided
      if (type && !expectedTypes.includes(type)) {
        return res.status(400).json({
          message: {
            en: `Invalid type. Expected one of: ${expectedTypes.join(", ")}.`,
            vi: `Kỹ năng không hợp lệ. Cần là một trong: ${expectedTypes.join(
              ", "
            )}.`,
          },
        });
      }

      const now = new Date();
      const startOfWeek = (d) => {
        const day = d.getDay();
        const diff = d.getDate() - day + (day === 0 ? -6 : 1);
        return new Date(d.getFullYear(), d.getMonth(), diff);
      };

      const thisWeekStart = startOfWeek(new Date(now));
      const lastWeekStart = new Date(thisWeekStart);
      lastWeekStart.setDate(lastWeekStart.getDate() - 7);
      const lastWeekEnd = new Date(thisWeekStart);
      lastWeekEnd.setDate(lastWeekEnd.getDate() - 1);

      const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

      const currentQuarter = Math.floor(now.getMonth() / 3);
      const thisQuarterStart = new Date(
        now.getFullYear(),
        currentQuarter * 3,
        1
      );
      const lastQuarterStart = new Date(
        now.getFullYear(),
        (currentQuarter - 1) * 3,
        1
      );
      const lastQuarterEnd = new Date(now.getFullYear(), currentQuarter * 3, 0);

      const timeRanges = {
        thisWeek: [Timestamp.fromDate(thisWeekStart), Timestamp.fromDate(now)],
        lastWeek: [
          Timestamp.fromDate(lastWeekStart),
          Timestamp.fromDate(lastWeekEnd),
        ],
        thisMonth: [
          Timestamp.fromDate(thisMonthStart),
          Timestamp.fromDate(now),
        ],
        lastMonth: [
          Timestamp.fromDate(lastMonthStart),
          Timestamp.fromDate(lastMonthEnd),
        ],
        thisQuarter: [
          Timestamp.fromDate(thisQuarterStart),
          Timestamp.fromDate(now),
        ],
        lastQuarter: [
          Timestamp.fromDate(lastQuarterStart),
          Timestamp.fromDate(lastQuarterEnd),
        ],
      };

      const requestedRanges =
        ranges && typeof ranges === "string"
          ? ranges
            .split(",")
            .map((r) => r.trim())
            .filter((r) => r in timeRanges)
          : Object.keys(timeRanges);

      // Fetch lessons for the given grade and type (if provided)
      const lessonsQuery = query(
        collection(db, "lessons"),
        where("grade", "==", gradeNumber),
        ...(type ? [where("type", "==", type)] : [])
      );
      const lessonsSnapshot = await getDocs(lessonsQuery);
      const lessons = lessonsSnapshot.docs.map((doc) => ({
        id: doc.id,
        type: doc.data().type,
      }));

      const getPointStatsByLesson = async (lessonId, start, end) => {
        const q = query(
          collection(db, "tests"),
          where("pupilId", "==", pupilId),
          where("lessonId", "==", lessonId),
          where("createdAt", ">=", start),
          where("createdAt", "<=", end)
        );
        const snapshot = await getDocs(q);
        const tests = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        if (tests.length === 0) {
          return { "≥9": 0, "≥7": 0, "≥5": 0, "<5": 0 };
        }

        const stats = { "≥9": 0, "≥7": 0, "≥5": 0, "<5": 0 };
        for (const test of tests) {
          const point = test.point;
          if (point >= 9) stats["≥9"]++;
          else if (point >= 7) stats["≥7"]++;
          else if (point >= 5) stats["≥5"]++;
          else stats["<5"]++;
        }

        return stats;
      };

      const result = {};

      // Group lessons by type (only the specified type if provided)
      const lessonsByType = lessons.reduce((acc, lesson) => {
        if (!acc[lesson.type]) acc[lesson.type] = [];
        acc[lesson.type].push(lesson.id);
        return acc;
      }, {});

      // Calculate stats for each lessonId within each type
      for (const lessonType of Object.keys(lessonsByType)) {
        result[lessonType] = {};
        for (const lessonId of lessonsByType[lessonType]) {
          result[lessonType][`lessonId: ${lessonId}`] = {};
          for (const range of requestedRanges) {
            const [start, end] = timeRanges[range];
            const stats = await getPointStatsByLesson(lessonId, start, end);
            result[lessonType][`lessonId: ${lessonId}`][range] = stats;
          }
        }
      }

      return res.status(200).json({
        pupilId,
        grade: gradeNumber,
        compareByLesson: result,
      });
    } catch (err) {
      console.error("Error:", err);
      return res.status(500).json({
        message: {
          en: err.message,
          vi: "Đã xảy ra lỗi khi thống kê điểm theo bài học.",
        },
      });
    }
  };
  getAnswerStats = async (req, res) => {
    try {
      const { pupilId, lessonId } = req.params;
      const { grade, ranges, skill, rangeType = "month" } = req.query;

      if (!pupilId || !grade) {
        return res.status(400).json({ message: "Thiếu pupilId hoặc grade." });
      }

      const gradeNumber = parseInt(grade);
      const expectedTypes =
        gradeNumber === 1
          ? ["addition", "subtraction"]
          : ["addition", "subtraction", "multiplication", "division"];

      const getWeekNumber = (date) => {
        const target = new Date(date.valueOf());
        const dayNumber = (date.getDay() + 6) % 7;
        target.setDate(target.getDate() - dayNumber + 3);
        const firstThursday = new Date(target.getFullYear(), 0, 4);
        const diff = target - firstThursday;
        return 1 + Math.round(diff / (7 * 24 * 60 * 60 * 1000));
      };

      const formatRangeKey = (date) => {
        const year = date.getFullYear();
        const month = `${date.getMonth() + 1}`.padStart(2, "0");
        if (rangeType === "week") {
          const week = getWeekNumber(date);
          return `${year}-W${week}`;
        } else if (rangeType === "quarter") {
          const quarter = Math.floor(date.getMonth() / 3) + 1;
          return `${year}-Q${quarter}`;
        }
        return `${year}-${month}`;
      };

      const rangeKeys =
        typeof ranges === "string"
          ? ranges.split(",").map((r) => r.trim())
          : Array.isArray(ranges)
            ? ranges
            : [];

      //Truy vấn tất cả các `tests` thuộc học sinh và bài học
      const testQuery = query(
        collection(db, "tests"),
        where("pupilId", "==", pupilId),
        where("lessonId", "==", lessonId)
      );
      const testSnapshot = await getDocs(testQuery);
      const testDocs = testSnapshot.docs;
      if (testDocs.length === 0) {
        return res.status(200).json({
          pupilId,
          grade: gradeNumber,
          total: 0,
          correct: 0,
          wrong: 0,
          skillSummary: [],
          weakSkills: [],
          retryList: [],
          retryCount: 0,
          accuracyByRange: [],
          data: [],
          tests: [],
        });
      }

      const testCache = {};
      const testIds = testDocs.map((doc) => {
        testCache[doc.id] = { id: doc.id, ...doc.data() };
        return doc.id;
      });

      // Truy vấn test_questions theo testId (chia batch 10 phần tử)
      const testIdBatches = chunkArray(testIds, 10);
      let questionDocs = [];
      for (const batch of testIdBatches) {
        const q = query(
          collection(db, "test_questions"),
          where("testId", "in", batch)
        );
        const qSnapshot = await getDocs(q);
        questionDocs.push(...qSnapshot.docs);
      }

      // Load level map
      const levelSnapshot = await getDocs(collection(db, "levels"));
      const levels = levelSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      const getLevelName = (levelId) => {
        const level = levels.find((l) => l.id === levelId);
        return level?.name || { en: levelId };
      };

      //  Bắt đầu xử lý logic thống kê
      const lessonCache = {};
      const data = [];
      const typeStats = {};
      const retryMap = {};
      const rangeStats = {};

      for (const docSnap of questionDocs) {
        const q = docSnap.data();
        const qTestId = q.testId;
        const exerciseId = q.exerciseId;
        const createdAt = q.createdAt?.toDate?.() || new Date(q.createdAt);

        if (!qTestId || !exerciseId || !createdAt) continue;

        const testData = testCache[qTestId];
        if (!testData || testData.pupilId !== pupilId) continue;

        const qLessonId = testData.lessonId || "unknown";

        if (!lessonCache[qLessonId]) {
          const lessonDoc = await getDoc(doc(db, "lessons", qLessonId));
          if (!lessonDoc.exists()) continue;
          lessonCache[qLessonId] = lessonDoc.data();
        }

        const lesson = lessonCache[qLessonId];
        const type = lesson.type;

        if (!expectedTypes.includes(type)) continue;
        if (skill && type !== skill) continue;
        if (lessonId && qLessonId !== lessonId) continue;

        const rangeKey = formatRangeKey(createdAt);
        if (rangeKeys.length > 0 && !rangeKeys.includes(rangeKey)) continue;

        const correctAnswer = q.correctAnswer;
        const selectedAnswer = q.selectedAnswer;
        // const isCorrect =
        //   correctAnswer?.en?.trim() === selectedAnswer?.en?.trim() &&
        //   correctAnswer?.vi?.trim() === selectedAnswer?.vi?.trim();
        const isCorrect =
          correctAnswer?.vi?.trim() ===
          (typeof selectedAnswer === "string"
            ? selectedAnswer.trim()
            : selectedAnswer?.vi?.trim());
        if (!rangeStats[rangeKey])
          rangeStats[rangeKey] = { correct: 0, total: 0 };
        rangeStats[rangeKey].total++;
        if (isCorrect) rangeStats[rangeKey].correct++;

        if (!retryMap[exerciseId]) {
          retryMap[exerciseId] = { wrongTimes: 0, meta: null };
        }
        retryMap[exerciseId].wrongTimes += isCorrect ? 0 : 1;
        retryMap[exerciseId].meta = {
          exerciseId,
          question: q.question || null,
          image: q.image || null,
        };

        if (!typeStats[type]) typeStats[type] = { correct: 0, wrong: 0 };
        isCorrect ? typeStats[type].correct++ : typeStats[type].wrong++;

        data.push({
          type,
          lessonId: qLessonId,
          testId: qTestId,
          exerciseId,
          question: q.question || null,
          correctAnswer,
          selectedAnswer,
          option: q.option || [],
          image: q.image || null,
          createdAt: createdAt.toISOString(),
          isCorrect,
          levelName: getLevelName(q.levelId),
          point: testData.point || null,
        });
      }

      const total = data.length;
      const correct = data.filter((q) => q.isCorrect).length;
      const wrong = total - correct;

      const skillSummary = Object.entries(typeStats).map(([type, stat]) => {
        const total = stat.correct + stat.wrong;
        const accuracy = total > 0 ? (stat.correct / total) * 100 : 0;
        return {
          type,
          correct: stat.correct,
          wrong: stat.wrong,
          accuracy: Math.round(accuracy * 10) / 10,
        };
      });

      const weakSkills = skillSummary
        .filter((s) => s.accuracy < 70)
        .map((s) => s.type);

      const retryList = Object.entries(retryMap)
        .filter(([_, r]) => r.wrongTimes >= 2)
        .map(([exerciseId, r]) => ({
          exerciseId,
          question: r.meta?.question,
          image: r.meta?.image,
          wrongTimes: r.wrongTimes,
          shouldRetry: true,
        }));

      const accuracyByRange = Object.entries(rangeStats)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([range, stat]) => ({
          range,
          accuracy:
            stat.total > 0
              ? Math.round((stat.correct / stat.total) * 1000) / 10
              : 0,
          correct: stat.correct,
          wrong: stat.total - stat.correct,
        }));

      const tests = Object.values(
        data.reduce((acc, item) => {
          if (!acc[item.testId]) {
            const testData = testCache[item.testId];
            acc[item.testId] = {
              testId: item.testId,
              lessonId: item.lessonId,
              type: item.type,
              point: testData?.point || null,
            };
          }
          return acc;
        }, {})
      );

      return res.status(200).json({
        pupilId,
        grade: gradeNumber,
        total,
        correct,
        wrong,
        skillSummary,
        weakSkills,
        retryList,
        retryCount: retryList.length,
        accuracyByRange,
        data,
        tests,
      });
    } catch (err) {
      console.error("Lỗi xử lý:", err);
      return res.status(500).json({
        message: { en: err.message, vi: "" },
      });
    }
  };

  getTestsByPupilIdAndLessonId = async (req, res, next) => {
    try {
      const { pupilId, lessonId } = req.params;

      if (!pupilId || !lessonId) {
        return res.status(400).send({
          message: {
            en: "Missing pupilId or lessonId",
            vi: "Thiếu pupilId hoặc lessonId",
          },
        });
      }

      // Lấy thông tin bài học
      const lessonSnap = await getDoc(doc(db, "lessons", lessonId));
      if (!lessonSnap.exists()) {
        return res.status(404).send({
          message: {
            en: "Lesson not found",
            vi: "Không tìm thấy bài học",
          },
        });
      }
      const lessonData = lessonSnap.data();
      const lessonName = lessonData.name || {
        en: "Unnamed",
        vi: "Chưa đặt tên",
      };

      // Lấy danh sách bài test
      const q = query(
        collection(db, "tests"),
        where("pupilId", "==", pupilId),
        where("lessonId", "==", lessonId),
        orderBy("createdAt", "desc")
      );

      const snapshot = await getDocs(q);
      const tests = snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          lessonName,
        };
      });

      return res.status(200).send({
        count: tests.length,
        data: tests,
      });
    } catch (error) {
      console.error("getTestsByPupilIdAndLessonId error:", error);
      res.status(500).send({
        message: {
          en: error.message,
          vi: "Đã xảy ra lỗi nội bộ.",
        },
      });
    }
  };

  // Ranking by grade
  rankingByGrade = async (req, res) => {
    try {
      const { grade } = req.params;

      // 1. Lấy tất cả lesson enable theo grade
      const lessonQuery = query(
        collection(db, "lessons"),
        where("grade", "==", parseInt(grade)),
        where("isDisabled", "==", false),
        orderBy("order")
      );
      const lessonSnapshot = await getDocs(lessonQuery);
      const lessons = lessonSnapshot.docs.map((doc) => ({
        id: doc.id,
        name: doc.get("name"),
      }));

      // 2. Lấy tất cả pupils enable = true
      const pupilQuery = query(
        collection(db, "pupils"),
        where("isDisabled", "==", false)
      );
      const pupilSnapshot = await getDocs(pupilQuery);
      const pupils = pupilSnapshot.docs.map((doc) => ({
        id: doc.id,
        fullName: doc.get("fullName"),
         image: doc.get("image"),
      }));

      const ranking = [];

      // 3. Duyệt từng pupil
      for (const pupil of pupils) {
        let totalPoint = 0;
        let totalDuration = 0;
        let lessonTestList = [];

        // 4. Duyệt từng lesson
        for (const lesson of lessons) {
          const testsQuery = query(
            collection(db, "tests"),
            where("lessonId", "==", lesson.id),
            where("pupilId", "==", pupil.id),
            orderBy("createdAt", "desc"),
            limit(1)
          );

          const testSnapshot = await getDocs(testsQuery);
          const latestTest = testSnapshot.docs[0];

          if (latestTest) {
            const testData = Tests.fromFirestore(latestTest);
            lessonTestList.push({
              lessonId: lesson.id,
              lessonName: lesson.name,
              point: testData.point,
              duration: testData.duration,
            });

            totalPoint += Number(testData.point || 0);
            totalDuration += Number(testData.duration || 0);
          }
        }

        ranking.push({
          pupil: {
            id: pupil.id,
            fullName: pupil.fullName,
            image: pupil.image,
            image: pupil.image,
          },
          lessonTestList: lessonTestList,
          point: totalPoint,
          duration: totalDuration,
        });
      }

      // 5. Sắp xếp: point giảm dần, duration tăng dần
      ranking.sort((a, b) => {
        if (b.point !== a.point) return b.point - a.point;
        return a.duration - b.duration;
      });

      res.status(200).send(ranking);
    } catch (error) {
      console.error("Ranking error:", error);
      res.status(500).send({
        message: {
          en: error.message,
          vi: "Đã xảy ra lỗi khi tính xếp hạng.",
        },
      });
    }
  };
}

module.exports = new TestController();
