const TestQuestion = require("../models/TestQuestions");
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
  getCountFromServer,
} = require("firebase/firestore");

const db = getFirestore();

class TestQuestionController {
  // Create multiple test questions
  createMultiple = async (req, res) => {
    try {
      let data = req.body;
      // Nếu data không phải mảng, bọc nó thành mảng
      if (!Array.isArray(data)) {
        if (data && typeof data === "object") {
          data = [data];
        } else {
          throw new Error(
            "Dữ liệu gửi lên phải là mảng hoặc một đối tượng câu hỏi"
          );
        }
      }
      // Kiểm tra dữ liệu (tùy chọn, nhưng nên làm)
      for (const item of data) {
        if (!item.testId || !item.exerciseId || !item.question) {
          throw new Error("Mỗi câu hỏi phải có testId, exerciseId và question");
        }
      }
      // Dùng Promise.all để tạo song song
      await Promise.all(
        data.map((item) =>
          addDoc(collection(db, "test_questions"), {
            ...item,
            createdAt: serverTimestamp(),
          })
        )
      );
      res.status(201).send({
        message: {
          en: "Test questions created successfully!",
          vi: "Tạo các câu hỏi cho bài kiểm thành công",
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

  // Get test question by ID
  getById = async (req, res) => {
    const id = req.params.id;
    const testQuestion = req.testQuestion;
    res.status(200).send({ id: id, ...testQuestion });
  };

  // Get test questions by test ID
  getByTest = async (req, res, next) => {
    try {
      const testId = req.params.testId;
      console.log("Querying for TestId:", testId); // Debug log
      const q = query(
        collection(db, "test_questions"),
        where("testId", "==", testId),
        orderBy("createdAt", "desc")
      );
      const snapshot = await getDocs(q);
      const testquestions = snapshot.docs.map((doc) =>
        TestQuestion.fromFirestore(doc)
      );
      const lastVisible = snapshot.docs[snapshot.docs.length - 1];
      const lastVisibleId = lastVisible ? lastVisible.id : null;

      res.status(200).send({
        data: testquestions,
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

  // Count test questions by exercise ID
  countOptionByExercise = async (req, res, next) => {
    try {
      const exerciseId = req.params.exerciseId;
      const { answer, options } = req.body;
      const count = [];
      const q1 = query(
        collection(db, "test_questions"),
        where("exerciseId", "==", exerciseId),
        where("selectedAnswer", "==", answer)
      );
      const snapshot1 = await getCountFromServer(q1);
      count.push(snapshot1.data().count);

      for (const option of options) {
        const q2 = query(
          collection(db, "test_questions"),
          where("exerciseId", "==", exerciseId),
          where("selectedAnswer", "==", option)
        );
        const snapshot2 = await getCountFromServer(q2);
        count.push(snapshot2.data().count);
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
}

module.exports = new TestQuestionController();
