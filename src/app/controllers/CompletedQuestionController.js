const CompletedQuestion = require("../models/CompletedQuestion");
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

class CompletedQuestionController {
  // Create multiple completed questions
  createMultiple = async (req, res) => {
    try {
      const data = req.body;
      // Dùng Promise.all để tạo song song
      await Promise.all(
        data.map((item) =>
          addDoc(collection(db, "completed_questions"), {
            ...item,
            createdAt: serverTimestamp(),
          })
        )
      );
      res.status(201).send({
        message: {
          en: "Completed questions created successfully!",
          vi: "Tạo các câu hỏi cho bài tập thành công",
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

  // Get completed question by ID
  getById = async (req, res) => {
    const id = req.params.id;
    const completedQuestion = req.completedQuestion;
    res.status(200).send({ id: id, ...completedQuestion });
  };

  // Get completed questions by completed exercise ID
  getByCompletedExercise = async (req, res, next) => {
    try {
      const completedExerciseId = req.params.completedExerciseId;
      console.log("Querying for CompletedId:", completedId); // Debug log
      const q = query(
        collection(db, "completed_questions"),
        where("completedExerciseId", "==", completedExerciseId),
        orderBy("createdAt", "desc")
      );
      const completedQuestionSnapshot = await getDocs(q);
      const completedQuestionArray = completedQuestionSnapshot.docs.map((doc) =>
        CompletedQuestion.fromFirestore(doc)
      );
      res.status(200).send(completedQuestionArray);
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

module.exports = new CompletedQuestionController();
