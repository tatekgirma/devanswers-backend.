import {
  createAnswerService,
  deleteAnswerService,
  downvoteAnswerService,
  getAnswersByQuestionIdService,
  updateAnswerService,
  upvoteAnswerService,
} from "../services/answerService.js";

export const getAnswersByQuestionId = async (req, res) => {
  const { questionId } = req.params;
  const answers = await getAnswersByQuestionIdService(questionId);

  res.status(200).json({
    success: true,
    message: "Answers fetched successfully",
    data: answers,
  });
};

export const createAnswer = async (req, res) => {
  const { questionId } = req.params;
  const { answerText } = req.body;
  const answer = await createAnswerService({
    questionId,
    answerText,
    author: req.user.id,
  });

  res.status(201).json({
    success: true,
    message: "Answer created successfully",
    data: answer,
  });
};

export const updateAnswer = async (req, res) => {
  const { answerId } = req.params;
  const { answerText } = req.body;
  const answer = await updateAnswerService(answerId, answerText, req.user);

  res.status(200).json({
    success: true,
    message: "Answer updated successfully",
    data: answer,
  });
};

export const deleteAnswer = async (req, res) => {
  await deleteAnswerService(req.params.answerId, req.user);

  res.status(200).json({
    success: true,
    message: "Answer deleted successfully",
  });
};

export const upvoteAnswer = async (req, res) => {
  const answer = await upvoteAnswerService(req.params.answerId, req.user.id);

  res.status(200).json({
    success: true,
    message: "Answer upvoted successfully",
    data: answer,
  });
};

export const downvoteAnswer = async (req, res) => {
  const answer = await downvoteAnswerService(req.params.answerId, req.user.id);

  res.status(200).json({
    success: true,
    message: "Answer downvoted successfully",
    data: answer,
  });
};
