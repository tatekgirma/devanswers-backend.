import { beforeEach, describe, expect, it, vi } from "vitest";

const questionModel = {
  find: vi.fn(),
  findById: vi.fn(),
  findByIdAndUpdate: vi.fn(),
  create: vi.fn(),
};
const answerModel = {
  countDocuments: vi.fn(),
  find: vi.fn(),
  deleteMany: vi.fn(),
};
const tagModel = { findOneAndUpdate: vi.fn() };
const handleVote = vi.fn();

vi.mock("../../../src/models/Question.js", () => ({ default: questionModel }));
vi.mock("../../../src/models/Answer.js", () => ({ default: answerModel }));
vi.mock("../../../src/models/Tag.js", () => ({ default: tagModel }));
vi.mock("../../../src/services/voteService.js", () => ({ handleVote }));

const {
  createQuestionService,
  deleteQuestionService,
  downvoteQuestionService,
  getAllQuestionsService,
  getQuestionByIdService,
  updateQuestionService,
  upvoteQuestionService,
} = await import("../../../src/services/questionService.js");

const createQuery = result => ({
  populate: vi.fn().mockReturnThis(),
  sort: vi.fn().mockResolvedValue(result),
});

const createQuestionDocument = overrides => ({
  _id: "question-1",
  author: { toString: () => "user-1" },
  tags: [],
  title: "Original title",
  description: "Original description",
  toObject: vi.fn(() => ({
    _id: "question-1",
    title: "Original title",
    description: "Original description",
  })),
  populate: vi.fn().mockResolvedValue({
    toObject: vi.fn(() => ({
      _id: "question-1",
      title: "Original title",
      description: "Original description",
    })),
  }),
  save: vi.fn(),
  deleteOne: vi.fn(),
  ...overrides,
});

beforeEach(() => {
  vi.clearAllMocks();
});

