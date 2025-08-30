const OwnedRewards = require("../models/OwnedRewards");
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
  getCountFromServer,
} = require("firebase/firestore");

const db = getFirestore();

class OwnedRewardsController {
  createOrUpdate = async (req, res, next) => {
    try {
      const { pupilId, rewardId } = req.params;
      const { quantity } = req.body;

      const q = query(
        collection(db, "owned_rewards"),
        where("pupilId", "==", pupilId),
        where("rewardId", "==", rewardId)
      );

      const snapshot = await getDocs(q);

      if (!snapshot.empty) {
        // Nếu đã tồn tại: cập nhật số lượng + cập nhật thời gian
        const docRef = snapshot.docs[0].ref;
        const existingData = snapshot.docs[0].data();
        const newQuantity = (existingData.quantity || 0) + quantity;

        await updateDoc(docRef, {
          quantity: newQuantity,
          updatedAt: serverTimestamp(),
        });

        return res.status(200).send({
          message: {
            en: "Owned reward updated successfully!",
            vi: "Cập nhật phần thưởng của học sinh thành công!",
          },
        });
      } else {
        // Nếu chưa tồn tại: tạo mới
        await addDoc(collection(db, "owned_rewards"), {
          pupilId,
          rewardId,
          quantity,
          createdAt: serverTimestamp(),
        });

        return res.status(201).send({
          message: {
            en: "Owned reward created successfully!",
            vi: "Tạo phần thưởng của học sinh thành công!",
          },
        });
      }
    } catch (error) {
      res.status(500).send({
        message: {
          en: error.message,
          vi: "Đã xảy ra lỗi nội bộ.",
        },
      });
    }
  };

  // Get owned rewards by pupil ID
  getByPupilId = async (req, res, next) => {
    try {
      const pupilId = req.params.pupilId;
      const q = query(
        collection(db, "owned_rewards"),
        where("pupilId", "==", pupilId)
      );
      const ownedRewardsSnapshot = await getDocs(q);
      const ownedRewards = ownedRewardsSnapshot.docs.map((doc) =>
        OwnedRewards.fromFirestore(doc)
      );
      res.status(200).send(ownedRewards);
    } catch (error) {
      res.status(500).send({
        message: {
          en: error.message,
          vi: "Đã xảy ra lỗi nội bộ.",
        },
      });
    }
  };
  countByPupilId = async (req, res, next) => {
    try {
      const pupilId = req.params.pupilId;
      const q = query(
        collection(db, "owned_rewards"),
        where("pupilId", "==", pupilId),
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
  // Get an owned reward by ID
  getById = async (req, res, next) => {
    const id = req.params.id;
    const ownedReward = req.ownedReward;
    res.status(200).send({ id: id, ...ownedReward });
  };
}

module.exports = new OwnedRewardsController();
