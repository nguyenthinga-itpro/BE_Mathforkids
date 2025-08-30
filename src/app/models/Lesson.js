class Lesson {
  constructor(id, order, name, grade, type, isDisabled, createdAt, updatedAt) {
    (this.id = id),
      (this.order = order),
      (this.name = name),
      (this.grade = grade),
      (this.type = type),
      (this.isDisabled = isDisabled),
      (this.createdAt = createdAt),
      (this.updatedAt = updatedAt);
  }

  static fromFirestore(doc) {
    const data = doc.data();
    return new Lesson(
      doc.id,
      data.order,
      data.name,
      data.grade,
      data.type,
      data.isDisabled,
      data.createdAt?.toDate().toLocaleString("vi-VN"),
      data.updatedAt?.toDate().toLocaleString("vi-VN")
    );
  }
}

module.exports = Lesson;
