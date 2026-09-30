import express from "express";
import {
  deleteAnswer,
  downvoteAnswer,
  updateAnswer,
  upvoteAnswer,
} from "../controllers/answerController.js";
import authenticate from "../middleware/authHandler.js";

const router = express.Router();

router.put("/:answerId", authenticate, updateAnswer);
router.delete("/:answerId", authenticate, deleteAnswer);
router.post("/:answerId/upvote", authenticate, upvoteAnswer);
router.post("/:answerId/downvote", authenticate, downvoteAnswer);

export default router;
