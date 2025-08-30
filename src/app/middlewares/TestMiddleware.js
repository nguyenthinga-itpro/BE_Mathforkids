const {
  getFirestore,
  collection,
  doc,
  getDoc,
  serverTimestamp,
  query,
  where,
  Timestamp,
} = require("firebase/firestore");
const db = getFirestore();

class TestMiddleware {
  // Check test is already exist or not by ID
  checkTestExistById = (paramName = "id") => {
    return async (req, res, next) => {
      try {
        const testId = req.params[paramName];
        const testRef = doc(db, "tests", testId);
        const testSnap = await getDoc(testRef);

        if (!testSnap.exists()) {
          return res.status(404).json({
            message: {
              en: "Test not found!",
              vi: "Không tìm thấy bài kiểm tra!",
            },
          });
        }
        req.test = testSnap.data();
        return next();
      } catch (error) {
        return res.status(500).json({
          message: {
            en: error.message,
            vi: "Đã xảy ra lỗi nội bộ.",
          },
        });
      }
    };
  };
}

module.exports = new TestMiddleware();
