## Plan: Implement Question and Answer Controllers

Implement the two empty controller modules as thin async adapters over the existing service layer. Each controller will extract only the request values specified by the API contract, await the corresponding service, and return `{ success: true, message, data }` for successful responses. Service errors will be allowed to reject into centralized Express error handling.

**Steps**

1. Implement `src/controllers/questionController.js` with named imports from `questionService.js` and exports for all seven requested handlers:
   - `getAllQuestions`: call `getAllQuestionsService()` and return HTTP 200 with the question list.
   - `getQuestionById`: read `req.params.id`, call `getQuestionByIdService(id)`, and return HTTP 200 with the question.
   - `createQuestion`: read `title`, `description`, and `tags` from `req.body`, set `author` to `req.user.id`, call `createQuestionService({ title, description, tags, author })`, and return HTTP 200 with the created question. The `200` status is an explicit project decision because only answer creation was specified as `201`.
   - `updateQuestion`: read `id` and the editable body fields, call `updateQuestionService(id, { title, description, tags }, req.user)`, and return HTTP 200 with the updated question.
   - `deleteQuestion`: call `deleteQuestionService(req.params.id, req.user)` and return HTTP 200 with the deleted question in `data` unless the surrounding assignment contract specifies otherwise.
   - `upvoteQuestion` and `downvoteQuestion`: read `req.params.id` and `req.user.id`, call the matching vote service, and return HTTP 200 with the resulting question.
2. Implement `src/controllers/answerController.js` with named imports from `answerService.js` and exports for all six requested handlers:
   - `getAnswersByQuestionId`: pass `req.params.questionId` to the service and return HTTP 200 with the answer list.
   - `createAnswer`: pass `questionId`, `answerText`, and `req.user.id` as `author` to the service and return HTTP 201 with the created answer in `data`.
   - `updateAnswer`: pass `req.params.answerId`, `req.body.answerText`, and the full `req.user` to the service; return HTTP 200 with the updated answer.
   - `deleteAnswer`: pass `req.params.answerId` and full `req.user` to the service; return HTTP 200 with `success` and `message` only, omitting `data`.
   - `upvoteAnswer` and `downvoteAnswer`: pass `answerId` and `req.user.id` to the matching vote service; return HTTP 200 with the resulting answer.
3. Use descriptive, consistent messages such as `Questions fetched successfully`, `Question fetched successfully`, `Question created successfully`, `Question updated successfully`, `Question deleted successfully`, `Question upvoted successfully`, `Question downvoted successfully`, and corresponding answer messages. Do not add controller-level `try/catch`, validation, authorization, or error translation.
4. Validate the completed controller modules with a syntax/import check and the project test command. Since the repository currently has no matching test files, also verify the service argument mapping and response status/body behavior with focused controller tests or an equivalent direct invocation strategy if test infrastructure permits.

**Relevant files**

- `c:\Users\tatek\OneDrive\Desktop\wk_4_GradedProject\WK4_GradedProject_Starter_Code\devanswers-backend\src\controllers\questionController.js` — implement the seven question handlers.
- `c:\Users\tatek\OneDrive\Desktop\wk_4_GradedProject\WK4_GradedProject_Starter_Code\devanswers-backend\src\controllers\answerController.js` — implement the six answer handlers.
- `c:\Users\tatek\OneDrive\Desktop\wk_4_GradedProject\WK4_GradedProject_Starter_Code\devanswers-backend\src\services\questionService.js` — authoritative question service signatures and return values.
- `c:\Users\tatek\OneDrive\Desktop\wk_4_GradedProject\WK4_GradedProject_Starter_Code\devanswers-backend\src\services\answerService.js` — authoritative answer service signatures and return values.
- `c:\Users\tatek\OneDrive\Desktop\wk_4_GradedProject\WK4_GradedProject_Starter_Code\devanswers-backend\src\middleware\errorHandler.js` — confirms service errors are formatted centrally.

**Verification**

1. Import both controller modules with Node to catch ESM syntax and export errors.
2. Run `npm test`; note that the repository currently reports no matching test files unless focused tests are added.
3. Exercise handlers with mocked services/request/response objects, or add focused tests under `tests/`, to verify each service receives the exact arguments, `createAnswer` returns `201`, and `deleteAnswer` omits `data`.
4. Confirm rejected service promises are not caught or transformed by controllers.

**Decisions**

- Keep scope limited to the two controller files; do not mount the currently placeholder question/answer routes or alter services.
- All controller functions remain async and delegate business logic entirely to services.
- `createQuestion` returns HTTP 200; `createAnswer` returns HTTP 201.
- Question deletion includes the service return value in `data`, because the service returns the deleted document and the request only explicitly requires omitting `data` for answer deletion.

**Further Considerations**

1. The question and answer route files and route registry are currently placeholders, so endpoint-level HTTP verification will remain unavailable until routing is implemented separately.
2. The existing test setup has no matching test files; controller contract tests should be added only if the task scope permits test changes.
