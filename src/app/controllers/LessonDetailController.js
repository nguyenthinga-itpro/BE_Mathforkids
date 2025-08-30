const {
  getFirestore,
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  updateDoc,
  serverTimestamp,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  getCountFromServer,
} = require("firebase/firestore");

const LessonDetail = require("../models/LessonDetail");
const db = getFirestore();
const { uploadMultipleFiles } = require("./FileController");

class LessonDetailController {
  static fromFirestore(doc) {
    const data = doc.data();
    return {
      id: doc.id,
      lessonId: data.lessonId,
      order: data.order,
      title: data.title,
      content: data.content,
      image: data.image || null,
      isDisabled: data.isDisabled ?? false,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    };
  }
  // Create a lesson detail
  create = async (req, res) => {
    try {
      const { lessonId, order, title, content } = req.body;
      if (!lessonId || !order || !title || !content) {
        return res.status(400).send({ message: "Missing required fields." });
      }
      let uploadedFiles = {};
      if (req.files && Object.keys(req.files).length > 0) {
        uploadedFiles = await uploadMultipleFiles(req.files);
      }
      const image = uploadedFiles["image"] || null;
      const parsedTitle = typeof title === "string" ? JSON.parse(title) : title;
      const parsedContent =
        typeof content === "string" ? JSON.parse(content) : content;
      await addDoc(collection(db, "lesson_details"), {
        lessonId,
        order: Number(order),
        title: parsedTitle,
        content: parsedContent,
        image,
        isDisabled: false,
        createdAt: serverTimestamp(),
      });
      res.status(201).send({
        message: {
          en: "Lesson detail created successfully!",
          vi: "Tạo chi tiết bài học thành công!",
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

  // Create full lesson details (Define, Example, Remember)
  createFullLesson = async (req, res) => {
    try {
      console.log("Dữ liệu nhận được:", {
        body: req.body,
        files: Object.keys(req.files || {}),
      });
      const { lessonId, contents } = req.body;

      // Kiểm tra các trường bắt buộc
      if (!lessonId || !contents) {
        console.error("Lỗi: Thiếu lessonId hoặc contents", {
          lessonId,
          contents,
        });
        return res
          .status(400)
          .send({ message: "Thiếu lessonId hoặc contents." });
      }

      // Parse contents
      let parsedContents;
      try {
        parsedContents =
          typeof contents === "string" ? JSON.parse(contents) : contents;
        console.log("Parsed contents:", parsedContents);
        if (
          !parsedContents.define ||
          !parsedContents.example ||
          !parsedContents.remember
        ) {
          console.error(
            "Lỗi: Contents thiếu define, example hoặc remember",
            parsedContents
          );
          return res
            .status(400)
            .send({ message: "Contents thiếu define, example hoặc remember." });
        }
      } catch (error) {
        console.error("Lỗi khi parse contents:", error);
        return res
          .status(400)
          .send({ message: "Dữ liệu contents không hợp lệ: " + error.message });
      }

      // Xử lý file upload
      let uploadedFiles = {};
      if (req.files && Object.keys(req.files).length > 0) {
        try {
          uploadedFiles = await uploadMultipleFiles(req.files);
          console.log("File đã upload:", uploadedFiles);
        } catch (error) {
          console.error("Lỗi khi upload file:", error);
          return res.status(400).send({
            message: {
              en: "Upload file fail: " + error.message,
              vi: "Lỗi khi upload file.",
            },
          });
        }
      }

      const baseData = {
        lessonId,
        isDisabled: false,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };
      const collectionRef = collection(db, "lesson_details");

      // Tạo 3 bản ghi
      await Promise.all([
        addDoc(collectionRef, {
          ...baseData,
          order: 1,
          title: { vi: "Định nghĩa", en: "Define" },
          content: parsedContents.define,
          image: uploadedFiles.define || null,
        }).catch((err) => {
          console.error("Lỗi khi thêm Define:", err);
          throw err;
        }),
        addDoc(collectionRef, {
          ...baseData,
          order: 2,
          title: { vi: "Bài tập", en: "Example" },
          content: parsedContents.example,
          image: uploadedFiles.example || null,
        }).catch((err) => {
          console.error("Lỗi khi thêm Example:", err);
          throw err;
        }),
        addDoc(collectionRef, {
          ...baseData,
          order: 3,
          title: { vi: "Ghi nhớ", en: "Remember" },
          content: parsedContents.remember,
          image: uploadedFiles.remember || null,
        }).catch((err) => {
          console.error("Lỗi khi thêm Remember:", err);
          throw err;
        }),
      ]);

      res.status(200).send({
        message: {
          en: "Full lesson details created successfully!",
          vi: "Tạo toàn bộ chi tiết bài học thành công!",
        },
      });
    } catch (error) {
      console.error("Lỗi trong createFullLesson:", error);
      res.status(500).send({
        message: {
          en: `Fail when create full lesson details: ${error.message}`,
          vi: "Lỗi khi tạo toàn bộ chi tiết bài học.",
        },
      });
    }
  };

  // Count all lesson details by lesson ID
  countByLesson = async (req, res, next) => {
    try {
      const { lessonId } = req.params;
      const q = query(
        collection(db, "lesson_details"),
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

  // Get all paginated lesson details by lesson ID
  getByLesson = async (req, res) => {
    try {
      const pageSize = parseInt(req.query.pageSize); // số bài học mỗi trang
      const startAfterId = req.query.startAfterId || null; // ID của document bắt đầu sau đó
      const { lessonId } = req.params;
      let q;
      if (startAfterId) {
        const startDoc = await getDoc(doc(db, "lesson_details", startAfterId));
        q = query(
          collection(db, "lesson_details"),
          where("lessonId", "==", lessonId),
          orderBy("order"),
          startAfter(startDoc),
          limit(pageSize)
        );
      } else {
        q = query(
          collection(db, "lesson_details"),
          where("lessonId", "==", lessonId),
          orderBy("order"),
          limit(pageSize)
        );
      }
      const snapshot = await getDocs(q);
      const lessonDetails = snapshot.docs.map((doc) =>
        LessonDetail.fromFirestore(doc)
      );

      const lastVisible = snapshot.docs[snapshot.docs.length - 1];
      const lastVisibleId = lastVisible ? lastVisible.id : null;

      res.status(200).send({
        data: lessonDetails,
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

  // Count all lesson details by lesson ID & disabled state
  countByLessonAndDisabledState = async (req, res, next) => {
    try {
      const { lessonId } = req.params;
      const { isDisabled } = req.query;
      const q = query(
        collection(db, "lesson_details"),
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

  // Filter all paginated lesson details by lesson ID & disabled state
  filterByLessonAndDisabledState = async (req, res) => {
    try {
      const pageSize = parseInt(req.query.pageSize) || 10; // số bài học mỗi trang
      const startAfterId = req.query.startAfterId || null; // ID của document bắt đầu sau đó
      const { lessonId } = req.params;
      const { isDisabled } = req.query;
      let q;
      if (startAfterId) {
        const startDoc = await getDoc(doc(db, "lesson_details", startAfterId));
        q = query(
          collection(db, "lesson_details"),
          where("lessonId", "==", lessonId),
          where("isDisabled", "==", isDisabled === "true"),
          orderBy("order"),
          startAfter(startDoc),
          limit(pageSize)
        );
      } else {
        q = query(
          collection(db, "lesson_details"),
          where("lessonId", "==", lessonId),
          where("isDisabled", "==", isDisabled === "true"),
          orderBy("order"),
          limit(pageSize)
        );
      }
      const snapshot = await getDocs(q);
      const lessonDetails = snapshot.docs.map((doc) =>
        LessonDetail.fromFirestore(doc)
      );

      const lastVisible = snapshot.docs[snapshot.docs.length - 1];
      const lastVisibleId = lastVisible ? lastVisible.id : null;

      res.status(200).send({
        data: lessonDetails,
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

  // Get enable lesson details by lesson ID
  getEnabledByLesson = async (req, res) => {
    try {
      const { lessonId } = req.params;
      const q = query(
        collection(db, "lesson_details"),
        where("lessonId", "==", lessonId),
        where("isDisabled", "==", false)
      );
      const snapshot = await getDocs(q);
      const list = snapshot.docs
        .map((doc) => LessonDetail.fromFirestore(doc))
        .sort((a, b) => a.order - b.order);
      res.status(200).send(list);
    } catch (error) {
      res.status(500).send({
        message: {
          en: error.message,
          vi: "Đã xảy ra lỗi nội bộ.",
        },
      });
    }
  };

  // Get a lesson detail by ID
  getById = async (req, res) => {
    const id = req.params.id;
    const lessonDetail = req.lessonDetail;
    res.status(200).send({ id: id, ...lessonDetail });
  };

  // Update lesson detail
  update = async (req, res) => {
    try {
      const { id } = req.params;
      if (!id) return res.status(400).send({ message: "Missing ID." });

      const docRef = doc(db, "lesson_details", id);
      const { title, content, order, ...rest } = req.body;
      const parsedTitle = typeof title === "string" ? JSON.parse(title) : title;
      const parsedContent =
        typeof content === "string" ? JSON.parse(content) : content;
      let uploadedFiles = {};
      if (req.files && Object.keys(req.files).length > 0) {
        uploadedFiles = await uploadMultipleFiles(req.files);
      }
      const image = uploadedFiles["image"] || null;
      await updateDoc(docRef, {
        ...rest,
        ...(order && { order: Number(order) }),
        ...(parsedTitle && { title: parsedTitle }),
        ...(parsedContent && { content: parsedContent }),
        ...(image && { image }),
        updatedAt: serverTimestamp(),
      });

      res.status(200).send({
        message: {
          en: "Lesson detail updated successfully!",
          vi: "Cập nhật chi tiết bài học thành công!",
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
module.exports = new LessonDetailController();
