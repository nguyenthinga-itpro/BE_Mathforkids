const ExchangeReward = require("../models/ExchangeReward");
const {
    getFirestore,
    collection,
    doc,
    addDoc,
    getDoc,
    getDocs,
    updateDoc,
    serverTimestamp,
    query,
    where,
    getCountFromServer,
} = require("firebase/firestore");
const db = getFirestore();

class ExchangeRewardController {
    // Create exchange reward
    create = async (req, res, next) => {
        try {
            const { pupilId, rewardId } = req.body;
            const docRef = await addDoc(collection(db, "exchange_rewards"), {
                pupilId,
                rewardId,
                isAccept: false,
                createdAt: serverTimestamp(),
            });
            res.status(201).send({
                id: docRef.id,
                message: {
                    en: "Exchange reward created successfully!",
                    vi: "Tạo phần thưởng trao đổi thành công!",
                },
                data: {
                    pupilId,
                    rewardId,
                    isAccept: false,
                    createdAt: new Date().toISOString(),
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

    // Update exchange reward
    update = async (req, res, next) => {
        try {
            const id = req.params.id;
            const { isAccept } = req.body; // Expect isAccept from request body

            // Validate id
            if (!id) {
                return res.status(400).send({
                    message: {
                        en: "Reward ID is required",
                        vi: "Yêu cầu ID phần thưởng",
                    },
                });
            }

            // Validate isAccept
            if (typeof isAccept !== "boolean") {
                return res.status(400).send({
                    message: {
                        en: "isAccept must be a boolean",
                        vi: "isAccept phải là giá trị boolean",
                    },
                });
            }

            // Check if document exists
            const ref = doc(db, "exchange_rewards", id);
            const docSnap = await getDoc(ref);
            if (!docSnap.exists()) {
                return res.status(404).send({
                    message: {
                        en: "Exchange reward not found",
                        vi: "Không tìm thấy phần thưởng trao đổi",
                    },
                });
            }

            // Update document
            await updateDoc(ref, {
                isAccept,
                updatedAt: serverTimestamp(),
            });

            res.status(200).send({
                message: {
                    en: "Exchange reward updated successfully!",
                    vi: "Cập nhật phần thưởng trao đổi thành công!",
                },
            });
        } catch (error) {
            // Log error for debugging (optional, use your preferred logging method)
            console.error("Error updating exchange reward:", error);

            res.status(500).send({
                message: {
                    en: error.message || "Internal server error",
                    vi: "Đã xảy ra lỗi nội bộ",
                },
            });
        }
    };

    getByPupilId = async (req, res, next) => {
        try {
            const { pupilId } = req.params;
            const q = query(
                collection(db, "exchange_rewards"),
                where("pupilId", "==", pupilId),
                where("isAccept", "==", true)
            );
            const snapshot = await getDocs(q);

            // Tạo object để đếm số lượng mỗi rewardId
            const rewardCount = {};
            const rewardIds = snapshot.docs.map((doc) => {
                const data = ExchangeReward.fromFirestore(doc);
                const rewardId = data.rewardId; // Giả sử rewardId là một field trong ExchangeReward
                rewardCount[rewardId] = (rewardCount[rewardId] || 0) + 1;
                return rewardId;
            });

            // Chuyển rewardCount thành array nếu cần
            const rewardCountArray = Object.entries(rewardCount).map(([rewardId, count]) => ({
                rewardId,
                count
            }));

            res.status(200).send({
                data: {
                    rewardIds: [...new Set(rewardIds)], // Loại bỏ duplicate rewardIds
                    rewardCount: rewardCountArray
                }
            });
        } catch (error) {
            res.status(500).send({
                message: {
                    en: error.message,
                    vi: "Đã xảy ra lỗi nội bộ."
                }
            });
        }
    };
    countRewardByPupilId = async (req, res, next) => {
        try {
            const pupilId = req.params.pupilId;
            const q = query(
                collection(db, "exchange_rewards"),
                where("pupilId", "==", pupilId),
                where("isAccept", "==", true)
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
    // Get exchange reward by ID
    getById = async (req, res, next) => {
        try {
            const id = req.params.id;
            const docRef = doc(db, "exchange_rewards", id);
            const docSnap = await getDoc(docRef);
            if (!docSnap.exists()) {
                return res.status(404).send({
                    message: {
                        en: "Exchange reward not found",
                        vi: "Không tìm thấy phần thưởng trao đổi",
                    },
                });
            }
            const exchangeReward = ExchangeReward.fromFirestore(docSnap);
            const exchangeData = docSnap.data();
            let rewardName = {};
            if (exchangeData.rewardId) {
                const rewardDocRef = doc(db, "reward", exchangeData.rewardId);
                const rewardDocSnap = await getDoc(rewardDocRef);
                if (rewardDocSnap.exists()) {
                    const rewardData = rewardDocSnap.data();
                    rewardName = {
                        en: rewardData.name?.en || "Reward",
                        vi: rewardData.name?.vi || "Phần thưởng",
                    };
                } else {
                    console.warn(`Reward with ID ${exchangeData.rewardId} not found`);
                }
            } else {
                console.warn(`No rewardId found for exchange reward ${id}`);
            }

            res.status(200).send({
                id,
                ...exchangeReward,
                name: rewardName, // Include name in the response
                pupilId: exchangeData.pupilId, // Ensure pupilId is included
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

module.exports = new ExchangeRewardController();