class CompleteTask {
  constructor(id, pupilId, taskId, lessonId, isCompleted, createdAt, updatedAt) {
    this.id = id;
    this.pupilId = pupilId;
    this.taskId = taskId;
    this.lessonId = lessonId;
    this.isCompleted = isCompleted;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }

  static fromFirestore(doc) {
    const data = doc.data();
    return new CompleteTask(
      doc.id,
      data.pupilId,
      data.taskId,
      data.lessonId,
      data.isCompleted,
      data.createdAt?.toDate().toLocaleString("vi-VN"),
      data.updatedAt?.toDate().toLocaleString("vi-VN")
    );
  }
}

module.exports = CompleteTask;
