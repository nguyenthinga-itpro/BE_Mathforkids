const Reward = require("../models/Reward");
const {
  getFirestore,
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  getCountFromServer,
  orderBy,
  limit,
  startAfter,
  serverTimestamp,
  query,
  where,
} = require("firebase/firestore");
const { uploadMultipleFiles } = require("./FileController");
const db = getFirestore();

class RewardController {
  countByDisabledStatus = async (req, res, next) => {
    try {
      const { isDisabled } = req.query;
      const q = query(
        collection(db, "reward"),
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
        const startDoc = await getDoc(doc(db, "reward", startAfterId));
        q = query(
          collection(db, "reward"),
          where("isDisabled", "==", isDisabled === "true"),
          orderBy("createdAt", "desc"),
          startAfter(startDoc),
          limit(pageSize)
        );
      } else {
        q = query(
          collection(db, "reward"),
          where("isDisabled", "==", isDisabled === "true"),
          orderBy("createdAt", "desc"),
          limit(pageSize)
        );
      }
      const snapshot = await getDocs(q);
      const reward = snapshot.docs.map((doc) => Reward.fromFirestore(doc));
      const lastVisible = snapshot.docs[snapshot.docs.length - 1];
      const lastVisibleId = lastVisible ? lastVisible.id : null;

      res.status(200).send({
        data: reward,
        nextPageToken: lastVisibleId, // Dùng làm startAfterId cho trang kế
      });
    } catch (error) {
      console.error("Error in filterByIsDisabled:", error.message);
      res.status(500).send({
        message: {
          en: error.message,
          vi: "Đã xảy ra lỗi nội bộ.",
        },
      });
    }
  };

  // Create reward
  create = async (req, res, next) => {
    try {
      const { name, description, exchangePoint, exchangeReward } = req.body;
      if (!req.files || req.files.length === 0) {
        return res.status(400).send({ message: "Image file is required." });
      }

      const uploadedFiles = await uploadMultipleFiles(req.files);
      const image = uploadedFiles["image"];
      const parsedName = JSON.parse(name);
      const parsedDescription = JSON.parse(description);
      const exchangePoints = Number(exchangePoint);
      const exchangeRewards = Number(exchangeReward);
      const rewardRef = await addDoc(collection(db, "reward"), {
        name: parsedName,
        description: parsedDescription,
        image,
        exchangePoint: exchangePoints,
        exchangeReward: exchangeRewards,
        isDisabled: false,
        createdAt: serverTimestamp(),
      });

      res.status(201).send({
        message: {
          en: "Reward created successfully!",
          vi: "Tạo phần thưởng thành công!",
        },
        id: rewardRef.id,
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
    console.log("countAll called");
    try {
      const q = query(collection(db, "reward"));
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

  // Get all rewards
  getAll = async (req, res, next) => {
    try {
      const pageSize = parseInt(req.query.pageSize) || 10;
      const startAfterId = req.query.startAfterId || null;

      let q;

      if (startAfterId) {
        const startDocRef = doc(db, "reward", startAfterId);
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
          collection(db, "reward"),
          orderBy("createdAt", "desc"),
          startAfter(startDocSnap),
          limit(pageSize)
        );
      } else {
        q = query(
          collection(db, "reward"),
          orderBy("createdAt", "desc"),
          limit(pageSize)
        );
      }

      const snapshot = await getDocs(q);
      const rewards = snapshot.docs.map((doc) => Reward.fromFirestore(doc));

      const lastVisible = snapshot.docs[snapshot.docs.length - 1];
      const lastVisibleId = lastVisible ? lastVisible.id : null;

      res.status(200).send({
        data: rewards,
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

  // Get enabled rewards
  getEnabledRewards = async (req, res) => {
    try {
      const rewardsRef = collection(db, "reward");
      const q = query(rewardsRef, where("isDisabled", "==", false));
      const snapshot = await getDocs(q);
      const rewards = snapshot.docs.map((doc) => Reward.fromFirestore(doc));
      res.status(200).send(rewards);
    } catch (error) {
      res.status(500).send({
        message: {
          en: error.message,
          vi: "Đã xảy ra lỗi nội bộ.",
        },
      });
    }
  };

  // Get reward by ID
  getById = async (req, res, next) => {
    const id = req.params.id;
    const reward = req.reward;
    res.status(200).send({ id: id, ...reward });
  };

  // Update reward
  update = async (req, res, next) => {
    try {
      const id = req.params.id;
      const ref = doc(db, "reward", id);

      const { isDisabled, name, description, exchangePoint, exchangeReward } =
        req.body;
      console.log("req.files:", req.files);
      const updateData = {
        updatedAt: serverTimestamp(),
      };
      const currentRewardDoc = await getDoc(ref);
      if (!currentRewardDoc.exists()) {
        throw new Error("Reward not found");
      }
      const currentReward = currentRewardDoc.data();
      const parsedName = typeof name === "string" ? JSON.parse(name) : name;
      const parsedDescription =
        typeof description === "string" ? JSON.parse(description) : description;
      if (isDisabled !== undefined && !name && !description && !req.files) {
        updateData.isDisabled = isDisabled;
      } else {
        updateData.name = parsedName;
        updateData.description = parsedDescription;
        updateData.exchangePoint = exchangePoint;
        updateData.exchangeReward = exchangeReward;
        // Nếu có files thì xử lý upload ảnh
        if (req.files && Object.keys(req.files).length > 0) {
          const uploadedFiles = await uploadMultipleFiles(req.files);
          updateData.image = uploadedFiles.image;
        } else {
          updateData.image = currentReward.image;
        }
      }
      await updateDoc(ref, updateData);
      res.status(200).send({
        message: {
          en: "Reward updated successfully!",
          vi: "Cập nhật phần thưởng thành công!",
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

module.exports = new RewardController();
