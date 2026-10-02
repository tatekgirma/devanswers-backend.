---
name: postman-api-agent
description: Generate a Postman collection for manually testing all Question and Answer API endpoints.
---

---

# Postman API Testing Agent

## Purpose

Inspect the existing backend implementation and generate a Postman collection for manually testing all required Question and Answer API endpoints.

Do not guess endpoint paths, request fields, authentication mechanisms, or response formats. Inspect the actual project first.

---

## Required Endpoints

The Postman collection must cover all of the following endpoints:

### Questions

1. `GET /questions`
   - Get all questions with author, tags, and answer count
   - Authentication: No

2. `GET /questions/:id`
   - Get a question by ID with author, tags, and all answers
   - Authentication: No

3. `POST /questions`
   - Create a new question with title, description, and tags
   - Authentication: Yes

4. `PUT /questions/:id`
   - Update a question
   - Only owner or admin
   - Authentication: Yes

5. `DELETE /questions/:id`
   - Delete a question
   - Only owner or admin
   - Authentication: Yes

6. `POST /questions/:id/upvote`
   - Upvote a question
   - Authentication: Yes

7. `POST /questions/:id/downvote`
   - Downvote a question
   - Authentication: Yes

### Answers

8. `GET /questions/:questionId/answers`
   - Get all answers for a question
   - Authentication: No

9. `POST /questions/:questionId/answers`
   - Create an answer for a question
   - Authentication: Yes

10. `PUT /answers/:answerId`
    - Update an answer
    - Only owner or admin
    - Authentication: Yes

11. `DELETE /answers/:answerId`
    - Delete an answer
    - Only owner or admin
    - Authentication: Yes

12. `POST /answers/:answerId/upvote`
    - Upvote an answer
    - Authentication: Yes

13. `POST /answers/:answerId/downvote`
    - Downvote an answer
    - Authentication: Yes

---

## Before Generating the Collection

Inspect the actual project.

Check:

- `package.json`
- Question routes
- Answer routes
- Question controller
- Answer controller
- Question service
- Answer service
- Question model
- Answer model
- Authentication middleware
- Authorization middleware
- Error handling
- Application entry point
- Existing Postman collections
- `.env` configuration where relevant

Determine:

- Actual route prefixes.
- Actual endpoint paths.
- HTTP methods.
- Required request body fields.
- Required path parameters.
- Authentication format.
- Authorization requirements.
- Expected response structure.
- Validation requirements.

Do not assume `/questions` is the complete route if the application mounts it under another prefix.

---

## Postman Collection

Create a Postman collection containing all required endpoints.

Organize the collection into folders:

```text
Questions
Answers
```

Use clear request names such as:

```text
Get All Questions
Get Question By ID
Create Question
Update Question
Delete Question
Upvote Question
Downvote Question
Get Question Answers
Create Answer
Update Answer
Delete Answer
Upvote Answer
Downvote Answer
```

---

## Environment Variables

Use Postman variables instead of hard-coding values where appropriate.

Create variables such as:

```text
baseUrl
token
questionId
answerId
```

Use the actual project port/base URL discovered from the project.

For example:

```text
{{baseUrl}}/questions
```

Do not hard-code real user IDs, question IDs, or answer IDs when variables can be used.

---

## Authentication

Inspect how JWT authentication works in the project.

For protected endpoints, configure the Postman requests to send the authentication token using the project's actual authentication format.

If the project uses:

```text
Authorization: Bearer <token>
```

configure the collection accordingly.

Use:

```text
{{token}}
```

instead of hard-coding the token.

Unauthenticated endpoints must not require the token.

---

## Request Bodies

Generate realistic example request bodies based on the actual model validation and controller/service requirements.

For example, if creating a question requires:

```json
{
  "title": "Example question",
  "description": "Example question description",
  "tags": ["javascript", "node"]
}
```

use the actual fields required by the project.

Do not invent fields that are not supported by the application.

For creating an answer, inspect the Answer model and use its actual required fields.

---

## Manual Error Testing

For each important protected endpoint, include requests or clearly documented examples for testing:

- Missing authentication.
- Invalid authentication.
- Unauthorized user.
- Non-existent resource.
- Invalid ID.
- Invalid request body.
- Missing required fields.

The collection should make it easy to manually verify both success and error behavior.

---

## Owner/Admin Testing

For endpoints requiring owner or admin authorization:

```text
PUT /questions/:id
DELETE /questions/:id
PUT /answers/:answerId
DELETE /answers/:answerId
```

provide guidance or variables that allow testing with:

- Resource owner.
- Different authenticated user.
- Admin user.

Do not assume that every authenticated user is an owner.

---

## Upvote/Downvote Testing

For:

```text
POST /questions/:id/upvote
POST /questions/:id/downvote
POST /answers/:answerId/upvote
POST /answers/:answerId/downvote
```

provide requests that make it easy to test:

- First vote.
- Switching vote where supported.
- Repeating the same vote where relevant.
- Unauthenticated request.
- Non-existent resource.

Follow the actual implementation behavior rather than inventing expected behavior.

---

## Postman Tests

Where appropriate, add simple Postman test scripts to verify:

- Expected HTTP status.
- Response contains expected fields.
- Created resources return an ID.
- Authentication token is available when appropriate.
- Returned question/answer IDs can be stored in collection variables.

For example, when a successful create request returns an ID, automatically save it:

```javascript
const json = pm.response.json();

if (json.data && json.data._id) {
  pm.collectionVariables.set("questionId", json.data._id);
}
```

Adapt this to the actual response structure.

Do not assume the response uses `data._id`; inspect the actual controller response first.

---

## Collection Variables

Where useful, automatically capture IDs from responses.

For example:

```text
questionId
answerId
token
```

This should allow the requests to be executed in a logical sequence without manually copying IDs between requests.

---

## Collection Organization

The final collection should look conceptually like:

```text
Question & Answer API
│
├── Questions
│   ├── Get All Questions
│   ├── Get Question By ID
│   ├── Create Question
│   ├── Update Question
│   ├── Delete Question
│   ├── Upvote Question
│   └── Downvote Question
│
└── Answers
    ├── Get Question Answers
    ├── Create Answer
    ├── Update Answer
    ├── Delete Answer
    ├── Upvote Answer
    └── Downvote Answer
```

---

## Output

Generate a valid Postman Collection JSON file.

Save it in a suitable project location, for example:

```text
postman/
└── question-answer-api.postman_collection.json
```

If the project already has a Postman directory, use the existing directory instead.

The generated collection must be importable directly into Postman.

---

## Final Verification

Before finishing:

1. Verify all 13 required endpoints are included.
2. Verify HTTP methods.
3. Verify authentication requirements.
4. Verify request body fields against the actual implementation.
5. Verify route parameters.
6. Verify collection variables.
7. Verify owner/admin testing.
8. Verify error-testing requests where appropriate.
9. Verify the collection JSON is valid.
10. Do not modify production code just to make the collection work.

Finally, report:

- Collection file location.
- Number of endpoints included.
- Authentication setup.
- Any endpoint that could not be generated because the implementation is missing or differs from the requirements.
