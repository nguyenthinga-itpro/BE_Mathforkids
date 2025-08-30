const Assessment = require("../models/Assessment");
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
} = require("firebase/firestore");

const db = getFirestore();
const { uploadMultipleFiles } = require("./FileController");

class AssessmentController {
  // Create assessment
  create = async (req, res, next) => {
    try {
      const {
        levelId,
        grade,
        type,
        question,
        option: textOption,
        answer: textAnswer,
      } = req.body;
      // Parse JSON fields
      const parsedType = JSON.parse(type);
      const parsedQuestion = JSON.parse(question);

      // Upload files and get image, option, and answer
      const { image, option, answer } = await uploadMultipleFiles(
        req.files,
        textOption,
        textAnswer
      );

      // Prepare assessment data
      const assessmentRef = await addDoc(collection(db, "assessments"), {
        levelId,
        grade: parseInt(grade),
        type: parsedType,
        question: parsedQuestion,
        option, // Array of text or image URLs
        answer,
        image,
        isDisabled: false,
        createdAt: serverTimestamp(),
      });

      res.status(201).send({
        message: {
          en: "Assessment created successfully!",
          vi: "Tạo bài kiểm tra đầu vào thành công!",
        },
        data: assessmentRef.id,
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

  // Get all assessments
  getAll = async (req, res, next) => {
    try {
      const assessments = await getDocs(collection(db, "assessments"));
      const assessmentArray = assessments.docs.map((doc) =>
        Assessment.fromFirestore(doc)
      );
      res.status(200).send(assessmentArray);
    } catch (error) {
      res.status(500).send({
        message: {
          en: error.message,
          vi: "Đã xảy ra lỗi nội bộ.",
        },
      });
    }
  };

  // Get enabled assessments
  getEnabledAssessments = async (req, res, next) => {
    try {
      const assessmentsRef = collection(db, "assessments");
      const q = query(assessmentsRef, where("isDisabled", "==", false));
      const snapshot = await getDocs(q);
      const assessments = snapshot.docs.map((doc) =>
        Assessment.fromFirestore(doc)
      );
      res.status(200).send(assessments);
    } catch (error) {
      res.status(500).send({
        message: {
          en: error.message,
          vi: "Đã xảy ra lỗi nội bộ.",
        },
      });
    }
  };

  // Get assessment by ID
  getById = async (req, res, next) => {
    const id = req.params.id;
    const assessment = req.vv;
    res.status(200).send({ id: id, ...assessment });
  };

  // Update assessment
  update = async (req, res, next) => {
    try {
      const id = req.params.id;
      const assessmentRef = doc(db, "assessments", id);
      const oldData = req.assessment;
      const {
        levelId,
        grade,
        type,
        question,
        option: textOption,
        answer: textAnswer,
        isDisabled,
      } = req.body;
      const updateData = {
        updatedAt: serverTimestamp(),
      };

      // Handle isDisabled-only update
      if (
        typeof isDisabled !== "undefined" &&
        !levelId &&
        !grade &&
        !type &&
        !question &&
        !textOption &&
        !textAnswer &&
        (!req.files || Object.keys(req.files).length === 0)
      ) {
        updateData.isDisabled = isDisabled === "true" || isDisabled === true;
      } else {
        let parsedType, parsedQuestion, parsedOption, parsedAnswer;

        // Parse type
        try {
          parsedType = type ? JSON.parse(type) : oldData.type;
        } catch (error) {
          return res
            .status(400)
            .send({ message: "Invalid JSON format for type!" });
        }

        // Parse question
        try {
          parsedQuestion = question ? JSON.parse(question) : oldData.question;
        } catch (error) {
          return res
            .status(400)
            .send({ message: "Invalid JSON format for question!" });
        }

        // Parse textOption and textAnswer
        try {
          parsedOption = textOption
            ? typeof textOption === "string" && textOption.startsWith("[")
              ? JSON.parse(textOption)
              : [textOption] // Treat as single-item array if plain text
            : null;
          parsedAnswer = textAnswer || null;
        } catch (error) {
          return res
            .status(400)
            .send({ message: "Invalid format for option or answer!" });
        }

        // Process file uploads and text inputs
        const {
          image,
          option: uploadedOption,
          answer: uploadedAnswer,
        } = await uploadMultipleFiles(
          req.files || {},
          parsedOption,
          parsedAnswer
        );

        // Determine final values for option and answer
        const finalOption =
          parsedOption && parsedOption.length > 0
            ? parsedOption // Prioritize text option if provided
            : uploadedOption && uploadedOption.length > 0
            ? uploadedOption
            : oldData.option;

        const finalAnswer =
          parsedAnswer !== null
            ? parsedAnswer // Prioritize text answer if provided
            : uploadedAnswer !== null
            ? uploadedAnswer
            : oldData.answer;

        const finalImage = image !== null ? image : oldData.image;

        // Build update data
        updateData.levelId = levelId || oldData.levelId;
        updateData.grade = grade ? parseInt(grade) : oldData.grade;
        updateData.type = parsedType;
        updateData.question = parsedQuestion;
        updateData.option = finalOption;
        updateData.answer = finalAnswer;
        updateData.image = finalImage;

        if (typeof isDisabled !== "undefined") {
          updateData.isDisabled = isDisabled === "true" || isDisabled === true;
        }
      }

      await updateDoc(assessmentRef, updateData);
      res.status(200).send({
        message: {
          en: "Assessment updated successfully!",
          vi: "Cập nhật bài kiểm tra đầu vào thành công!",
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
}

module.exports = new AssessmentController();
