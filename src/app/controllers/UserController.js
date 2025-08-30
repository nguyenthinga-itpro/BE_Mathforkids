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
  orderBy,
  limit,
  getCountFromServer,
  startAfter,
  Timestamp,
  writeBatch,
  deleteField,
} = require("firebase/firestore");
const db = getFirestore();
const { PutObjectCommand } = require("@aws-sdk/client-s3");
const { s3 } = require("../services/AwsService");
const { v4: uuidv4 } = require("uuid");
const FileController = require("./FileController"); // Đảm bảo path đúng

class UserController {
  countByDisabledStatus = async (req, res, next) => {
    try {
      const { isDisabled, role } = req.query;
      const q = query(
        collection(db, "users"),
        where("role", "==", role),
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

  countByRole = async (req, res, next) => {
    try {
      const { role } = req.query;
      const q = query(collection(db, "users"), where("role", "==", role));
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
  countByGender = async (req, res, next) => {
    try {
      const { gender } = req.query;
      const q = query(collection(db, "users"), where("gender", "==", gender));
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

  filterByDisabledStatus = async (req, res) => {
    try {
      const pageSize = parseInt(req.query.pageSize) || 10;
      const startAfterId = req.query.startAfterId || null;
      const { role, isDisabled } = req.query;
      let q;
      if (startAfterId) {
        const startDoc = await getDoc(doc(db, "users", startAfterId));
        q = query(
          collection(db, "users"),
          where("role", "==", role),
          where("isDisabled", "==", isDisabled === "true"),
          orderBy("createdAt", "desc"),
          startAfter(startDoc),
          limit(pageSize)
        );
      } else {
        q = query(
          collection(db, "users"),
          where("role", "==", role),
          where("isDisabled", "==", isDisabled === "true"),
          orderBy("createdAt", "desc"),
          limit(pageSize)
        );
      }

      const snapshot = await getDocs(q);
      const users = snapshot.docs.map((doc) => User.fromFirestore(doc));

      const lastVisible = snapshot.docs[snapshot.docs.length - 1];
      const lastVisibleId = lastVisible ? lastVisible.id : null;

      res.status(200).send({
        data: users,
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
  filterByRole = async (req, res) => {
    try {
      const pageSize = parseInt(req.query.pageSize) || 10;
      const startAfterId = req.query.startAfterId || null;
      const { role } = req.query;
      let q;
      if (startAfterId) {
        const startDoc = await getDoc(doc(db, "users", startAfterId));
        q = query(
          collection(db, "users"),
          where("role", "==", role),
          orderBy("createdAt", "desc"),
          startAfter(startDoc),
          limit(pageSize)
        );
      } else {
        q = query(
          collection(db, "users"),
          where("role", "==", role),
          orderBy("createdAt", "desc"),
          limit(pageSize)
        );
      }

      const snapshot = await getDocs(q);
      const users = snapshot.docs.map((doc) => User.fromFirestore(doc));

      const lastVisible = snapshot.docs[snapshot.docs.length - 1];
      const lastVisibleId = lastVisible ? lastVisible.id : null;

      res.status(200).send({
        data: users,
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

  countAll = async (req, res, next) => {
    try {
      const q = query(collection(db, "users"));
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

  countParents = async (req, res, next) => {
    try {
      const q = query(collection(db, "users"), where("role", "==", "user"));
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

  // Get all users
  getAll = async (req, res, next) => {
    try {
      const pageSize = parseInt(req.query.pageSize) || 10;
      const startAfterId = req.query.startAfterId || null;
      let q;
      if (startAfterId) {
        const startDocRef = doc(db, "users", startAfterId);
        const startDocSnap = await getDoc(startDocRef);

        if (!startDocSnap.exists()) {
          return res.status(400).send({ message: "Invalid startAfterId" });
        }

        q = query(
          collection(db, "users"),
          orderBy("createdAt", "desc"),
          startAfter(startDocSnap),
          limit(pageSize)
        );
      } else {
        q = query(
          collection(db, "users"),
          orderBy("createdAt", "desc"),
          limit(pageSize)
        );
      }

      const snapshot = await getDocs(q);
      const users = snapshot.docs.map((doc) => User.fromFirestore(doc));

      const lastVisible = snapshot.docs[snapshot.docs.length - 1];
      const lastVisibleId = lastVisible ? lastVisible.id : null;

      res.status(200).send({
        data: users,
        nextPageToken: lastVisibleId,
      });
    } catch (error) {
      res.status(500).send({ message: error.message });
    }
  };

  // Get an user by ID
  getById = async (req, res, next) => {
    const id = req.params.id;
    const user = req.user;
    res.status(200).send({ id: id, ...user });
  };

  // Count all exist user
  countUsers = async (req, res, next) => {
    try {
      const usersSnapshot = await getDocs(collection(db, "users"));
      const userCount = usersSnapshot.size;
      res.status(200).send({ count: userCount });
    } catch (error) {
      res.status(500).send({
        message: {
          en: error.message,
          vi: "Đã xảy ra lỗi nội bộ.",
        },
      });
    }
  };

  countUsersByWeek = async (req, res, next) => {
    try {
      const { startDate, endDate } = req.query;

      const start = new Date(startDate);
      const end = new Date(endDate);

      // 🟦 Hàm tạo danh sách các tháng trong khoảng start - end
      const getMonthKeys = (start, end) => {
        const keys = [];
        const current = new Date(start.getFullYear(), start.getMonth(), 1);

        while (current <= end) {
          const key = `${String(current.getMonth() + 1).padStart(
            2,
            "0"
          )}-${current.getFullYear()}`;
          keys.push(key);
          current.setMonth(current.getMonth() + 1);
        }

        return keys;
      };

      // 🟦 Tạo sẵn result với số tuần thực tế từng tháng
      const result = {};
      const monthKeys = getMonthKeys(start, end);
      monthKeys.forEach((key) => {
        const [monthStr, yearStr] = key.split("-");
        const month = parseInt(monthStr, 10) - 1; // 0-based
        const year = parseInt(yearStr, 10);

        const daysInMonth = new Date(year, month + 1, 0).getDate(); // số ngày trong tháng
        const weekCount = Math.ceil(daysInMonth / 7); // số tuần thực tế

        result[key] = Array(weekCount).fill(0);
      });

      // 🔍 Lấy dữ liệu user theo thời gian
      const usersSnapshot = await getDocs(
        query(
          collection(db, "users"),
          where("role", "==", "user"),
          where("createdAt", ">=", start),
          where("createdAt", "<", end)
        )
      );

      // 🟦 Duyệt qua từng user và cập nhật số lượng theo tuần
      usersSnapshot.forEach((docSnap) => {
        const data = docSnap.data();
        const createdAt = data.createdAt?.toDate?.();
        if (!createdAt) return;

        const m = createdAt.getMonth() + 1;
        const y = createdAt.getFullYear();
        const key = `${String(m).padStart(2, "0")}-${y}`;
        const day = createdAt.getDate();
        const weekIndex = Math.floor((day - 1) / 7); // 0-based

        if (result[key] && weekIndex < result[key].length) {
          result[key][weekIndex]++;
        }
      });

      // ✅ Trả dữ liệu
      res.status(200).send({ data: result });
    } catch (error) {
      res.status(400).send({
        message: {
          en: error.message,
          vi: "Đã xảy ra lỗi nội bộ.",
        },
      });
    }
  };

  // Count new users for the last 12 months (including current month)
  countUsersByMonth = async (req, res, next) => {
    try {
      const { startMonth, endMonth } = req.query;

      // ✅ Hàm tạo danh sách tháng trong khoảng
      const getMonthRange = (start, end) => {
        const startDate = new Date(start + "-01");
        const endDate = new Date(end + "-01");
        const months = [];

        while (startDate <= endDate) {
          months.push({
            year: startDate.getFullYear(),
            month: startDate.getMonth(), // 0-11
          });
          startDate.setMonth(startDate.getMonth() + 1);
        }

        return months;
      };

      const months = getMonthRange(startMonth, endMonth);
      const monthlyCounts = Array(months.length).fill(0);

      const usersSnapshot = await getDocs(
        query(collection(db, "users"), where("role", "==", "user"))
      );

      usersSnapshot.forEach((docSnap) => {
        const data = docSnap.data();
        if (data.createdAt && data.createdAt.toDate) {
          const createdAt = data.createdAt.toDate();
          const year = createdAt.getFullYear();
          const month = createdAt.getMonth();

          const index = months.findIndex(
            (m) => m.year === year && m.month === month
          );
          if (index !== -1) monthlyCounts[index]++;
        }
      });

      const result = months.map((m, i) => ({
        label: `${(m.month + 1).toString().padStart(2, "0")}-${m.year}`,
        total: monthlyCounts[i],
      }));

      res.status(200).send({ data: result });
    } catch (error) {
      res.status(500).send({
        message: {
          en: error.message,
          vi: "Đã xảy ra lỗi nội bộ.",
        },
      });
    }
  };

  countUsersByQuarter = async (req, res, next) => {
    try {
      const { startYear, endYear } = req.query;
      const fromYear = parseInt(startYear);
      const toYear = parseInt(endYear);

      const startDate = new Date(fromYear, 0, 1); // Jan 1 of startYear
      const endDate = new Date(toYear + 1, 0, 1); // Jan 1 of next year

      const result = {}; // { "Q1": 0, ... } or { "Q1-2024": 0, ... }

      // 🟦 Tạo các key theo từng quý
      for (let y = fromYear; y <= toYear; y++) {
        for (let q = 1; q <= 4; q++) {
          const label = `Q${q}-${y}`;
          result[label] = 0;
        }
      }

      // 🔍 Query user theo thời gian
      const usersSnapshot = await getDocs(
        query(
          collection(db, "users"),
          where("role", "==", "user"),
          where("createdAt", ">=", startDate),
          where("createdAt", "<", endDate)
        )
      );

      // 🟦 Đếm số lượng theo quý
      usersSnapshot.forEach((docSnap) => {
        const createdAt = docSnap.data().createdAt?.toDate?.();
        if (!createdAt) return;

        const year = createdAt.getFullYear();
        const month = createdAt.getMonth(); // 0–11
        const quarter = Math.floor(month / 3) + 1; // 1–4
        const label = `Q${quarter}-${year}`;

        if (result[label] !== undefined) {
          result[label]++;
        }
      });

      // 🟩 Format dữ liệu trả về dạng mảng: [{ label, total }]
      const data = Object.entries(result).map(([label, total]) => ({
        label,
        total,
      }));

      res.status(200).send({ data });
    } catch (error) {
      res.status(500).send({
        message: {
          en: error.message,
          vi: "Đã xảy ra lỗi nội bộ.",
        },
      });
    }
  };

  countUsersBySeason = async (req, res, next) => {
    try {
      const { startYear, endYear } = req.query;
      const fromYear = parseInt(startYear);
      const toYear = parseInt(endYear);

      const startDate = new Date(fromYear, 0, 1); // Jan 1 of startYear
      const endDate = new Date(toYear + 1, 0, 1); // Jan 1 of next year

      const result = {};

      // 🟦 Tạo các key theo từng mùa
      for (let y = fromYear; y <= toYear; y++) {
        let label;
        for (let q = 1; q <= 3; q++) {
          if (q == 1) label = `spring-${y}`;
          else if (q == 2) label = `summer-${y}`;
          else label = `autumn_winter-${y}`;
          result[label] = 0;
        }
      }

      // 🔍 Query user theo thời gian
      const usersSnapshot = await getDocs(
        query(
          collection(db, "users"),
          where("role", "==", "user"),
          where("createdAt", ">=", startDate),
          where("createdAt", "<", endDate)
        )
      );

      // 🟦 Đếm số lượng theo quý
      usersSnapshot.forEach((docSnap) => {
        const createdAt = docSnap.data().createdAt?.toDate?.();
        if (!createdAt) return;

        const year = createdAt.getFullYear();
        const month = createdAt.getMonth(); // 0–11
        const quarter = Math.floor(month / 4) + 1; // 1–3
        let label;
        if (quarter == 1) label = `spring-${year}`;
        else if (quarter == 2) label = `summer-${year}`;
        else label = `autumn_winter-${year}`;

        if (result[label] !== undefined) {
          result[label]++;
        }
      });

      // 🟩 Format dữ liệu trả về dạng mảng: [{ label, total }]
      const data = Object.entries(result).map(([label, total]) => ({
        label,
        total,
      }));

      res.status(200).send({ data });
    } catch (error) {
      res.status(500).send({
        message: {
          en: error.message,
          vi: "Đã xảy ra lỗi nội bộ.",
        },
      });
    }
  };

  // Count new users by year
  countUsersByYear = async (req, res, next) => {
    try {
      const { startYear, endYear } = req.query;

      const start = parseInt(startYear);
      const end = parseInt(endYear);

      const startDate = new Date(`${start}-01-01`);
      const endDate = new Date(`${end + 1}-01-01`);

      const usersSnapshot = await getDocs(
        query(
          collection(db, "users"),
          where("role", "==", "user"),
          where("createdAt", ">=", startDate),
          where("createdAt", "<", endDate)
        )
      );

      const yearlyCounts = Array(end - start + 1).fill(0);

      usersSnapshot.forEach((docSnap) => {
        const createdAt = docSnap.data()?.createdAt?.toDate?.();
        if (createdAt) {
          const year = createdAt.getFullYear();
          const index = year - start;
          if (index >= 0 && index < yearlyCounts.length) {
            yearlyCounts[index]++;
          }
        }
      });

      const result = yearlyCounts.map((count, i) => ({
        label: `${start + i}`,
        total: count,
      }));

      res.status(200).send({ data: result });
    } catch (error) {
      res.status(500).send({
        message: {
          en: error.message,
          vi: "Đã xảy ra lỗi nội bộ.",
        },
      });
    }
  };

  // Create user
  create = async (req, res, next) => {
    try {
      const data = req.body;
      const date = new Date(data.dateOfBirth);
      const dateOfBirthTimestamp = Timestamp.fromDate(date);
      const userData = {
        ...data,
        email: data.email ? data.email.toLowerCase() : "",
        dateOfBirth: dateOfBirthTimestamp,
        role: data.role ? data.role : "user",
        isVerify: data.isVerify ? true : false,
        otpCode: null,
        otpExpiration: null,
        volume: 100,
        language: "en",
        mode: "light",
        isDisabled: false,
        image: "",
        createdAt: serverTimestamp(),
      };

      const docRef = await addDoc(collection(db, "users"), userData);

      res.status(201).send({
        message: {
          en: "User created successfully!",
          vi: "Tạo người dùng thành công!",
        },
        id: docRef.id,
        phoneNumber: userData.phoneNumber,
        role: userData.role,
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

  // Update user
  update = async (req, res, next) => {
    try {
      const id = req.params.id;
      const { isDisabled, createdAt, dateOfBirth, ...data } = req.body;

      const updateData = {
        ...data,
        updatedAt: serverTimestamp(),
      };
      if (dateOfBirth) {
        const date = new Date(dateOfBirth);
        if (!isNaN(date)) {
          updateData.dateOfBirth = Timestamp.fromDate(date);
        } else {
          throw new Error("Invalid dateOfBirth format");
        }
      }
      // If only isDisabled is provided, update only that field
      if (
        isDisabled !== undefined &&
        Object.keys(data).length === 0 &&
        !dateOfBirth
      ) {
        updateData.isDisabled = isDisabled;
      }
      const userRef = doc(db, "users", id);
      await updateDoc(userRef, updateData);
      res.status(200).send({
        message: {
          en: "Profile information updated successfully!",
          vi: "Cập nhật thông tin hồ sơ thành công!",
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

  // Update image profile
  // uploadImageProfileToS3 = async (req, res, next) => {
  //   try {
  //     const id = req.params.id;
  //     const file = req.file;

  //     if (!file || !file.buffer) {
  //       return res.status(400).json({ message: "No file uploaded" });
  //     }

  //     const fileExt = file.originalname.split(".").pop();
  //     const key = `image_profile/${id}_${uuidv4()}.${fileExt}`;

  //     const command = new PutObjectCommand({
  //       Bucket: process.env.S3_BUCKET_NAME,
  //       Key: key,
  //       Body: file.buffer,
  //       ContentType: file.mimetype,
  //       ACL: "public-read",
  //     });

  //     await s3.send(command);

  //     const publicUrl = `https://${process.env.S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;

  //     const userRef = doc(db, "users", id);
  //     await updateDoc(userRef, {
  //       image: publicUrl,
  //       updatedAt: serverTimestamp(),
  //     });

  //     res.status(200).json({
  //       message: {
  //         en: "Image profile uploaded successfully!",
  //         vi: "Cập nhật ảnh hồ sơ thành công!",
  //       },
  //       image: publicUrl,
  //     });
  //   } catch (error) {
  //     console.error("S3 upload error:", error);
  //     res.status(500).json({
  //       message: {
  //         en: "Upload failed: " + error.message,
  //         vi: "Đẩy ảnh lên S3 không thành công!",
  //       },
  //     });
  //   }
  // };
  uploadImageProfileToS3 = async (req, res) => {
    try {
      const { id } = req.params;
      const file = req.file;

      if (!id) {
        return res.status(400).send({ message: "Missing user ID." });
      }

      if (!file || !file.buffer) {
        return res.status(400).send({ message: "No file uploaded." });
      }
      const fileExt = file.originalname.split(".").pop();
      const fileKey = `image_profile/${id}_${uuidv4()}.${fileExt}`;
      await FileController.uploadFile(file, fileKey);
      const imageUrl = `${process.env.CLOUD_FRONT}${fileKey}`;
      const userRef = doc(db, "users", id);
      await updateDoc(userRef, {
        image: imageUrl,
        updatedAt: serverTimestamp(),
      });
      return res.status(200).send({
        message: {
          en: "Profile image uploaded successfully!",
          vi: "Cập nhật ảnh hồ sơ thành công!",
        },
        image: imageUrl,
      });
    } catch (error) {
      console.error("Upload image profile error:", error);
      return res.status(500).send({
        message: {
          en: error.message || "Upload failed.",
          vi: "Đã xảy ra lỗi khi cập nhật ảnh hồ sơ.",
        },
      });
    }
  };
}

module.exports = new UserController();
