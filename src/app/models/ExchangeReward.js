class DailyTask {
    constructor(
        id,
        pupilId,
        rewardId,
        isAccept,
        createdAt,
        updatedAt
    ) {
        this.id = id;
        this.pupilId = pupilId;
        this.rewardId = rewardId;
        this.isAccept = isAccept;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }

    static fromFirestore(doc) {
        const data = doc.data();
        return new DailyTask(
            doc.id,
            data.pupilId,
            data.rewardId,
            data.isAccept,
            data.createdAt?.toDate().toLocaleString("vi-VN"),
            data.updatedAt?.toDate().toLocaleString("vi-VN")
        );
    }
}

module.exports = DailyTask;
