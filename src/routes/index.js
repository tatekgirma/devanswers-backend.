import express from "express";
import authRouter from "./auth.js";
import answersRouter from "./answers.js";
import questionsRouter from "./questions.js";
import tagsRouter from "./tags.js";

const router = express.Router();

// Route for user registration
router.use("/auth", authRouter);

router.use("/questions", questionsRouter);

router.use("/answers", answersRouter);

// Routes for Tags
router.use("/tags", tagsRouter);

export default router;
