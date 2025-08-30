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

const queryPhoneNumber = async (phoneNumber) => {
  const q = query(
    collection(db, "users"),
    where("phoneNumber", "==", phoneNumber.trim())
  );
  const querySnapshot = await getDocs(q);
  return querySnapshot;
};

const queryEmail = async (email) => {
  const q = query(
    collection(db, "users"),
    where("email", "==", email.trim().toLowerCase())
  );
  const querySnapshot = await getDocs(q);
  return querySnapshot;
};

class UserMiddleware {
  // When create user, check phone number is already exist or not
  checkPhoneExistForCreate = async (req, res, next) => {
    try {
      const { phoneNumber } = req.body;
      const querySnapshot = await queryPhoneNumber(phoneNumber);
      if (!querySnapshot.empty)
        return res.status(409).json({
          message: {
            en: "This phone number is already registered.",
            vi: "Số điện thoại này đã được đăng ký.",
          },
        });
      return next();
    } catch (error) {
      console.error(error);
      return res.status(500).json({
        message: {
          en: error.message,
          vi: "Đã xảy ra lỗi nội bộ.",
        },
      });
    }
  };

  // When create user, check email is already exist or not
  checkEmailExistForCreate = async (req, res, next) => {
    try {
      const { email } = req.body;
      const querySnapshot = await queryEmail(email);
      if (!querySnapshot.empty)
        return res.status(409).json({
          message: {
            en: "This email is already registered.",
            vi: "Email này đã được đăng ký.",
          },
        });
      return next();
    } catch (error) {
      console.error(error);
      return res.status(500).json({
        message: {
          en: error.message,
          vi: "Đã xảy ra lỗi nội bộ.",
        },
      });
    }
  };

  // Check user is already exist or not by phone number
  checkUserExistByPhone = async (req, res, next) => {
    try {
      const { phoneNumber } = req.params;
      const { role } = req.query;
      const querySnapshot = await queryPhoneNumber(phoneNumber);
      if (querySnapshot.empty)
        return res.status(404).json({
          message: {
            en:
              role === "admin"
                ? "Phone number does not exist in system."
                : "Phone number does not exist. Please register an account before logging in.",
            vi:
              role === "admin"
                ? "Số điện thoại không tồn tại trong hệ thống."
                : "Số điện thoại không tồn tại. Vui lòng đăng ký tài khoản trước khi đăng nhập.",
          },
        });
      req.user = {
        id: querySnapshot.docs[0].id,
        ...querySnapshot.docs[0].data(),
      };
      return next();
    } catch (error) {
      console.error(error);
      return res.status(500).json({
        message: {
          en: error.message,
          vi: "Đã xảy ra lỗi nội bộ.",
        },
      });
    }
  };

  // Check user is already exist or not by email
  checkUserExistByEmail = async (req, res, next) => {
    try {
      const { email } = req.params;
      const { role } = req.query;
      const querySnapshot = await queryEmail(email);
      if (querySnapshot.empty)
        return res.status(404).json({
          message: {
            en:
              role === "admin"
                ? "Email does not exist in system."
                : "Email does not exist. Please register an account before logging in.",
            vi:
              role === "admin"
                ? "Email không tồn tại trong hệ thống."
                : "Email không tồn tại. Vui lòng đăng ký tài khoản trước khi đăng nhập.",
          },
        });
      req.user = {
        id: querySnapshot.docs[0].id,
        ...querySnapshot.docs[0].data(),
      };
      return next();
    } catch (error) {
      console.error(error);
      return res.status(500).json({
        message: {
          en: error.message,
          vi: "Đã xảy ra lỗi nội bộ.",
        },
      });
    }
  };

  // Check user is already exist or not by ID
  checkUserExistById = (paramName = "id") => {
    return async (req, res, next) => {
      try {
        const userId = req.params[paramName];
        const userRef = doc(db, "users", userId);
        const userSnap = await getDoc(userRef);

        if (!userSnap.exists()) {
          return res.status(404).json({
            message: {
              en: "User not found!",
              vi: "Không tìm thấy người dùng!",
            },
          });
        }
        req.user = userSnap.data();
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

  // When update phone number, check new phone is already exist or not
  checkPhoneExistForUpdate = async (req, res, next) => {
    try {
      const id = req.params.id;
      const { newPhoneNumber } = req.body;
      const querySnapshot = await queryPhoneNumber(newPhoneNumber);
      const conflict = querySnapshot.docs.find((doc) => doc.id !== id);
      if (conflict)
        return res.status(409).json({
          message: {
            en: "This phone number is already used by another account.",
            vi: "Số điện thoại này đã được sử dụng bởi tài khoản khác.",
          },
        });
      req.body = {
        phoneNumber: newPhoneNumber.trim(),
      };
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

  // When update email, check new email is already exist or not
  checkEmailExistForUpdate = async (req, res, next) => {
    try {
      const id = req.params.id;
      const { newEmail } = req.body;
      console.log("newEmail", newEmail);
      const querySnapshot = await queryEmail(newEmail);
      const conflict = querySnapshot.docs.find((doc) => doc.id !== id);
      if (conflict)
        return res.status(409).json({
          message: {
            en: "This email is already used by another account.",
            vi: "Email này đã được sử dụng bởi tài khoản khác.",
          },
        });
      req.body = {
        email: newEmail.trim().toLowerCase(),
      };
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

  // When update pin, check if oldPin field is similar to the PIN of the user
  checkPin = async (req, res, next) => {
    try {
      const user = req.user;
      const { oldPin, newPin } = req.body;
      if (oldPin == user.pin) {
        req.body = {
          pin: newPin,
        };
        return next();
      }
      return res.status(400).json({
        message: {
          en: "That is not the correct PIN. Please try again.",
          vi: "Mã PIN không đúng. Vui lòng thử lại.",
        },
      });
    } catch (error) {
      return res.status(500).json({
        message: {
          en: error.message,
          vi: "Đã xảy ra lỗi nội bộ.",
        },
      });
    }
  };

  // Check account is verified or not
  checkIsVerify = async (req, res, next) => {
    const user = req.user;
    if (user.isVerify) return next();
    return res.status(403).json({
      message: {
        en: "Your account has not been verified. Please verify your account to continue.",
        vi: "Tài khoản của bạn chưa được xác minh. Vui lòng xác minh để tiếp tục.",
      },
    });
  };

  // Check account is disabled or not
  checkIsDisabled = async (req, res, next) => {
    const user = req.user;
    if (!user.isDisabled) return next();
    return res.status(403).json({
      message: {
        en: "This account has been disabled. Please contact support for assistance.",
        vi: "Tài khoản này đã bị vô hiệu hóa. Vui lòng liên hệ bộ phận hỗ trợ để được trợ giúp.",
      },
    });
  };
}

module.exports = new UserMiddleware();
