class LessonDetail {
  constructor(
    id,
    lessonId,
    order,
    title = {},
    content = {}, 
    image = null,
    isDisabled = false,
    createdAt,
    updatedAt
  ) {
    this.id = id;
    this.lessonId = lessonId;
    this.order = order;
    this.title = title;
    this.content = content;
    this.image = image;
    this.isDisabled = isDisabled;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }

  static fromFirestore(doc) {
    const data = doc.data();
    return new LessonDetail(
      doc.id,
      data.lessonId,
      data.order,
      data.title || {},
      data.content || {},
      data.image || null,
      data.isDisabled || false,
      data.createdAt?.toDate().toLocaleString("vi-VN"),
      data.updatedAt?.toDate().toLocaleString("vi-VN")
    );
  }
}

module.exports = LessonDetail;
