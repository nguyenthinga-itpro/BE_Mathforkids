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

class ExchangeRewardMiddleware {
    // Check reward is already exist or not by ID
    checkExchangeRewardExistById = (paramName = "id") => {
        return async (req, res, next) => {
            try {
                const exchangeRewardId = req.params[paramName];
                const exchangeRewardRef = doc(db, "exchange_rewards", exchangeRewardId);
                const exchangeRewardSnap = await getDoc(exchangeRewardRef);

                if (!exchangeRewardSnap.exists()) {
                    return res.status(404).json({
                        message: {
                            en: "Exchange reward not found!",
                            vi: "Không tìm thấy phần thưởng trao đổi!",
                        },
                    });
                }
                req.exchangeReward = exchangeRewardSnap.data();
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

module.exports = new ExchangeRewardMiddleware();
