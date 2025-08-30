const {
  getFirestore,
  collection,
  doc,
  getDoc,
  getDocs,
  serverTimestamp,
  query,
  where,
  Timestamp,
} = require("firebase/firestore");
const db = getFirestore();

class AuthMiddleware {
  // Check if user role matches the required role
  checkRole = async (req, res, next) => {
    const { role } = req.query;
    const user = req.user;
    if (!role || user.role === role) return next();
    return res.status(403).json({
      message: {
        en: "Your account do not have permission to perform this action.",
        vi: "Tài khoản của bạn không có quyền thực hiện hành động này.",
      },
    });
  };
}

module.exports = new AuthMiddleware();
