# Restaurant Profile Backend

Production-oriented Express + TypeScript backend for a restaurant review platform.

This service provides:
- Email + Google authentication (Better Auth + JWT + cookie sessions)
- Restaurant, dish, review, and like management
- Profile and admin/user management
- Contact-us workflow with email delivery
- Dashboard/public stats and unified creation flow
- Prisma + PostgreSQL persistence

## Table of Contents
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Available Scripts](#available-scripts)
- [Authentication Model](#authentication-model)
- [API Base URL and Conventions](#api-base-url-and-conventions)
- [API Modules and Endpoints](#api-modules-and-endpoints)
- [Global Search](#global-search)
- [Unified Create API](#unified-create-api)
- [Error Handling](#error-handling)
- [Deployment Notes](#deployment-notes)
- [Known Notes](#known-notes)

## Tech Stack
- Runtime: Node.js `20.x`
- Language: TypeScript (`type: module`)
- HTTP: Express 5
- ORM: Prisma 7
- Database: PostgreSQL
- Auth: Better Auth + JWT
- Validation: Zod
- File Upload: Multer + Cloudinary
- Email: Nodemailer + EJS templates
- Package Manager: pnpm

## Project Structure

```text
src/
  app.ts                       # Express app configuration and middleware wiring
  server.ts                    # HTTP bootstrap + shutdown signal handlers
  app/
    lib/
      auth.ts                  # Better Auth integration
      prisma.ts                # Prisma client
    middleware/
      authCheck.ts             # Session + JWT + role guard
      requestValidator.ts      # Zod request validation
      globalErrorHandler.ts    # Centralized error handling
    modules/
      auth/
      user/
      profile/
      restaurant/
      dish/
      review/
      like/
      contact/
      stats/
      search/
      unified/
    routes/index.ts            # Mounts all module routers
    utils/
      token.ts                 # JWT issuance + cookie setters
config/
  env.ts                       # Environment loading + required variable checks
prisma/
  schema/                      # Modular Prisma schema files
  migrations/                  # Migration history
api/
  index.ts                     # Vercel entrypoint
API_DOCUMENTATION.md           # Extended endpoint reference
```

## Getting Started

### 1. Prerequisites
- Node.js `20.x`
- pnpm `>=10`
- PostgreSQL instance

### 2. Install dependencies

```bash
pnpm install
```

### 3. Configure environment
Create `.env` in project root and add required values (see [Environment Variables](#environment-variables)).

### 4. Generate Prisma client and run migrations

```bash
pnpm generate
pnpm migrate
```

### 5. (Optional) Seed super admin

```bash
pnpm seed:admin
```

### 6. Start development server

```bash
pnpm dev
```

Server starts on `PORT` from `.env`.

## Environment Variables

The backend validates required environment variables in `src/config/env.ts` and fails fast if missing.

### Required
- `PORT`
- `NODE_ENV`
- `BETTER_AUTH_URL`
- `DATABASE_URL`
- `BETTER_AUTH_SECRET`
- `ACCESS_TOKEN_SECRET`
- `REFRESH_TOKEN_SECRET`
- `ACCESS_TOKEN_EXPIRES_IN`
- `REFRESH_TOKEN_EXPIRES_IN`
- `BETTER_AUTH_SESSION_TOKEN_EXPIRES_IN`
- `BETTER_AUTH_SESSION_TOKEN_UPDATE_AGE`
- `SUPER_ADMIN_NAME`
- `SUPER_ADMIN_EMAIL`
- `SUPER_ADMIN_PASSWORD`
- `SUPER_ADMIN_PHONE`
- `SUPER_ADMIN_PROFILE_PHOTO_URL`
- `EMAIL_SENDER_SMTP_USER`
- `EMAIL_SENDER_SMTP_PASSWORD`
- `EMAIL_SENDER_SMTP_HOST`
- `EMAIL_SENDER_SMTP_PORT`
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`

### Optional/Derived in current code
- `FRONTEND_URL` (falls back to `http://localhost:3000`)
- `GOOGLE_CALLBACK_URL` (present in config interface)

## Available Scripts
- `pnpm dev`: Run server in watch mode with `tsx`
- `pnpm start`: Run server once with `tsx`
- `pnpm build`: Generate Prisma client and compile TypeScript
- `pnpm migrate`: Run Prisma development migrations
- `pnpm generate`: Generate Prisma client
- `pnpm studio`: Open Prisma Studio
- `pnpm push`: Push schema to DB (no migration files)
- `pnpm pull`: Pull DB schema
- `pnpm seed:admin`: Seed super admin user
- `pnpm lint`: Run ESLint
- `pnpm vercel-build`: Generate Prisma client and deploy migrations

## Authentication Model

Protected routes use `authCheck(...)` middleware and require both:
- `better-auth.session_token` cookie (valid unexpired session in DB)
- `accessToken` cookie (valid JWT)

Role checks are enforced when roles are provided to `authCheck(...)`.

Primary role values:
- `CONSUMER`
- `OWNER`
- `ADMIN`
- `SUPER_ADMIN`

Cookie behavior (`src/app/utils/token.ts`):
- `httpOnly: true`
- `sameSite: "none"`
- `secure: NODE_ENV === "production"`
- `maxAge` is set in milliseconds (seconds value multiplied by `1000`)

Canonical durations used by code:
- Access token: 1 day
- Refresh token: 7 days
- Better Auth session cookie: 1 day

## API Base URL and Conventions

- Root health-like route: `GET /` -> `Hello World!`
- API prefix: `/api/v1`
- Better Auth adapter route: `/api/auth/*`

Most controller responses follow:

```json
{
  "success": true,
  "data": {},
  "message": "...",
  "meta": null
}
```

Pagination metadata typically includes `total`, `page`, `limit`, `totalPages`.

## API Modules and Endpoints

Base URL prefix below assumes `/api/v1`.

### Auth (`/auth`)
- `POST /auth/sign-up/email`
- `POST /auth/sign-in/email`
- `GET /auth/me`
- `GET /auth/refresh-token`
- `POST /auth/change-password`
- `POST /auth/logout`
- `POST /auth/verify-email`
- `POST /auth/resend-otp`
- `POST /auth/forget-password`
- `POST /auth/reset-password`
- `GET /auth/login/google`
- `GET /auth/google/success`
- `GET /auth/google/failure`

### Users/Admins (`/users`)
- `POST /users/admins`
- `GET /users`
- `GET /users/admins/:userId`
- `PATCH /users/admins/:userId`
- `DELETE /users/admins/:userId`
- `GET /users/:userId`
- `PATCH /users/:userId`
- `DELETE /users/:userId`

### Profile (`/profile`)
- `GET /profile/me`
- `PATCH /profile/me/owner`
- `PATCH /profile/me/reviewer`

### Restaurants (`/restaurants`)
- `POST /restaurants`
- `GET /restaurants`
- `GET /restaurants/top-rated`
- `GET /restaurants/me`
- `PATCH /restaurants/me/:id`
- `DELETE /restaurants/me/:id`
- `PATCH /restaurants/:id`
- `DELETE /restaurants/:id`
- `GET /restaurants/:id`

### Dishes (`/dishes`)
- `POST /dishes`
- `GET /dishes`
- `GET /dishes/me`
- `GET /dishes/trending`
- `GET /dishes/restaurants/:restaurantId/trending`
- `GET /dishes/:id`
- `PATCH /dishes/me/:id`
- `DELETE /dishes/me/:id`
- `PATCH /dishes/:id`
- `DELETE /dishes/:id`

### Reviews (`/reviews`)
- `POST /reviews`
- `GET /reviews`
- `GET /reviews/users/:userId`
- `GET /reviews/my`
- `PATCH /reviews/my/:id`
- `DELETE /reviews/my/:id`
- `GET /reviews/:id`
- `PATCH /reviews/:id`
- `DELETE /reviews/:id`

### Likes (`/likes`)
- `POST /likes`
- `POST /likes/toggle`
- `GET /likes`
- `GET /likes/reviews/:reviewId`
- `DELETE /likes/:reviewId`

### Contact Us (`/contact-us`)
- `POST /contact-us`
- `GET /contact-us`
- `GET /contact-us/:id`
- `PATCH /contact-us/:id/status`
- `POST /contact-us/:id/reply`
- `DELETE /contact-us/:id`

### Stats (`/stats`)
- `GET /stats/public`
- `GET /stats`

### Search (`/search`)
- `GET /search`

### Unified (`/unified`)
- `POST /unified/create-all`

For detailed payload examples and per-endpoint business rules, see `API_DOCUMENTATION.md`.

## Global Search

`GET /api/v1/search`

Supported query parameters:
- `searchTerm`
- `scope`: `all | restaurants | dishes | reviews`
- `restaurantId`
- `page`
- `limit`
- `sortOrder`: `asc | desc`

Behavior highlights:
- Returns scoped collections (`restaurants`, `dishes`, `reviews`) plus a merged `combined` list.
- Supports partial matching for text and array-like fields (including tags/ingredients) via service-level filtering when `searchTerm` is provided.

## Unified Create API

`POST /api/v1/unified/create-all`

Purpose:
- Create restaurant + dish + review in one transaction, or reuse existing restaurant/dish and create only remaining entities.

Request type:
- `multipart/form-data`

File fields:
- `restaurantImages` (max 10)
- `dishImages` (max 5)
- `reviewImages` (max 5)

Data field:
- `data` (JSON string payload)

If transaction fails at any stage, changes are rolled back.

## Error Handling

Centralized through `globalErrorHandler`.

Common statuses:
- `400 Bad Request`
- `401 Unauthorized`
- `403 Forbidden`
- `404 Not Found`
- `500 Internal Server Error`

## Deployment Notes

### Vercel
- Entry point: `api/index.ts`
- Build script: `pnpm vercel-build`
- Ensure Prisma migration deploy permissions in production DB.

### CORS
Configured origins include:
- `FRONTEND_URL`
- `BETTER_AUTH_URL`
- `http://localhost:3000`

Credentials are enabled, so frontend requests must send credentials.

## Known Notes
- Test script currently is a placeholder (`pnpm test` exits with error by default).
- Prisma schema is modularized in `prisma/schema/*.prisma` and generates client into `src/generated/prisma`.
- Core domain models include: `User`, `Session`, `Account`, `Verification`, `Admin`, `OwnerProfile`, `ReviewerProfile`, `Restaurant`, `Dish`, `Review`, `Like`, `ContactUs`.
