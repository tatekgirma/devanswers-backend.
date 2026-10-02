# DevAnswers Backend

DevAnswers is a RESTful question-and-answer API for developer communities. Users can register and log in, ask programming questions, add answers, browse by tags, and vote on questions and answers.

## Features

- User registration and JWT-based login
- Password hashing with bcryptjs
- Create, read, update, and delete questions
- Create, read, update, and delete answers
- Upvote and downvote questions and answers
- Question view tracking and answer counts
- Tag browsing and filtering questions by tag
- Ownership and administrator authorization for protected operations
- Security middleware with Helmet, CORS, JSON body limits, and rate limiting
- Unit and integration tests with Vitest, Supertest, and MongoDB Memory Server
- Optional database seeding with sample users, questions, answers, and tags

## Tech Stack

- Node.js with ECMAScript modules
- Express 5
- MongoDB with Mongoose
- JSON Web Tokens for authentication
- bcryptjs for password hashing
- Vitest and Supertest for testing
- Nodemon for development

## Architecture

The API follows a layered structure:

1. Routes receive HTTP requests and apply authentication where required.
2. Controllers translate requests into service calls and format successful responses.
3. Services contain authorization, validation, voting, and database operations.
4. Mongoose models define the User, Question, Answer, and Tag data structures.
5. Centralized error middleware formats application errors.

All API routes are mounted under `/api`.

## Project Structure

```text
.
├── main.js                 # Application entry point and lifecycle management
├── server.js               # Express server start/stop functions
├── db.js                   # MongoDB connection helpers
├── src/
│   ├── app.js              # Express app and middleware configuration
│   ├── controllers/        # HTTP request handlers
│   ├── middleware/         # Authentication and error handling
│   ├── models/             # Mongoose schemas and models
│   ├── routes/             # API route definitions
│   ├── services/           # Business and database logic
│   ├── scripts/            # Database seed scripts
│   └── utils/              # Shared application utilities
├── tests/
│   ├── integration/        # HTTP/API tests
│   ├── unit/               # Service-level tests
│   └── setup.js            # Test database setup
└── postman/                # Postman collection and request definitions
```

## Getting Started

### Prerequisites

- Node.js 18 or newer
- npm
- MongoDB running locally or a reachable MongoDB deployment

### Installation

```bash
npm install
```

Create a `.env` file in the project root. You can use `.env.example` as a starting point:

```bash
cp .env.example .env
```

On Windows PowerShell, use:

```powershell
Copy-Item .env.example .env
```

### Environment Variables

| Variable         | Description                             | Example                                |
| ---------------- | --------------------------------------- | -------------------------------------- |
| `PORT`           | Port used by the API server             | `3000`                                 |
| `NODE_ENV`       | Runtime environment name                | `development`                          |
| `MONGODB_URI`    | MongoDB connection string               | `mongodb://localhost:27017/devanswers` |
| `JWT_SECRET`     | Secret used to sign access tokens       | A long, unique secret                  |
| `JWT_EXPIRATION` | JWT lifetime accepted by `jsonwebtoken` | `7d`                                   |

Do not commit `.env` or production secrets. Replace the example JWT secret before running outside local development.

### Running the API

Start the production-style process:

```bash
npm start
```

Start with automatic reload during development:

```bash
npm run dev
```

When the server is running on the default port, the API is available at `http://localhost:3000/api`.

### Seed Sample Data

The seed script deletes all existing users, questions, answers, and tags in the configured database before inserting sample data. Run it only against a disposable or intentionally reset database:

```bash
npm run populate
```

The seeded users use the password `pass123`.

## Authentication

Register or log in to receive a JWT. Include it on protected requests with the standard Bearer format:

```http
Authorization: Bearer <JWT>
```

Example login request:

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"bob@example.com","password":"pass123"}'
```

Successful responses generally use this shape:

```json
{
  "success": true,
  "message": "...",
  "data": {}
}
```

Errors use `success: false` and include a message. Protected write operations require a valid token and enforce resource ownership or administrator permissions where applicable.

## API Endpoints

### Authentication

| Method | Route                | Description                                          | Auth |
| ------ | -------------------- | ---------------------------------------------------- | ---- |
| `POST` | `/api/auth/register` | Register a user with `name`, `email`, and `password` | No   |
| `POST` | `/api/auth/login`    | Authenticate with `email` and `password`             | No   |

### Questions

| Method   | Route                         | Description                                                        | Auth         |
| -------- | ----------------------------- | ------------------------------------------------------------------ | ------------ |
| `GET`    | `/api/questions`              | List questions with answer counts                                  | No           |
| `GET`    | `/api/questions/:id`          | Get one question, its answers, and increment views                 | No           |
| `POST`   | `/api/questions`              | Create a question with `title`, `description`, and optional `tags` | Bearer token |
| `PUT`    | `/api/questions/:id`          | Update a question                                                  | Bearer token |
| `DELETE` | `/api/questions/:id`          | Delete a question                                                  | Bearer token |
| `POST`   | `/api/questions/:id/upvote`   | Upvote a question                                                  | Bearer token |
| `POST`   | `/api/questions/:id/downvote` | Downvote a question                                                | Bearer token |

### Answers

| Method   | Route                                | Description                        | Auth         |
| -------- | ------------------------------------ | ---------------------------------- | ------------ |
| `GET`    | `/api/questions/:questionId/answers` | List answers for a question        | No           |
| `POST`   | `/api/questions/:questionId/answers` | Create an answer with `answerText` | Bearer token |
| `PUT`    | `/api/answers/:answerId`             | Update an answer with `answerText` | Bearer token |
| `DELETE` | `/api/answers/:answerId`             | Delete an answer                   | Bearer token |
| `POST`   | `/api/answers/:answerId/upvote`      | Upvote an answer                   | Bearer token |
| `POST`   | `/api/answers/:answerId/downvote`    | Downvote an answer                 | Bearer token |

### Tags

| Method | Route                        | Description                          | Auth |
| ------ | ---------------------------- | ------------------------------------ | ---- |
| `GET`  | `/api/tags`                  | List tags and their question counts  | No   |
| `GET`  | `/api/tags/:tagId/questions` | List questions associated with a tag | No   |

## Data Model

- **User**: name, email, hashed password, profile image, administrator flag, and timestamps.
- **Question**: title, description, author, tags, votes, vote count, views, and timestamps.
- **Answer**: question reference, answer text, author, votes, vote count, and timestamps.
- **Tag**: unique name and creation timestamp.

## Testing

Run the complete test suite:

```bash
npm test
```

Tests run in a Node environment and use an in-memory MongoDB instance for integration coverage. The test suite does not require the development MongoDB database.

## Postman Collection

The `postman/` directory contains a collection and request definitions for authentication, question, answer, voting, and tag workflows. Import `postman/question-answer-api.postman_collection.json` into Postman after starting the API.

## License

This project is currently marked as `ISC` in `package.json`.
