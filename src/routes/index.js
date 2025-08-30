const lessonRouter = require("../routes/LessonRouter");
const lessonDetailRouter = require("../routes/LessonDetailRouter");
const exerciseRouter = require("../routes/ExerciseRouter");
const goalRouter = require("../routes/GoalRouter");
const rewardRouter = require("../routes/RewardRouter");
const ownedrewardRouter = require("../routes/OwnedRewardRouter");
const completedLessonRouter = require("../routes/CompletedLessonRouter");
const testsRouter = require("../routes/TestRouter");
const authRouter = require("../routes/AuthRouter");
const userRouter = require("../routes/UserRouter");
const pupilRouter = require("../routes/PupilRouter");
const pupilnotificationRouter = require("../routes/PupilNotificationRouter");
const assessmentRouter = require("../routes/AssessmentRouter");
const levelRouter = require("../routes/LevelRouter");
const testquestionRouter = require("../routes/TestQuestionRouter");
const generalnotificationRouter = require("../routes/GeneralNotificationRouter");
const dailytaskRouter = require("../routes/DailyTaskRouter");
const completedTaskRouter = require("../routes/CompletedTaskRouter");
const userNotificationRouter = require("../routes/UserNotificationRouter");
const completedExerciseRouter = require("../routes/CompletedExerciseRouter");
const completedQuestionRouter = require("../routes/CompletedQuestionRouter");
const exchangeRewardRouter = require("../routes/exchangeRewardRouter");

function route(app) {
  app.use("/lesson", lessonRouter);
  app.use("/lessondetail", lessonDetailRouter);
  app.use("/exercise", exerciseRouter);
  app.use("/goal", goalRouter);
  app.use("/reward", rewardRouter);
  app.use("/ownereward", ownedrewardRouter);
  app.use("/completedlesson", completedLessonRouter);
  app.use("/test", testsRouter);
  app.use("/auth", authRouter);
  app.use("/user", userRouter);
  app.use("/pupil", pupilRouter);
  app.use("/pupilnotification", pupilnotificationRouter);
  app.use("/usernotification", userNotificationRouter);
  app.use("/assessment", assessmentRouter);
  app.use("/level", levelRouter);
  app.use("/testquestion", testquestionRouter);
  app.use("/generalnotification", generalnotificationRouter);
  app.use("/dailytask", dailytaskRouter);
  app.use("/completedtask", completedTaskRouter);
  app.use("/completedexercise", completedExerciseRouter);
  app.use("/completedquestion", completedQuestionRouter);
  app.use("/exchangereward", exchangeRewardRouter);

}

module.exports = route;
