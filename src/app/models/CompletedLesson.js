class CompletedLesson {
  constructor(id, pupilId, lessonId, isCompleted, isBlock, isDisabled, createAt, updateAt) {
    (this.id = id),
      (this.pupilId = pupilId),
      (this.lessonId = lessonId),
      (this.isCompleted = isCompleted),
      (this.isBlock = isBlock),
      (this.isDisabled = isDisabled),
      (this.createAt = createAt),
      (this.updateAt = updateAt);
  }
  static fromFirestore(doc) {
    const data = doc.data();
    return new CompletedLesson(
      doc.id,
      data.pupilId,
      data.lessonId,
      data.isCompleted,
      data.isBlock,
      data.isDisabled,
      data.createAt?.toDate().toLocaleString("vi-VN"),
      data.updateAt?.toDate().toLocaleString("vi-VN")
    );
  }
}
module.exports = CompletedLesson;
