import Answer from "../models/Answer.js";
import { createAppError } from "../utils/createAppError.js";
import { handleVote } from "./voteService.js";

export const getAnswersByQuestionIdService = async questionId => {
  const answers = await Answer.find({ questionId }).populate({
    path: "author",
    select: "name",
  });

  if (!answers || answers.length === 0) {
    throw createAppError("No answers found for this question", 404);
  }

  return answers;
};

export const createAnswerService = async ({
  questionId,
  answerText,
  author,
}) => {
  if (!questionId || !answerText || !author) {
    throw createAppError(
      "Question id, answer text and author are required",
      400,
    );
  }

  const answer = await Answer.create({ questionId, answerText, author });

  const populated = await answer.populate({ path: "author", select: "name" });

  return populated.toObject();
};

export const updateAnswerService = async (
  answerId,
  answerText,
  loggedInUser,
) => {
  const answer = await Answer.findById(answerId);

  if (!answer) {
    throw createAppError("Answer not found", 404);
  }

  const isOwner = answer.author.toString() === loggedInUser.id.toString();
  if (!isOwner && !loggedInUser.isAdmin) {
    throw createAppError("Not authorized to update this answer", 403);
  }

  answer.answerText = answerText;
  await answer.save();

  const populated = await answer.populate({ path: "author", select: "name" });

  return populated.toObject();
};

export const deleteAnswerService = async (answerId, loggedInUser) => {
  const answer = await Answer.findById(answerId);

  if (!answer) {
    throw createAppError("Answer not found", 404);
  }

  const isOwner = answer.author.toString() === loggedInUser.id.toString();
  if (!isOwner && !loggedInUser.isAdmin) {
    throw createAppError("Not authorized to delete this answer", 403);
  }

  await answer.deleteOne();
};

export const upvoteAnswerService = async (answerId, userId) => {
  const answer = await handleVote(Answer, answerId, userId, "upvote");

  if (!answer) {
    throw createAppError("Unable to upvote answer", 400);
  }

  return answer;
};

export const downvoteAnswerService = async (answerId, userId) => {
  const answer = await handleVote(Answer, answerId, userId, "downvote");

  if (!answer) {
    throw createAppError("Unable to downvote answer", 400);
  }

  return answer;
};
