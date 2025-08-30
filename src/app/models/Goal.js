class Goal {
  constructor(
    id,
    pupilId,
    dateStart,
    dateEnd,
    type,
    lessonId,
    rewardId,
    isCompleted,
    createdAt,
    updatedAt,
    exercise,
    rewardQuantity
  ) {
    this.id = id;
    this.pupilId = pupilId;
    this.dateStart = dateStart;
    this.dateEnd = dateEnd;
    this.type = type;
    this.lessonId = lessonId;
    this.rewardId = rewardId;
    this.isCompleted = isCompleted;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
    this.exercise = exercise;
    this.rewardQuantity = rewardQuantity;
  }

  static fromFirestore(doc) {
    const data = doc.data();
    return new Goal(
      doc.id,
      data.pupilId,
      data.dateStart,
      data.dateEnd,
      data.type,
      data.lessonId,
      data.rewardId,
      data.isCompleted,
      data.createdAt?.toDate().toLocaleString("vi-VN"),
      data.updatedAt?.toDate().toLocaleString("vi-VN"),
      data.exercise || [],
      data.rewardQuantity
    );
  }
}

module.exports = Goal;
