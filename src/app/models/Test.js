class Test {
  constructor(id, pupilId, lessonId, point, duration, createdAt) {
    this.id = id;
    this.pupilId = pupilId;
    this.lessonId = lessonId;
    this.point = point;
    this.duration = duration;
    this.createdAt = createdAt;
  }

  static fromFirestore(doc) {
    const data = doc.data();
    return new Test(
      doc.id,
      data.pupilId ?? "",
      data.lessonId ?? "",
      data.point ?? 0,
      data.duration ?? 0,
      data.createdAt?.toDate().toLocaleString("vi-VN") ?? ""
    );
  }
}

module.exports = Test;