describe("Question service", () => {
  describe("getAllQuestionsService", () => {
    it("returns questions with answer counts", async () => {
      const question = {
        _id: "question-1",
        toObject: () => ({ _id: "question-1", title: "Question" }),
      };
      questionModel.find.mockReturnValue(createQuery([question]));
      answerModel.countDocuments.mockResolvedValue(3);

      await expect(getAllQuestionsService()).resolves.toEqual([
        { _id: "question-1", title: "Question", answerCount: 3 },
      ]);
      expect(answerModel.countDocuments).toHaveBeenCalledWith({ questionId: "question-1" });
    });

    it("throws a not-found error when there are no questions", async () => {
      questionModel.find.mockReturnValue(createQuery([]));

      await expect(getAllQuestionsService()).rejects.toMatchObject({
        message: "No questions found",
        statusCode: 404,
      });
    });

    it("propagates a database error", async () => {
      questionModel.find.mockReturnValue({
        populate: vi.fn().mockReturnThis(),
        sort: vi.fn().mockRejectedValue(new Error("database unavailable")),
      });

      await expect(getAllQuestionsService()).rejects.toThrow("database unavailable");
    });
  });

  describe("getQuestionByIdService", () => {
    it("increments views and returns the question with answers", async () => {
      const question = createQuestionDocument();
      questionModel.findByIdAndUpdate.mockReturnValue({
        populate: vi.fn().mockReturnThis(),
        then: resolve => resolve(question),
      });
      answerModel.find.mockResolvedValue([{ answerText: "Answer" }]);

      await expect(getQuestionByIdService("question-1")).resolves.toEqual({
        _id: "question-1",
        title: "Original title",
        description: "Original description",
        answers: [{ answerText: "Answer" }],
      });
      expect(questionModel.findByIdAndUpdate).toHaveBeenCalledWith(
        "question-1",
        { $inc: { views: 1 } },
        { new: true },
      );
    });

    it("throws when the question does not exist", async () => {
      questionModel.findByIdAndUpdate.mockReturnValue({
        populate: vi.fn().mockReturnThis(),
        then: resolve => resolve(null),
      });

      await expect(getQuestionByIdService("missing")).rejects.toMatchObject({
        message: "Question not found",
        statusCode: 404,
      });
    });

    it("propagates answer lookup failures", async () => {
      const question = createQuestionDocument();
      questionModel.findByIdAndUpdate.mockReturnValue({
        populate: vi.fn().mockReturnThis(),
        then: resolve => resolve(question),
      });
      answerModel.find.mockRejectedValue(new Error("answer lookup failed"));

      await expect(getQuestionByIdService("question-1")).rejects.toThrow("answer lookup failed");
    });
  });

  describe("createQuestionService", () => {
    it("creates a question and normalizes duplicate tag names", async () => {
      tagModel.findOneAndUpdate.mockResolvedValue({ _id: "tag-js" });
      const question = createQuestionDocument();
      questionModel.create.mockResolvedValue(question);

      await expect(createQuestionService({
        title: "New question",
        description: "Details",
        tags: " JavaScript, nodejs, javascript ",
        author: "user-1",
      })).resolves.toEqual({
        _id: "question-1",
        title: "Original title",
        description: "Original description",
      });
      expect(tagModel.findOneAndUpdate).toHaveBeenCalledTimes(2);
      expect(questionModel.create).toHaveBeenCalledWith({
        title: "New question",
        description: "Details",
        tags: ["tag-js", "tag-js"],
        author: "user-1",
      });
    });

    it("allows an omitted tags value", async () => {
      const question = createQuestionDocument();
      questionModel.create.mockResolvedValue(question);

      await createQuestionService({ title: "Title", description: "Body", author: "user-1" });

      expect(tagModel.findOneAndUpdate).not.toHaveBeenCalled();
      expect(questionModel.create).toHaveBeenCalledWith({
        title: "Title",
        description: "Body",
        tags: [],
        author: "user-1",
      });
    });

    it("rejects missing required fields", async () => {
      await expect(createQuestionService({ title: "Title", author: "user-1" })).rejects.toMatchObject({
        message: "Title, description and author are required",
        statusCode: 400,
      });
      expect(questionModel.create).not.toHaveBeenCalled();
    });
  });

  describe("updateQuestionService", () => {
    it("updates an owned question and its tags", async () => {
      const question = createQuestionDocument();
      questionModel.findById.mockResolvedValue(question);
      tagModel.findOneAndUpdate.mockResolvedValue({ _id: "tag-node" });

      await updateQuestionService(
        "question-1",
        { title: "Updated", description: "Changed", tags: "Node, node" },
        { id: "user-1", isAdmin: false },
      );

      expect(question.title).toBe("Updated");
      expect(question.description).toBe("Changed");
      expect(question.tags).toEqual(["tag-node"]);
      expect(question.save).toHaveBeenCalledOnce();
    });

    it("allows an administrator to update another user's question", async () => {
      const question = createQuestionDocument();
      questionModel.findById.mockResolvedValue(question);

      await updateQuestionService("question-1", { title: "Admin edit" }, { id: "admin", isAdmin: true });

      expect(question.title).toBe("Admin edit");
      expect(question.save).toHaveBeenCalledOnce();
    });

    it("rejects a missing question and an unauthorized owner", async () => {
      questionModel.findById.mockResolvedValueOnce(null);
      await expect(updateQuestionService("missing", {}, { id: "user-1", isAdmin: false })).rejects.toMatchObject({ statusCode: 404 });

      questionModel.findById.mockResolvedValueOnce(createQuestionDocument());
      await expect(updateQuestionService("question-1", {}, { id: "other", isAdmin: false })).rejects.toMatchObject({
        message: "Not authorized to update this question",
        statusCode: 403,
      });
    });
  });

  describe("deleteQuestionService", () => {
    it("deletes the question and its answers for the owner", async () => {
      const question = createQuestionDocument();
      questionModel.findById.mockResolvedValue(question);

      await deleteQuestionService("question-1", { id: "user-1", isAdmin: false });

      expect(answerModel.deleteMany).toHaveBeenCalledWith({ questionId: "question-1" });
      expect(question.deleteOne).toHaveBeenCalledOnce();
    });

    it("allows an administrator to delete another user's question", async () => {
      const question = createQuestionDocument();
      questionModel.findById.mockResolvedValue(question);

      await expect(deleteQuestionService("question-1", { id: "admin", isAdmin: true })).resolves.toEqual({
        _id: "question-1",
        title: "Original title",
        description: "Original description",
      });
      expect(question.deleteOne).toHaveBeenCalledOnce();
    });

    it("rejects missing and unauthorized questions", async () => {
      questionModel.findById.mockResolvedValueOnce(null);
      await expect(deleteQuestionService("missing", { id: "user-1" })).rejects.toMatchObject({ statusCode: 404 });

      questionModel.findById.mockResolvedValueOnce(createQuestionDocument());
      await expect(deleteQuestionService("question-1", { id: "other", isAdmin: false })).rejects.toMatchObject({ statusCode: 403 });
    });
  });

  describe.each([
    ["upvoteQuestionService", upvoteQuestionService, "upvote"],
    ["downvoteQuestionService", downvoteQuestionService, "downvote"],
  ])("%s", (name, service, voteType) => {
    it("returns the voted question", async () => {
      const votedQuestion = { _id: "question-1", voteCount: 1 };
      handleVote.mockResolvedValue(votedQuestion);

      await expect(service("question-1", "user-1")).resolves.toEqual(votedQuestion);
      expect(handleVote).toHaveBeenCalledWith(questionModel, "question-1", "user-1", voteType);
    });

    it("rejects when voting cannot return a question", async () => {
      handleVote.mockResolvedValue(null);

      await expect(service("question-1", "user-1")).rejects.toMatchObject({
        message: `Unable to ${voteType} question`,
        statusCode: 400,
      });
    });

    it("propagates vote errors", async () => {
      handleVote.mockRejectedValue(new Error("vote failed"));

      await expect(service("question-1", "user-1")).rejects.toThrow("vote failed");
    });
  });
});