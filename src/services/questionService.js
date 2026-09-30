import Question from "../models/Question.js";
import Answer from "../models/Answer.js";
import Tag from "../models/Tag.js";
import { createAppError } from "../utils/createAppError.js";
import { handleVote } from "./voteService.js";

export const getAllQuestionsService = async () => {
  const questions = await Question.find({})
    .populate({ path: "author", select: "name" })
    .populate("tags")
    .sort({ createdAt: -1 });

  if (!questions || questions.length === 0) {
    throw createAppError("No questions found", 404);
  }

  const questionsWithCount = await Promise.all(
    questions.map(async q => {
      const answerCount = await Answer.countDocuments({ questionId: q._id });
      return { ...q.toObject(), answerCount };
    }),
  );

  return questionsWithCount;
};

export const getQuestionByIdService = async id => {
  // atomically bump views while returning the updated doc
  const question = await Question.findByIdAndUpdate(
    id,
    { $inc: { views: 1 } },
    { new: true },
  )
    .populate({ path: "author", select: "name" })
    .populate("tags");

  if (!question) {
    throw createAppError("Question not found", 404);
  }

  const answers = await Answer.find({ questionId: id });

  return { ...question.toObject(), answers };
};

export const createQuestionService = async ({
  title,
  description,
  tags,
  author,
}) => {
  if (!title || !description || !author) {
    throw createAppError("Title, description and author are required", 400);
  }

  // "javascript, nodejs" -> ["javascript", "nodejs"], de-duped and empties dropped
  const tagNames = [
    ...new Set(
      (tags ?? "")
        .split(",")
        .map(t => t.trim().toLowerCase())
        .filter(Boolean),
    ),
  ];

  const tagIds = await Promise.all(
    tagNames.map(async name => {
      const tag = await Tag.findOneAndUpdate(
        { name },
        { $setOnInsert: { name } },
        { new: true, upsert: true },
      );
      return tag._id;
    }),
  );

  const question = await Question.create({
    title,
    description,
    tags: tagIds,
    author,
  });

  const populated = await question.populate([
    { path: "author", select: "name" },
    { path: "tags" },
  ]);

  return { ...populated.toObject() };
};

export const updateQuestionService = async (
  id,
  { title, description, tags },
  loggedInUser,
) => {
  const question = await Question.findById(id);

  if (!question) {
    throw createAppError("Question not found", 404);
  }

  const isOwner = question.author.toString() === loggedInUser.id.toString();
  if (!isOwner && !loggedInUser.isAdmin) {
    throw createAppError("Not authorized to update this question", 403);
  }

  if (title !== undefined) question.title = title;
  if (description !== undefined) question.description = description;

  if (tags !== undefined) {
    const tagNames = [
      ...new Set(
        tags
          .split(",")
          .map(t => t.trim().toLowerCase())
          .filter(Boolean),
      ),
    ];

    const tagIds = await Promise.all(
      tagNames.map(async name => {
        const tag = await Tag.findOneAndUpdate(
          { name },
          { $setOnInsert: { name } },
          { new: true, upsert: true },
        );
        return tag._id;
      }),
    );

    question.tags = tagIds;
  }

  await question.save();

  const populated = await question.populate([
    { path: "author", select: "name" },
    { path: "tags" },
  ]);

  return populated.toObject();
};

export const deleteQuestionService = async (id, loggedInUser) => {
  const question = await Question.findById(id);

  if (!question) {
    throw createAppError("Question not found", 404);
  }

  const isOwner = question.author.toString() === loggedInUser.id.toString();
  if (!isOwner && !loggedInUser.isAdmin) {
    throw createAppError("Not authorized to delete this question", 403);
  }

  await Answer.deleteMany({ questionId: id });
  await question.deleteOne();

  return question.toObject();
};

export const upvoteQuestionService = async (questionId, userId) => {
  const question = await handleVote(Question, questionId, userId, "upvote");

  if (!question) {
    throw createAppError("Unable to upvote question", 400);
  }

  return question;
};

export const downvoteQuestionService = async (questionId, userId) => {
  const question = await handleVote(Question, questionId, userId, "downvote");

  if (!question) {
    throw createAppError("Unable to downvote question", 400);
  }

  return question;
};
