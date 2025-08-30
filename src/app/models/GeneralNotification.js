class GeneralNotification {
  constructor(id, senderId, title, content, createdAt) {
    this.id = id;
    this.senderId = senderId;
    this.title = title;
    this.content = content;
    this.createdAt = createdAt;
  }

  static fromFirestore(doc) {
    const data = doc.data();
    return new GeneralNotification(
      doc.id,
      data.senderId ?? '',
      data.title ?? {},
      data.content ?? {},
      data.createdAt?.toDate().toLocaleString("vi-VN")
    );
  }
}

module.exports = GeneralNotification;
