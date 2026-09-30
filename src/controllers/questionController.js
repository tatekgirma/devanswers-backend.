import {
  createQuestionService,
  deleteQuestionService,
  downvoteQuestionService,
  getAllQuestionsService,
  getQuestionByIdService,
  updateQuestionService,
  upvoteQuestionService,
} from "../services/questionService.js";

export const getAllQuestions = async (req, res) => {
  const questions = await getAllQuestionsService();

  res.status(200).json({
    success: true,
    message: "Questions fetched successfully",
    data: questions,
  });
};

export const getQuestionById = async (req, res) => {
  const { id } = req.params;
  const question = await getQuestionByIdService(id);

  res.status(200).json({
    success: true,
    message: "Question fetched successfully",
    data: question,
  });
};

export const createQuestion = async (req, res) => {
  const { title, description, tags } = req.body;
  const question = await createQuestionService({
    title,
    description,
    tags,
    author: req.user.id,
  });

  res.status(200).json({
    success: true,
    message: "Question created successfully",
    data: question,
  });
};

export const updateQuestion = async (req, res) => {
  const { id } = req.params;
  const { title, description, tags } = req.body;
  const question = await updateQuestionService(
    id,
    { title, description, tags },
    req.user,
  );

  res.status(200).json({
    success: true,
    message: "Question updated successfully",
    data: question,
  });
};

export const deleteQuestion = async (req, res) => {
  const question = await deleteQuestionService(req.params.id, req.user);

  res.status(200).json({
    success: true,
    message: "Question deleted successfully",
    data: question,
  });
};

export const upvoteQuestion = async (req, res) => {
  const question = await upvoteQuestionService(req.params.id, req.user.id);

  res.status(200).json({
    success: true,
    message: "Question upvoted successfully",
    data: question,
  });
};

export const downvoteQuestion = async (req, res) => {
  const question = await downvoteQuestionService(req.params.id, req.user.id);

  res.status(200).json({
    success: true,
    message: "Question downvoted successfully",
    data: question,
  });
};
