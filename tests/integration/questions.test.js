import { beforeEach, describe, expect, it } from "vitest";
import jwt from "jsonwebtoken";
import request from "supertest";
import "../setup.js";
import app from "../../src/app.js";
import Answer from "../../src/models/Answer.js";
import Question from "../../src/models/Question.js";
import Tag from "../../src/models/Tag.js";
import User from "../../src/models/User.js";

process.env.JWT_SECRET = "test-secret";
process.env.JWT_EXPIRATION = "1h";

const ownerData = {
  name: "Question Owner",
  email: "owner@example.com",
  password: "password123",
  isAdmin: false,
};

const createUser = async (overrides = {}) => User.create({ ...ownerData, ...overrides });

const tokenFor = user => jwt.sign(
  { id: user._id, isAdmin: user.isAdmin },
  process.env.JWT_SECRET,
  { expiresIn: "1h" },
);

const createQuestion = async (author, overrides = {}) => Question.create({
  title: "How do I test this?",
  description: "I need a useful answer.",
  author: author._id,
  ...overrides,
});

beforeEach(async () => {
  await Promise.all([
    Question.deleteMany({}),
    Answer.deleteMany({}),
    User.deleteMany({}),
    Tag.deleteMany({}),
  ]);
});

describe("Questions API", () => {
  describe("GET /api/questions", () => {
    it("returns questions with answer counts", async () => {
      const owner = await createUser();
      const question = await createQuestion(owner);
      await Answer.create({ questionId: question._id, answerText: "Try Vitest.", author: owner._id });

      const response = await request(app).get("/api/questions");

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({ success: true, message: "Questions fetched successfully" });
      expect(response.body.data[0]).toMatchObject({ _id: question.id, answerCount: 1 });
    });

    it("returns 404 when no questions exist", async () => {
      const response = await request(app).get("/api/questions");

      expect(response.status).toBe(404);
      expect(response.body).toEqual({ success: false, message: "No questions found" });
    });

    it("returns an empty-answer question with answerCount zero", async () => {
      const owner = await createUser();
      await createQuestion(owner);

      const response = await request(app).get("/api/questions");

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].answerCount).toBe(0);
    });
  });

  describe("GET /api/questions/:id", () => {
    it("returns a question and increments its views", async () => {
      const owner = await createUser();
      const question = await createQuestion(owner);

      const response = await request(app).get(`/api/questions/${question.id}`);

      expect(response.status).toBe(200);
      expect(response.body.data).toMatchObject({ _id: question.id, views: 1, answers: [] });
    });

    it("returns 404 for a missing question", async () => {
      const response = await request(app).get("/api/questions/507f1f77bcf86cd799439011");

      expect(response.status).toBe(404);
      expect(response.body.message).toBe("Question not found");
    });

    it("returns a server error for an invalid id", async () => {
      const response = await request(app).get("/api/questions/not-an-object-id");

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
    });
  });

  describe("GET /api/questions/:questionId/answers", () => {
    it("returns answers for a question", async () => {
      const owner = await createUser();
      const question = await createQuestion(owner);
      await Answer.create({ questionId: question._id, answerText: "An answer.", author: owner._id });

      const response = await request(app).get(`/api/questions/${question.id}/answers`);

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({ success: true, message: "Answers fetched successfully" });
      expect(response.body.data).toHaveLength(1);
    });

    it("returns 404 when a question has no answers", async () => {
      const owner = await createUser();
      const question = await createQuestion(owner);

      const response = await request(app).get(`/api/questions/${question.id}/answers`);

      expect(response.status).toBe(404);
      expect(response.body.message).toBe("No answers found for this question");
    });

    it("returns a server error for an invalid question id", async () => {
      const response = await request(app).get("/api/questions/not-an-object-id/answers");

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
    });
  });

  describe("POST /api/questions", () => {
    it("creates a question for an authenticated user", async () => {
      const owner = await createUser();

      const response = await request(app)
        .post("/api/questions")
        .set("Authorization", `Bearer ${tokenFor(owner)}`)
        .send({ title: "New question", description: "Question details", tags: "JavaScript, nodejs" });

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({ success: true, message: "Question created successfully" });
      expect(response.body.data.tags).toHaveLength(2);
      await expect(Question.countDocuments({ author: owner._id })).resolves.toBe(1);
    });

    it("rejects a question without required content", async () => {
      const owner = await createUser();

      const response = await request(app)
        .post("/api/questions")
        .set("Authorization", `Bearer ${tokenFor(owner)}`)
        .send({ title: "Missing description" });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe("Title, description and author are required");
    });

    it("rejects an unauthenticated request", async () => {
      const response = await request(app)
        .post("/api/questions")
        .send({ title: "Question", description: "Details" });

      expect(response.status).toBe(401);
      expect(response.body.message).toBe("No token provided, authorization denied.");
    });
  });

  describe("PUT /api/questions/:id", () => {
    it("updates a question for its owner", async () => {
      const owner = await createUser();
      const question = await createQuestion(owner);

      const response = await request(app)
        .put(`/api/questions/${question.id}`)
        .set("Authorization", `Bearer ${tokenFor(owner)}`)
        .send({ title: "Updated title", tags: "testing" });

      expect(response.status).toBe(200);
      expect(response.body.message).toBe("Question updated successfully");
      expect(response.body.data.title).toBe("Updated title");
      expect(response.body.data.tags).toHaveLength(1);
    });

    it("forbids a different non-admin user", async () => {
      const owner = await createUser();
      const other = await createUser({ email: "other@example.com", name: "Other User" });
      const question = await createQuestion(owner);

      const response = await request(app)
        .put(`/api/questions/${question.id}`)
        .set("Authorization", `Bearer ${tokenFor(other)}`)
        .send({ title: "Unauthorized edit" });

      expect(response.status).toBe(403);
      expect(response.body.message).toBe("Not authorized to update this question");
    });

    it("rejects a missing token", async () => {
      const response = await request(app)
        .put("/api/questions/507f1f77bcf86cd799439011")
        .send({ title: "Unauthorized" });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });

  describe("DELETE /api/questions/:id", () => {
    it("deletes an owned question and its answers", async () => {
      const owner = await createUser();
      const question = await createQuestion(owner);
      await Answer.create({ questionId: question._id, answerText: "Remove me", author: owner._id });

      const response = await request(app)
        .delete(`/api/questions/${question.id}`)
        .set("Authorization", `Bearer ${tokenFor(owner)}`);

      expect(response.status).toBe(200);
      expect(response.body.message).toBe("Question deleted successfully");
      await expect(Question.exists({ _id: question._id })).resolves.toBeNull();
      await expect(Answer.countDocuments({ questionId: question._id })).resolves.toBe(0);
    });

    it("forbids a different non-admin user", async () => {
      const owner = await createUser();
      const other = await createUser({ email: "other@example.com", name: "Other User" });
      const question = await createQuestion(owner);

      const response = await request(app)
        .delete(`/api/questions/${question.id}`)
        .set("Authorization", `Bearer ${tokenFor(other)}`);

      expect(response.status).toBe(403);
      expect(response.body.message).toBe("Not authorized to delete this question");
    });

    it("rejects a missing token", async () => {
      const response = await request(app).delete("/api/questions/507f1f77bcf86cd799439011");

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });

  describe.each([
    ["upvote", "upvoteQuestionService", "Question upvoted successfully"],
    ["downvote", "downvoteQuestionService", "Question downvoted successfully"],
  ])("POST /api/questions/:id/%s", (vote, _, message) => {
    it("records the vote for an authenticated user", async () => {
      const owner = await createUser();
      const question = await createQuestion(owner);

      const response = await request(app)
        .post(`/api/questions/${question.id}/${vote}`)
        .set("Authorization", `Bearer ${tokenFor(owner)}`);

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({ success: true, message });
      expect(response.body.data.voteCount).toBe(vote === "upvote" ? 1 : -1);
    });

    it("rejects a missing token", async () => {
      const response = await request(app).post(`/api/questions/507f1f77bcf86cd799439011/${vote}`);

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it("returns an error for a missing question", async () => {
      const owner = await createUser();

      const response = await request(app)
        .post(`/api/questions/507f1f77bcf86cd799439011/${vote}`)
        .set("Authorization", `Bearer ${tokenFor(owner)}`);

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
    });
  });

  describe("POST /api/questions/:questionId/answers", () => {
    it("creates an answer for an authenticated user", async () => {
      const owner = await createUser();
      const question = await createQuestion(owner);

      const response = await request(app)
        .post(`/api/questions/${question.id}/answers`)
        .set("Authorization", `Bearer ${tokenFor(owner)}`)
        .send({ answerText: "Use the existing test setup." });

      expect(response.status).toBe(201);
      expect(response.body).toMatchObject({ success: true, message: "Answer created successfully" });
      expect(response.body.data.answerText).toBe("Use the existing test setup.");
      await expect(Answer.countDocuments({ questionId: question._id })).resolves.toBe(1);
    });

    it("rejects an answer without text", async () => {
      const owner = await createUser();
      const question = await createQuestion(owner);

      const response = await request(app)
        .post(`/api/questions/${question.id}/answers`)
        .set("Authorization", `Bearer ${tokenFor(owner)}`)
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.message).toBe("Question id, answer text and author are required");
    });

    it("rejects an unauthenticated request", async () => {
      const response = await request(app)
        .post("/api/questions/507f1f77bcf86cd799439011/answers")
        .send({ answerText: "No token" });

      expect(response.status).toBe(401);
      expect(response.body.message).toBe("No token provided, authorization denied.");
    });
  });
});