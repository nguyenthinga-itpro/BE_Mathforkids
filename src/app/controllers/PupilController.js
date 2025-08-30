const Pupil = require("../models/Pupil");
const {
  getFirestore,
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  updateDoc,
  orderBy,
  limit,
  startAfter,
  serverTimestamp,
  getCountFromServer,
  query,
  where,
  Timestamp,
} = require("firebase/firestore");
const db = getFirestore();
const { PutObjectCommand } = require("@aws-sdk/client-s3");
const { s3 } = require("../services/AwsService");
const { v4: uuidv4 } = require("uuid");
const FileController = require("./FileController");
class PupilController {
  countByGrade = async (req, res, next) => {
    try {
      const { grade } = req.query;
      const q = query(collection(db, "pupils"), where("grade", "==", grade));
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
  filterByGrade = async (req, res) => {
    try {
      const pageSize = parseInt(req.query.pageSize) || 10;
      const startAfterId = req.query.startAfterId || null;
      const { grade } = req.query;

      let q;

      if (startAfterId) {
        const startDoc = await getDoc(doc(db, "pupils", startAfterId));
        q = query(
          collection(db, "pupils"),
          where("grade", "==", parseInt(grade)),
          orderBy("createdAt", "desc"),
          startAfter(startDoc),
          limit(pageSize)
        );
      } else {
        q = query(
          collection(db, "pupils"),
          where("grade", "==", parseInt(grade)),
          orderBy("createdAt", "desc"),
          limit(pageSize)
        );
      }

      const snapshot = await getDocs(q);
      const pupils = snapshot.docs.map((doc) => Pupil.fromFirestore(doc));
      const lastVisible = snapshot.docs[snapshot.docs.length - 1];
      const lastVisibleId = lastVisible ? lastVisible.id : null;
      res.status(200).send({
        data: pupils,
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

  countByGradeAndDisabledStatus = async (req, res, next) => {
    try {
      const { grade, isDisabled } = req.query;
      const q = query(
        collection(db, "pupils"),
        where("grade", "==", parseInt(grade)),
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

  filterByGradeAndDisabledStatus = async (req, res) => {
    try {
      const pageSize = parseInt(req.query.pageSize) || 10;
      const startAfterId = req.query.startAfterId || null;
      const { grade, isDisabled } = req.query;

      let q;

      if (startAfterId) {
        const startDoc = await getDoc(doc(db, "pupils", startAfterId));
        q = query(
          collection(db, "pupils"),
          where("grade", "==", parseInt(grade)),
          where("isDisabled", "==", isDisabled === "true"),
          orderBy("createdAt", "desc"),
          startAfter(startDoc),
          limit(pageSize)
        );
      } else {
        q = query(
          collection(db, "pupils"),
          where("grade", "==", parseInt(grade)),
          where("isDisabled", "==", isDisabled === "true"),
          limit(pageSize)
        );
      }

      const snapshot = await getDocs(q);
      const pupils = snapshot.docs.map((doc) => Pupil.fromFirestore(doc));
      const lastVisible = snapshot.docs[snapshot.docs.length - 1];
      const lastVisibleId = lastVisible ? lastVisible.id : null;

      res.status(200).send({
        data: pupils,
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

  countByDisabledStatus = async (req, res, next) => {
    try {
      const { isDisabled } = req.query;
      const q = query(
        collection(db, "pupils"),
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

  filterByDisabledStatus = async (req, res) => {
    try {
      const pageSize = parseInt(req.query.pageSize) || 10;
      const startAfterId = req.query.startAfterId || null;
      const { isDisabled } = req.query;

      let q;

      if (startAfterId) {
        const startDoc = await getDoc(doc(db, "pupils", startAfterId));
        q = query(
          collection(db, "pupils"),
          where("isDisabled", "==", isDisabled === "true"),
          orderBy("createdAt", "desc"),
          startAfter(startDoc),
          limit(pageSize)
        );
      } else {
        q = query(
          collection(db, "pupils"),
          where("isDisabled", "==", isDisabled === "true"),
          orderBy("createdAt", "desc"),
          limit(pageSize)
        );
      }

      const snapshot = await getDocs(q);
      const pupils = snapshot.docs.map((doc) => Pupil.fromFirestore(doc));
      const lastVisible = snapshot.docs[snapshot.docs.length - 1];
      const lastVisibleId = lastVisible ? lastVisible.id : null;

      res.status(200).send({
        data: pupils,
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

  // Create pupil
  create = async (req, res, next) => {
    try {
      const data = req.body;
      const date = new Date(data.dateOfBirth);
      const dateOfBirthTimestamp = Timestamp.fromDate(date);
      const pupilRef = await addDoc(collection(db, "pupils"), {
        ...data,
        dateOfBirth: dateOfBirthTimestamp,
        isDisabled: false,
        isAssess: false,
        volume: 100,
        language: "en",
        mode: "light",
        point: 0,
        theme: "theme1",
        createdAt: serverTimestamp(),
      });

      // Fetch all lesson IDs from the lessons collection
      const lessonsSnapshot = await getDocs(collection(db, "lessons"));
      const lessonIds = lessonsSnapshot.docs.map((doc) => doc.id);

      // Create completed lesson records for the pupil
      const completedLessonsPromises = lessonIds.map((lessonId) =>
        addDoc(collection(db, "completed_lessons"), {
          pupilId: pupilRef.id,
          lessonId,
          isCompleted: false,
          isBlock: true,
          isDisabled: false,
          createdAt: serverTimestamp(),
        })
      );

      // Execute all completed lesson creations
      await Promise.all(completedLessonsPromises);

      res.status(201).send({
        message: {
          en: "Pupil created successfully!",
          vi: "Tạo học sinh thành công!",
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

  countAll = async (req, res, next) => {
    try {
      const q = query(collection(db, "pupils"));
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

  // Get all pupils
  getAll = async (req, res, next) => {
    try {
      const pageSize = parseInt(req.query.pageSize) || 10;
      const startAfterId = req.query.startAfterId || null;

      let q;

      if (startAfterId) {
        const startDocRef = doc(db, "pupils", startAfterId);
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
          collection(db, "pupils"),
          orderBy("createdAt", "desc"),
          startAfter(startDocSnap),
          limit(pageSize)
        );
      } else {
        q = query(
          collection(db, "pupils"),
          orderBy("createdAt", "desc"),
          limit(pageSize)
        );
      }

      const snapshot = await getDocs(q);
      const pupilArray = snapshot.docs.map((doc) => Pupil.fromFirestore(doc));

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

  // Get a pupil by ID
  getById = async (req, res, next) => {
    const id = req.params.id;
    const pupil = req.pupil;
    res.status(200).send({ id: id, ...pupil });
  };

  // Get enabled pupils by user ID
  getEnabledPupilByUserId = async (req, res) => {
    try {
      const userId = req.params.userId;
      const pupilsRef = collection(db, "pupils");
      const q = query(
        pupilsRef,
        where("userId", "==", userId),
        where("isDisabled", "==", false)
      );
      const snapshot = await getDocs(q);
      const pupils = snapshot.docs.map((doc) => Pupil.fromFirestore(doc));
      res.status(200).send(pupils);
    } catch (error) {
      res.status(500).send({
        message: {
          en: error.message,
          vi: "Đã xảy ra lỗi nội bộ.",
        },
      });
    }
  };

  // Update pupil information
update = async (req, res, next) => {
  try {
    const id = req.params.id;
    const { isDisabled, createdAt, dateOfBirth, ...data } = req.body;

    console.log("Received ID:", id);
    console.log("Received body:", req.body);

    const updateData = {
      ...data,
      updatedAt: serverTimestamp(),
    };

    if (dateOfBirth) {
      const date = new Date(dateOfBirth);
      console.log("Parsed dateOfBirth:", date);

      if (!isNaN(date)) {
        updateData.dateOfBirth = Timestamp.fromDate(date);
      } else {
        throw new Error("Invalid dateOfBirth format");
      }
    }

    if (
      isDisabled !== undefined &&
      Object.keys(data).length === 0 &&
      !dateOfBirth
    ) {
      updateData.isDisabled = isDisabled;
    }

    console.log("Data to be updated:", updateData);

    const pupilRef = doc(db, "pupils", id);
    console.log("Updating document with ID:", id);

    await updateDoc(pupilRef, updateData);

    console.log("Update successful!");

    res.status(200).send({
      message: {
        en: "Profile information updated successfully!",
        vi: "Cập nhật thông tin hồ sơ thành công!",
      },
    });
  } catch (error) {
    console.error("Update profile error:", error);

    res.status(500).send({
      message: {
        en: error.message,
        vi: "Đã xảy ra lỗi nội bộ.",
      },
    });
  }
};


  // Count all pupils
  countPupils = async (req, res, next) => {
    try {
      const pupilSnapshot = await getDocs(collection(db, "pupils"));
      const pupilCount = pupilSnapshot.size;
      res.status(200).send({ count: pupilCount });
    } catch (error) {
      res.status(500).send({
        message: {
          en: error.message,
          vi: "Đã xảy ra lỗi nội bộ.",
        },
      });
    }
  };

  // Count pupils by grade
  // countPupilsByGrade = async (req, res, next) => {
  //   try {
  //     const snapshot = await getDocs(collection(db, "pupils"));
  //     const gradeCounts = {};

  //     // Duyệt qua các document và đếm theo grade
  //     snapshot.docs.forEach((doc) => {
  //       const pupil = Pupil.fromFirestore(doc);
  //       const grade = pupil.grade;
  //       if (grade) {
  //         gradeCounts[grade] = (gradeCounts[grade] || 0) + 1;
  //       }
  //     });

  //     // Chuyển object thành mảng để trả về kết quả
  //     const result = Object.keys(gradeCounts).map((grade) => ({
  //       grade,
  //       total: gradeCounts[grade],
  //     }));

  //     res.status(200).send(result);
  //   } catch (error) {
  //     res.status(500).send({
  //       message: {
  //         en: error.message,
  //         vi: "Đã xảy ra lỗi nội bộ.",
  //       },
  //     });
  //   }
  // };

  // Count pupils by grade
  countPupilsByGrade = async (req, res, next) => {
    try {
      const count = [];
      for (let grade = 1; grade <= 3; ++grade) {
        const q = query(
          collection(db, "pupils"),
          where("grade", "==", grade.toString())
        );
        const total = await getCountFromServer(q);
        count.push({ total: total.data().count });
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

  // Count new pupils by month
  countPupilsByMonth = async (req, res, next) => {
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

      const usersSnapshot = await getDocs(collection(db, "pupils"));

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

  countPupilsByQuarter = async (req, res, next) => {
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
          collection(db, "pupils"),
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

  countPupilsBySeason = async (req, res, next) => {
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
            collection(db, "pupils"),
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

  // Count new pupils by week
  countPupilsByWeek = async (req, res, next) => {
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
          collection(db, "pupils"),
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
      res.status(500).send({
        message: {
          en: error.message,
          vi: "Đã xảy ra lỗi nội bộ.",
        },
      });
    }
  };

  // Count new pupils by year
  countPupilsByYear = async (req, res, next) => {
    try {
      const { startYear, endYear } = req.query;

      const start = parseInt(startYear);
      const end = parseInt(endYear);

      const startDate = new Date(`${start}-01-01`);
      const endDate = new Date(`${end + 1}-01-01`);

      const pupilsSnapshot = await getDocs(
        query(
          collection(db, "pupils"),
          where("createdAt", ">=", startDate),
          where("createdAt", "<", endDate)
        )
      );

      const yearlyCounts = Array(end - start + 1).fill(0);

      pupilsSnapshot.forEach((docSnap) => {
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

  //     const userRef = doc(db, "pupils", id);
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
        return res.status(400).send({ message: "Missing pupil ID." });
      }

      if (!file || !file.buffer) {
        return res.status(400).send({ message: "No file uploaded." });
      }

      const fileExt = file.originalname.split(".").pop();
      const fileKey = `image_profile/pupil_${id}_${uuidv4()}.${fileExt}`;
      await FileController.uploadFile(file, fileKey);

      const imageUrl = `${process.env.CLOUD_FRONT}${fileKey}`;

      const pupilRef = doc(db, "pupils", id);
      await updateDoc(pupilRef, {
        image: imageUrl,
        updatedAt: serverTimestamp(),
      });

      return res.status(200).send({
        message: {
          en: "Pupil profile image uploaded successfully!",
          vi: "Cập nhật ảnh hồ sơ học sinh thành công!",
        },
        image: imageUrl,
      });
    } catch (error) {
      console.error("Upload image profile error:", error);
      return res.status(500).send({
        message: {
          en: error.message || "Upload failed.",
          vi: "Đã xảy ra lỗi khi cập nhật ảnh hồ sơ học sinh.",
        },
      });
    }
  };
}

module.exports = new PupilController();
