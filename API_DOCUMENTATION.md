# Restaurant Profile Backend API Documentation

## 1. Overview

This document covers the currently implemented API modules in this project:
- Users/Admins
- Restaurants
- Dishes
- Reviews
- Likes

The routes are registered in `src/app/routes/index.ts`.

## 2. Important Wiring Note

As of the current code, `src/app.ts` does not mount `indexRoute`, so these endpoints are documented from route definitions but may not be reachable until router mounting is added.

Recommended mounting pattern in `app.ts`:

```ts
import { indexRoute } from "./app/routes";
app.use("/api/v1", indexRoute);
```

In this documentation, paths are shown relative to `indexRoute` (for example, `/restaurants`, `/dishes`).

## 3. Authentication

Protected endpoints use `authCheck(...)` middleware.

### Auth requirements
- Cookie `better-auth.session_token` must exist and point to a valid non-expired session.
- Cookie `accessToken` must exist and be a valid JWT.
- Role checks are enforced per endpoint.

### Roles in project
- `ADMIN`
- `SUPER_ADMIN`
- `OWNER`
- `CONSUMER`

### Auth-related behavior
- If `better-auth.session_token` is missing, middleware responds with `401`.
- If `accessToken` is missing or invalid, middleware responds with `401`.
- If role is not allowed, middleware throws `403`.

## 4. Standard Response Format

Most controller responses use `sendResponse` and return:

```json
{
  "success": true,
  "data": {},
  "message": "...",
  "meta": null
}
```

For paginated list APIs, `meta` is:

```json
{
  "total": 0,
  "page": 1,
  "limit": 10,
  "totalPages": 0
}
```

## 5. Query Parameters (List APIs)

List APIs using `QueryBuilder` support these common params:
- `searchTerm`
- `page`
- `limit`
- `sortBy`
- `sortOrder` (`asc` or `desc`)
- Module-specific filter fields

Example:

```http
GET /restaurants?searchTerm=dhaka&page=1&limit=10&sortBy=createdAt&sortOrder=desc
```

## 6. Users/Admin API

Base path: `/users`

### 6.1 Create Admin
- Method: `POST`
- Path: `/users/admins`
- Auth: `ADMIN`, `SUPER_ADMIN`

Content types:
- `application/json`
- `multipart/form-data` (file field: `profilePhoto`)

Request body:

```json
{
  "name": "John Admin",
  "email": "john@example.com",
  "password": "StrongPassword123",
  "contactNumber": "01700000000",
  "profilePhoto": "https://example.com/photo.jpg",
  "role": "ADMIN"
}
```

Notes:
- `password` is required and validated.
- On success, access and refresh tokens are set as cookies.

### 6.2 Get All Users
- Method: `GET`
- Path: `/users`
- Auth: `ADMIN`, `SUPER_ADMIN`

### 6.3 Get Admin by User ID
- Method: `GET`
- Path: `/users/admins/:userId`
- Auth: No middleware currently applied in route (public by current code).

### 6.4 Update Admin
- Method: `PATCH`
- Path: `/users/admins/:userId`
- Auth: `ADMIN`, `SUPER_ADMIN`

Content types:
- `application/json`
- `multipart/form-data` (file field: `profilePhoto`)

Request body (all optional):

```json
{
  "name": "Updated Name",
  "email": "updated@example.com",
  "contactNumber": "01711111111",
  "profilePhoto": "https://example.com/new.jpg",
  "role": "SUPER_ADMIN"
}
```

### 6.5 Delete Admin (Soft)
- Method: `DELETE`
- Path: `/users/admins/:userId`
- Auth: `ADMIN`, `SUPER_ADMIN`

Behavior:
- Sets `isDeleted = true`, `deletedAt = now` on `Admin`.
- Sets related `User` fields to `isDeleted = true`, `status = INACTIVE`, and `image = null`.

### 6.6 Get User by ID
- Method: `GET`
- Path: `/users/:userId`
- Auth: `ADMIN`, `SUPER_ADMIN`

### 6.7 Update User
- Method: `PATCH`
- Path: `/users/:userId`
- Auth: `ADMIN`, `SUPER_ADMIN`

Content types:
- `application/json`
- `multipart/form-data` (file field: `profilePhoto`)

Request body (all optional):

