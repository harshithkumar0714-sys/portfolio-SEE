# SmartStudy

SmartStudy is a full-stack study-planning application with a React/TypeScript frontend, Express REST API, JWT-based authentication, and a MySQL 8 relational database managed through Prisma.

## What’s included

- Account registration and sign-in with bcrypt password hashing and role-based access
- Per-user subjects, topics, exam dates, progress, and study sessions
- Weekly planner, Pomodoro focus timer, study streaks, XP, and achievements
- Dashboard, activity insights, revision/weak-topic recommendations
- Subject mock tests, graded attempts, and saved results
- Context-aware study assistant based on the learner’s own subjects, exams, schedule, and topic confidence
- Admin overview and account/role management
- Zod request validation, centralized errors, Helmet security headers, CORS, and API rate limiting

By default, the assistant uses local, context-aware study-planning rules and makes no external requests. To enable a hosted OpenAI-compatible chat model, set `AI_API_KEY` (and optionally `AI_BASE_URL` and `AI_MODEL`) in `backend/.env` or the deployment environment. When enabled, the learner’s question and limited study context (subject/topic names, confidence, exam dates, and upcoming session titles/times) are sent to that configured provider; account email and name are not sent. Keep provider credentials server-side and disclose the provider’s own data-retention terms to learners.

## Requirements

- Node.js 20 or newer
- MySQL 8

## Local setup

1. Create the database and application user in MySQL. For example:

   ```sql
   CREATE DATABASE smartstudy_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   CREATE USER 'smartstudy'@'localhost' IDENTIFIED BY 'choose-a-strong-local-password';
   GRANT ALL PRIVILEGES ON smartstudy_db.* TO 'smartstudy'@'localhost';
   ```

   `database/schema.sql` contains the relational DDL for inspection/reference. Prisma migrations are the canonical way to create or evolve tables.

2. Install workspace dependencies from the repository root:

   ```bash
   npm install
   ```

3. Configure the API:

   ```powershell
   Copy-Item backend\.env.example backend\.env
   ```

   Set `DATABASE_URL` to the MySQL connection string and set `JWT_SECRET` to a cryptographically random secret of at least 32 characters. Keep `.env` out of source control.

4. Apply the Prisma schema and seed the administrator/achievement catalogue:

   ```powershell
   npm run db:generate
   npm run db:migrate
   $env:SEED_ADMIN_PASSWORD = "set-a-unique-password-at-least-12-characters"
   npm run db:seed
   Remove-Item Env:SEED_ADMIN_PASSWORD
   ```

   The seed creates `admin@smartstudy.local` only if that email is not already present. Set a different administrator password before deploying; never use a shared or production default.

5. Configure the frontend if the API is not on its default local URL:

   ```powershell
   Copy-Item frontend\.env.example frontend\.env
   ```

6. Run the API and frontend together:

   ```bash
   npm run dev
   ```

   Frontend: `http://localhost:5173`  
   API health: `http://localhost:4000/api/health`

## Production build

```bash
npm run build
```

Configure `NODE_ENV=production`, `DATABASE_URL`, `JWT_SECRET`, `JWT_EXPIRES_IN`, `PORT`, and `FRONTEND_URL` in the hosting environment. Run `npm run db:deploy` as a controlled deployment step, then `npm run start -w backend`; serve the built frontend from a static host or reverse proxy. Enforce HTTPS and use a production-grade secret manager and MySQL backup policy.

## Data model

`backend/prisma/schema.prisma` defines users, subjects, topics, study sessions, mock tests/questions/attempts, achievements, and user-achievement relations. Foreign keys cascade with user/subject/test ownership. Uniqueness prevents duplicate emails, subject names within an account, topic names within a subject, and repeat achievement awards.

## API overview

All routes are prefixed with `/api`. Except registration/login/health, routes require `Authorization: Bearer <JWT>`.

| Area | Routes |
| --- | --- |
| Auth | `POST /auth/register`, `POST /auth/login`, `GET /auth/me` |
| Dashboard/settings | `GET /dashboard`, `PATCH /profile` |
| Subjects/topics | `GET/POST /subjects`, `PATCH/DELETE /subjects/:id`, `POST /topics`, `PATCH/DELETE /topics/:id` |
| Planner/focus | `GET/POST /sessions`, `POST /sessions/:id/complete`, `DELETE /sessions/:id` |
| Study guidance | `GET /recommendations`, `POST /assistant`, `GET /achievements` |
| Mock tests | `GET/POST /tests`, `GET /tests/:id`, `POST /tests/:id/attempts` |
| Admin | `GET /admin/overview`, `GET /admin/users`, `PATCH /admin/users/:id/role` |
