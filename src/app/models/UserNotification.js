class UserNotification {
  constructor(
    id,
    userId,
    title,
    content,
    goalId,
    exchangedRewardId,
    type,
    isRead,
    createdAt
  ) {
    this.id = id;
    this.userId = userId;
    this.title = title;
    this.content = content;
    this.goalId = goalId;
    this.exchangedRewardId = exchangedRewardId;
    this.type = type;
    this.isRead = isRead;
    this.createdAt = createdAt;
  }

  static fromFirestore(doc) {
    const data = doc.data();
    return new UserNotification(
      doc.id,
      data.userId,
      data.title,
      data.content,
      data.goalId,
      data.exchangedRewardId,
      data.type,
      data.isRead,
      data.createdAt || null
    );
  }
}

module.exports = UserNotification;
