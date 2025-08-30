class DailyTask {
  constructor(
    id,
    title,
    description,
    rewardId,
    quantityReward,
    isDisabled,
    createdAt,
    updatedAt
  ) {
    this.id = id;
    this.title = title;
    this.description = description;
    this.rewardId = rewardId;
    this.quantityReward = quantityReward;
    this.isDisabled = isDisabled;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }

  static fromFirestore(doc) {
    const data = doc.data();
    return new DailyTask(
      doc.id,
      data.title,
      data.description,
      data.rewardId,
      data.quantityReward,
      data.isDisabled,
      data.createdAt?.toDate().toLocaleString("vi-VN"),
      data.updatedAt?.toDate().toLocaleString("vi-VN")
    );
  }
}

module.exports = DailyTask;
