class Exercise {
  constructor(
    id,
    lessonId,
    levelId,
    question,
    image,
    option,
    answer,
    solution,
    isDisabled,
    createdAt,
    updatedAt
  ) {
    (this.id = id),
      (this.lessonId = lessonId),
      (this.levelId = levelId),
      (this.question = question),
      (this.image = image),
      (this.option = option),
      (this.answer = answer),
      (this.solution = solution),
      (this.isDisabled = isDisabled),
      (this.createdAt = createdAt),
      (this.updatedAt = updatedAt);
  }

  static fromFirestore(doc) {
    const data = doc.data();
    return new Exercise(
      doc.id,
      data.lessonId,
      data.levelId,
      data.question,
      data.image,
      data.option,
      data.answer,
      data.solution,
      data.isDisabled,
      data.createdAt?.toDate().toLocaleString("vi-VN"),
      data.updatedAt?.toDate().toLocaleString("vi-VN")
    );
  }
}

module.exports = Exercise;
