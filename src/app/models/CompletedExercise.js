class CompletedExercise {
  constructor(id, pupilId, lessonId, levelId, point, createdAt) {
    this.id = id;
    this.pupilId = pupilId;
    this.lessonId = lessonId;
    this.levelId = levelId;
    this.point = point;
    this.createdAt = createdAt;
  }

  static fromFirestore(doc) {
    const data = doc.data();
    return new CompletedExercise(
      doc.id,
      data.pupilId ?? "",
      data.lessonId ?? "",
      data.levelId ?? "",
      data.point ?? 0,
      data.createdAt?.toDate().toLocaleString("vi-VN") ?? ""
    );
  }
}

module.exports = CompletedExercise;
