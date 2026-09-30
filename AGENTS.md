# Agent Guide

## Project Shape

- This is an ESM Node.js backend using Express 5 and Mongoose.
- Runtime entrypoint: `main.js` loads dotenv, connects to MongoDB through `db.js`, then starts `server.js`.
- HTTP setup lives in `src/app.js`: Helmet, rate limiting, CORS, body parsing, `/api` routes, and centralized error handling.
- Request flow is generally `src/routes/` -> `src/controllers/` -> `src/services/` -> `src/models/`.
- Controllers should delegate business and database work to services. Services own authorization checks and expected HTTP failures via `createAppError(...)`.
- Controllers conventionally return `{ success, message, data }`; errors are formatted by `src/middleware/errorHandler.js`.

## Commands

- Install dependencies: `npm install`
- Run the server: `npm start`
- Run with auto-reload: `npm run dev`
- Run tests: `npm test`
- Clear and reseed the configured database: `npm run populate`

`npm start`, `npm run dev`, and `npm run populate` require a reachable MongoDB instance and a local `.env`. Required variables are documented in `.env.example`: `PORT`, `NODE_ENV`, `MONGODB_URI`, `JWT_SECRET`, and `JWT_EXPIRATION`.

## Development Conventions

- Use ESM imports/exports and explicit `.js` extensions.
- Prefer named exports for services and async service functions.
- Preserve the existing route/controller/service/model boundaries instead of moving database logic into routes or controllers.
- Match the surrounding file's formatting style; the repository currently contains both single- and double-quoted files.
- Use Mongoose timestamps and ObjectId references consistently with the existing models.
- Use `Authorization: Bearer <JWT>` for protected requests. `src/middleware/authHandler.js` verifies the token, loads the user, and sets `req.user`.

## Testing

- Vitest runs in the Node environment with tests matching `tests/**/*.test.js`.
- Tests run serially (`fileParallelism: false`) and can use `mongodb-memory-server` via `tests/setup.js`.
- `supertest` is available for HTTP-level tests.
- The repository currently has no matching test files, so `npm test` reports that no test files were found. Add focused tests under `tests/` when changing behavior.

## Important Boundaries and Pitfalls

- `src/routes/index.js` currently mounts authentication and tag routes. Question and answer route/controller files exist but are placeholders and are not currently mounted; verify the route registry before assuming an endpoint is live.
- `npm run populate` deletes existing users, questions, answers, and tags before inserting seed data. Treat it as destructive and never use it against a shared or production database.
- `.env` is Git-ignored and must be created locally from `.env.example`; do not commit secrets.
- Authentication behavior depends on both `JWT_SECRET` and `JWT_EXPIRATION`.
- Review changes to registration carefully: accepting privileged fields such as `isAdmin` from request input is security-sensitive.

## Useful Reference Files

- Application setup: `src/app.js`
- Database lifecycle: `db.js`, `main.js`
- Authentication: `src/routes/auth.js`, `src/controllers/authController.js`, `src/services/userService.js`
- Tags: `src/routes/tags.js`, `src/controllers/tagController.js`, `src/services/tagService.js`
- Intended question/answer/voting logic: `src/services/questionService.js`, `src/services/answerService.js`, `src/services/voteService.js`
- Middleware: `src/middleware/authHandler.js`, `src/middleware/errorHandler.js`
