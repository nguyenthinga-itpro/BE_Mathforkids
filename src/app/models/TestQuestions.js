class TestQuestion {
  constructor(
    id,
    testId,
    exerciseId,
    levelId,
    question,
    image,
    option,
    correctAnswer,
    selectedAnswer,
    solution,
    createdAt
  ) {
    this.id = id;
    this.testId = testId;
    this.exerciseId = exerciseId;
    this.levelId = levelId;
    this.question = question;
    this.image = image;
    this.option = option;
    this.correctAnswer = correctAnswer;
    this.selectedAnswer = selectedAnswer;
    this.solution = solution;
    this.createdAt = createdAt;
  }

  static fromFirestore(doc) {
    const data = doc.data();
    return new TestQuestion(
      doc.id,
      data.testId ?? "",
      data.exerciseId ?? "",
      data.levelId ?? {},
      data.question ?? {},
      data.image ?? "",
      data.option ?? [],
      data.correctAnswer ?? "",
      data.selectedAnswer ?? "",
      data.solution ?? "",
      data.createdAt?.toDate().toLocaleString("vi-VN") ?? ""
    );
  }
}

module.exports = TestQuestion;
