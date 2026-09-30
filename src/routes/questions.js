import express from "express";
import {
  createQuestion,
  deleteQuestion,
  downvoteQuestion,
  getAllQuestions,
  getQuestionById,
  updateQuestion,
  upvoteQuestion,
} from "../controllers/questionController.js";
import {
  createAnswer,
  getAnswersByQuestionId,
} from "../controllers/answerController.js";
import authenticate from "../middleware/authHandler.js";

const router = express.Router();

router.get("/", getAllQuestions);
router.get("/:id", getQuestionById);
router.get("/:questionId/answers", getAnswersByQuestionId);

router.post("/", authenticate, createQuestion);
router.put("/:id", authenticate, updateQuestion);
router.delete("/:id", authenticate, deleteQuestion);
router.post("/:id/upvote", authenticate, upvoteQuestion);
router.post("/:id/downvote", authenticate, downvoteQuestion);
router.post("/:questionId/answers", authenticate, createAnswer);

export default router;
