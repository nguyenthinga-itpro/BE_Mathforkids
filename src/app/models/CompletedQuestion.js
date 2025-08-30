class CompletedQuestion {
  constructor(
    id,
    completedQuestionId,
    exerciseId,
    level,
    question,
    image,
    option,
    correctAnswer,
    selectedAnswer,
    solution,
    createdAt
  ) {
    this.id = id;
    this.completedQuestionId = completedQuestionId;
    this.exerciseId = exerciseId;
    this.level = level;
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
    return new CompletedQuestion(
      doc.id,
      data.completedQuestionId ?? "",
      data.exerciseId ?? "",
      data.level ?? {},
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

module.exports = CompletedQuestion;