```json
{
  "name": "Updated User",
  "image": "https://example.com/new-user-image.jpg",
  "status": "ACTIVE",
  "role": "CONSUMER",
  "isDeleted": false
}
```

Notes:
- If `profilePhoto` file is provided in multipart request, backend stores it into the user's `image` field.

### 6.8 Delete User (Soft)
- Method: `DELETE`
- Path: `/users/:userId`
- Auth: `ADMIN`, `SUPER_ADMIN`

Behavior:
- Deletes existing user image from Cloudinary (if present).
- Sets role-specific profile (`Admin` or `OwnerProfile` or `ReviewerProfile`) to `isDeleted = true`, `deletedAt = now`.
- Sets `User` to `isDeleted = true`, `deletedAt = now`, `status = INACTIVE`, and `image = null`.

## 7. Restaurant API

Base path: `/restaurants`

### Ownership and mutation rules
- Create: any logged-in role (`ADMIN`, `SUPER_ADMIN`, `OWNER`, `CONSUMER`).
- Update/Delete:
- `ADMIN` and `SUPER_ADMIN` can mutate any restaurant.
- `OWNER` and `CONSUMER` can mutate only restaurants they created.

### 7.1 Create Restaurant
- Method: `POST`
- Path: `/restaurants`
- Auth: `ADMIN`, `SUPER_ADMIN`, `OWNER`, `CONSUMER`

Request body:

```json
{
  "name": "Food Hub",
  "description": "Family restaurant",
  "address": "Road 12, House 3",
  "city": "Dhaka",
  "state": "Dhaka",
  "road": "Dhanmondi 12",
  "location": {
    "lat": "23.746",
    "lng": "90.376"
  },
  "contact": "01800000000",
  "images": ["https://example.com/r1.jpg"]
}
```

Note:
- Current validation expects `location.lat` and `location.lng` as strings.

### 7.2 Get Restaurants
- Method: `GET`
- Path: `/restaurants`
- Auth: Public

Common filters:
- `name`, `city`, `state`, `ratingAvg`

### 7.3 Update Restaurant
- Method: `PATCH`
- Path: `/restaurants/:id`
- Auth: `ADMIN`, `SUPER_ADMIN`, `OWNER`, `CONSUMER`
- Ownership enforced in service.

### 7.4 Delete Restaurant (Soft)
- Method: `DELETE`
- Path: `/restaurants/:id`
- Auth: `ADMIN`, `SUPER_ADMIN`, `OWNER`, `CONSUMER`
- Ownership enforced in service.

Behavior:
- Sets `isDeleted = true`, `deletedAt = now`.

## 8. Dish API

Base path: `/dishes`

### Business rules
- Any logged-in user can create dish in any restaurant.
- Each dish belongs to exactly one restaurant (`restaurantId` relation).
- `restaurantId` cannot be changed in update.

### Mutation ownership rules
- Update/Delete:
- `ADMIN` and `SUPER_ADMIN` can mutate any dish.
- `OWNER` and `CONSUMER` can mutate only dishes under restaurants they created.

### 8.1 Create Dish
- Method: `POST`
- Path: `/dishes`
- Auth: `ADMIN`, `SUPER_ADMIN`, `OWNER`, `CONSUMER`

Request body:

```json
{
  "name": "Chicken Burger",
  "description": "Spicy grilled burger",
  "price": 249,
  "image": "https://example.com/dish.jpg",
  "restaurantId": "clx_restaurant_id"
}
```

Behavior:
- Returns `404` if restaurant is not found or soft-deleted.

### 8.2 Get Dishes
- Method: `GET`
- Path: `/dishes`
- Auth: Public

Common filters:
- `name`, `restaurantId`, `price`, `ratingAvg`

### 8.3 Update Dish
- Method: `PATCH`
- Path: `/dishes/:id`
- Auth: `ADMIN`, `SUPER_ADMIN`, `OWNER`, `CONSUMER`

Request body (all optional):

```json
{
  "name": "Chicken Burger XL",
  "description": "Extra cheese",
  "price": 299,
  "image": "https://example.com/dish-new.jpg"
}
```

Behavior:
- Returns `400` if `restaurantId` is attempted in payload.

### 8.4 Delete Dish
- Method: `DELETE`
- Path: `/dishes/:id`
- Auth: `ADMIN`, `SUPER_ADMIN`, `OWNER`, `CONSUMER`
- Hard delete by current implementation.

