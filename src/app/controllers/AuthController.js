const User = require("../models/User");
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
  Timestamp,
  writeBatch,
  deleteField,
} = require("firebase/firestore");
const db = getFirestore();
const { smsService } = require("../services/SmsService");
const { mailService } = require("../services/MailService");
const jwt = require("jsonwebtoken");

// Create new OTP code
const generateOTPCode = () =>
  Math.floor(1000 + Math.random() * 9000).toString();

// Exchange date to timestamp
const convertToTimeStamp = (timePlus) => {
  const now = new Date();
  const expiration = new Date(now.getTime() + timePlus);
  return Timestamp.fromDate(expiration);
};

// Verify if OTP matches and if the OTP has expired
const verify = (user, otpCode) => {
  const error = new Error();
  const now = convertToTimeStamp(0);
  // Kiểm tra OTP có khớp không
  if (user.otpCode !== otpCode) {
    error.statusCode = 400;
    error.message = {
      en: "The OTP is incorrect. Please try again.",
      vi: "Mã OTP không chính xác. Vui lòng thử lại.",
    };
    throw error;
  } else if (now.toMillis() > user.otpExpiration.toMillis()) {
    // Kiểm tra thời gian hết hạn
    error.statusCode = 400;
    error.message = {
      en: "The OTP has expired. Please resend a new one.",
      vi: "Mã OTP đã hết hạn. Vui lòng gửi lại mã mới.",
    };
    throw error;
  }
};

// Update OTP when send OTP or verify successfully
const updateOTP = async (userId, otpCode, otpExpiration) => {
  const userRef = doc(db, "users", userId);
  await updateDoc(userRef, {
    otpCode,
    otpExpiration,
  });
};

class AuthController {
  // Send OTP by phone number
  sendOTPByPhoneNumber = async (req, res, next) => {
    try {
      const { phoneNumber } = req.params;
      const id = req.user.id || req.params.id;
      const otpCode = generateOTPCode();
      const otpExpiration = convertToTimeStamp(5 * 60 * 1000);
      await smsService(
        phoneNumber,
        `Your OTP is ${otpCode}. Please do not send this to anyone.`,
        2,
        "5087a0dcd4ccd3a2"
      );
      await updateOTP(id, otpCode, otpExpiration);
      return res.status(200).json({
        message: {
          en: "Send OTP successfully!",
          vi: "Gửi OTP thành công!",
        },
        userId: id,
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

  // Send OTP by email
  sendOTPByEmail = async (req, res, next) => {
    try {
      const { email } = req.params;
      console.log("email", email);
      const id = req.user.id || req.params.id;

      const otpCode = generateOTPCode();
      const otpExpiration = convertToTimeStamp(5 * 60 * 1000);
      await mailService(email, otpCode);
      await updateOTP(id, otpCode, otpExpiration);
      return res.status(200).json({
        message: {
          en: "Send OTP successfully!",
          vi: "Gửi OTP thành công!",
        },
        userId: id,
      });
    } catch (error) {
      console.error("LỖI GỬI EMAIL:", error);
      res.status(500).send({
        message: {
          en: error.message,
          vi: "Đã xảy ra lỗi nội bộ.",
        },
      });
    }
  };

  // Verify OTP
  verifyOTP = async (req, res, next) => {
    try {
      const { id } = req.params;
      const user = req.user;
      const { otpCode } = req.body;
      // Verify
      verify(user, otpCode);
      // Update OTP code
      await updateOTP(id, null, null);
      return res.status(200).json({
        message: {
          en: "Verify OTP successfully!",
          vi: "Xác minh OTP thành công!",
        },
      });
    } catch (error) {
      const status = error.statusCode || 500;
      return res.status(status).json({
        message: error.statusCode
          ? error.message
          : {
              en: error.message,
              vi: "Đã xảy ra lỗi nội bộ.",
            },
      });
    }
  };

  verifyOtpAndAuthenticate = async (req, res, next) => {
    try {
      const { id } = req.params;
      const user = req.user;
      const { otpCode } = req.body;

      // Verify OTP
      await verify(user, otpCode);

      // Update OTP code
      await updateOTP(id, null, null);

      // Gửi token về client
      const token = jwt.sign({ id: id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRE,
      });

      const options = {
        expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        httpOnly: true,
      };

      res
        .status(200)
        .cookie("token", token, options)
        .json({
          token,
          id: id,
          fullName: user.fullName,
          role: user.role,
          image: user.image || "",
          volume: user.volume,
          language: user.language,
          mode: user.mode,
        });
    } catch (error) {
      const status = error.statusCode || 500;
      return res.status(status).json({
        message: error.statusCode
          ? error.message
          : {
              en: error.message,
              vi: "Đã xảy ra lỗi nội bộ.",
            },
      });
    }
  };

  // Logout
  logout = async (req, res, next) => {
    try {
      res.cookie("token", "none", {
        expires: new Date(Date.now() + 10 * 1000),
        httpOnly: true,
      });
      return res.status(200).json({
        message: {
          en: "Logout successfully!",
          vi: "Đăng xuất thành công!",
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
}

module.exports = new AuthController();