## 9. Review API

Base path: `/reviews`

### Mutation ownership rules
- Create: any logged-in role.
- Update/Delete:
- `ADMIN` and `SUPER_ADMIN` can mutate any review.
- Other users can mutate only their own reviews.

### Data consistency rules
- If `dishId` is provided, dish must belong to the selected restaurant.
- On create/update/delete, restaurant rating summary is recalculated.
- If review has `dishId`, dish rating summary is also recalculated.

### 9.1 Create Review
- Method: `POST`
- Path: `/reviews`
- Auth: `ADMIN`, `SUPER_ADMIN`, `OWNER`, `CONSUMER`

Request body:

```json
{
  "rating": 5,
  "comment": "Excellent taste",
  "images": ["https://example.com/review.jpg"],
  "restaurantId": "clx_restaurant_id",
  "dishId": "clx_dish_id"
}
```

Behavior:
- `userId` is always taken from authenticated user.
- Returns `400` if `dishId` is not from the given `restaurantId`.

### 9.2 Get Reviews
- Method: `GET`
- Path: `/reviews`
- Auth: Public

Common filters:
- `restaurantId`, `dishId`, `userId`, `rating`

### 9.3 Update Review
- Method: `PATCH`
- Path: `/reviews/:id`
- Auth: `ADMIN`, `SUPER_ADMIN`, `OWNER`, `CONSUMER`

Request body (all optional):

```json
{
  "rating": 4,
  "comment": "Good but can improve",
  "images": ["https://example.com/review-new.jpg"]
}
```

Behavior:
- Changing `userId`, `restaurantId`, or `dishId` is blocked with `400`.

### 9.4 Delete Review
- Method: `DELETE`
- Path: `/reviews/:id`
- Auth: `ADMIN`, `SUPER_ADMIN`, `OWNER`, `CONSUMER`

Behavior:
- Hard delete by current implementation.

## 10. Typical Error Statuses

Depending on module and middleware, common statuses are:
- `400 Bad Request`
- `401 Unauthorized`
- `403 Forbidden`
- `404 Not Found`
- `500 Internal Server Error`

## 11. Like API

Base path: `/likes`

### 11.1 Create Like
- Method: `POST`
- Path: `/likes`
- Auth: `ADMIN`, `SUPER_ADMIN`, `OWNER`, `CONSUMER`

Request body:

```json
{
  "reviewId": "clx_review_id"
}
```

Behavior:
- Creates one like per `(userId, reviewId)` pair.
- Returns `400` if the user already liked the review.
- Returns `404` if review is not found.

### 11.2 Get Likes
- Method: `GET`
- Path: `/likes`
- Auth: Public

Common filters:
- `id`, `userId`, `reviewId`

### 11.3 Get Review Like Summary
- Method: `GET`
- Path: `/likes/reviews/:reviewId`
- Auth: Public

Behavior:
- Returns `{ reviewId, totalLikes }`.
- Returns `404` if review is not found.

### 11.4 Delete Like
- Method: `DELETE`
- Path: `/likes/:reviewId`
- Auth: `ADMIN`, `SUPER_ADMIN`, `OWNER`, `CONSUMER`

Behavior:
- Deletes the current authenticated user's like for the given review.
- Returns `404` if no like exists for that user-review pair.

## 12. Quick Endpoint Summary

### Users/Admins
- `POST /users/admins`
- `GET /users`
- `GET /users/admins/:userId`
- `PATCH /users/admins/:userId`
- `DELETE /users/admins/:userId`
- `GET /users/:userId`
- `PATCH /users/:userId`
- `DELETE /users/:userId`

### Restaurants
- `POST /restaurants`
- `GET /restaurants`
- `PATCH /restaurants/:id`
- `DELETE /restaurants/:id`

### Dishes
- `POST /dishes`
- `GET /dishes`
- `PATCH /dishes/:id`
- `DELETE /dishes/:id`

### Reviews
- `POST /reviews`
- `GET /reviews`
- `PATCH /reviews/:id`
- `DELETE /reviews/:id`

### Likes
- `POST /likes`
- `GET /likes`
- `GET /likes/reviews/:reviewId`
- `DELETE /likes/:reviewId`
