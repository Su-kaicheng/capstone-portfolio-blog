# Portfolio & Blog API — Contract

This is the single source of truth shared by the back-end (`server/`) and the
React client (`client/`). The client must code against this document.

- Local base URL: `http://localhost:3000`
- Deployed base URL: configured in the client with `VITE_API_URL`
- All request/response bodies are JSON (`Content-Type: application/json`).
- Authenticated requests send: `Authorization: Bearer <jwt>`

## Error format

Every error response uses the same shape:

```json
{ "error": { "message": "Human readable explanation" } }
```

Status codes used: `400` validation, `401` not authenticated / bad credentials,
`403` authenticated but forbidden, `404` not found, `409` duplicate account,
`413` JSON body over 32 KB, `429` rate limited, `500` unexpected server error.

## Data shapes

```ts
User (auth responses) = { _id, username, email, role: "user" | "admin", createdAt, updatedAt }
User (populated/public) = { _id, username }
Project = {
  _id, title, description,
  imageUrl: string, repoUrl: string, liveUrl: string,   // may be ""
  user: { _id, username },
  createdAt, updatedAt
}
Post = {
  _id, title, content,
  author: { _id, username },
  createdAt, updatedAt
}
PostDetail = Post & { comments: Comment[] }
Comment = { _id, body, author: { _id, username }, post, createdAt, updatedAt }
Message = { _id, name, email, message, createdAt, updatedAt }
```

## Endpoints

### Health

| Method | Path      | Auth | Body | Success |
| ------ | --------- | ---- | ---- | ------- |
| GET    | `/health` | no   | –    | `200 { status:"ok", uptime:number, db:"connected" }` |
| GET    | `/`       | no   | –    | `200 { name, version, endpoints... }` |

### Users

| Method | Path                | Auth | Body                              | Success | Errors |
| ------ | ------------------- | ---- | --------------------------------- | ------- | ------ |
| POST   | `/api/users/register` | no | `{ username, email, password }` | `201 { success:true, token, user:User }` | 400 invalid, 409 email/username taken |
| POST   | `/api/users/login`    | no | `{ email, password }`           | `200 { success:true, token, user:User }` | 400 invalid input, 401 bad credentials |
| GET    | `/api/users/me`       | yes | –                              | `200 { success:true, user:User }` | 401 |

Validation: `username` 3–30 letters/digits/underscore, `email` valid, `password`
6–72 characters (at most 72 UTF-8 bytes, the bcrypt limit). New accounts always
get role `user`.

### Projects

| Method | Path               | Auth        | Body                                                     | Success |
| ------ | ------------------ | ----------- | -------------------------------------------------------- | ------- |
| GET    | `/api/projects`    | no          | –                                                        | `200 Project[]` |
| GET    | `/api/projects/:id`| no          | –                                                        | `200 Project` (404 unknown id) |
| POST   | `/api/projects`    | yes + admin | `{ title, description, imageUrl?, repoUrl?, liveUrl? }`  | `201 Project` |
| PUT    | `/api/projects/:id`| yes + admin | any subset of the POST body                              | `200 Project` |
| DELETE | `/api/projects/:id`| yes + admin | –                                                        | `204` empty body |

Rules: `title` 3–120 chars, `description` 1–2000 chars. URLs must be `https://`
URLs when non-empty. `user` is set server-side from the JWT (never from the body).
Admin-only write routes return `403` for normal users.

### Blog posts

| Method | Path             | Auth            | Body                    | Success |
| ------ | ---------------- | --------------- | ----------------------- | ------- |
| GET    | `/api/blog`      | no              | –                       | `200 Post[]`, newest first, author populated with username |
| GET    | `/api/blog/:id`  | no              | –                       | `200 PostDetail` (author + comments populated with usernames) |
| POST   | `/api/blog`      | yes             | `{ title, content }`    | `201 Post` |
| PUT    | `/api/blog/:id`  | yes, author only| `{ title?, content? }`  | `200 Post`; `403` when not the author |
| DELETE | `/api/blog/:id`  | yes, author only| –                       | `204`; `403` when not the author |

Rules: `title` 3–120, `content` 1–10000. `author` is set server-side.
`/api/posts` is an alias of `/api/blog` (legacy from Lab 19).

### Comments

| Method | Path                        | Auth | Body          | Success |
| ------ | --------------------------- | ---- | ------------- | ------- |
| GET    | `/api/blog/:postId/comments`| no   | –             | `200 Comment[]`; 404 unknown post |
| POST   | `/api/blog/:postId/comments`| yes  | `{ body }`    | `201 Comment`; 400 invalid, 404 unknown post |

`body` (comment text) is 1–1000 characters. Author is set server-side.

### Contact

| Method | Path           | Auth        | Body                          | Success |
| ------ | -------------- | ----------- | ----------------------------- | ------- |
| POST   | `/api/contact` | no          | `{ name, email, message }`    | `201 { id, message:"Message received" }` |
| GET    | `/api/contact` | yes + admin | –                             | `200 Message[]`, `Cache-Control: no-store` |

Validation: `name` 1–80, valid `email`, `message` 1–2000.

## Security behaviour (from Lab 19)

- `helmet()` security headers on every response.
- CORS only allows `CLIENT_ORIGIN` (comma-separated list allowed) plus
  `http://localhost:5173` for local development.
- JSON request bodies over 32 KB are rejected with `413`.
- `POST /api/users/register` + `POST /api/users/login` share a rate limit of
  10 attempts per IP per 15 minutes (`429` after that).
- `POST /api/contact` is limited to 5 submissions per IP per 15 minutes.
- Auth and inbox responses are sent with `Cache-Control: no-store`.
- Passwords are hashed with bcrypt; the password hash is never returned.

## Demo accounts

Seeded by `npm run seed` in `server/`:

| Role    | Email                  | Password      |
| ------- | ---------------------- | ------------- |
| admin   | `admin@portfolio.dev`  | `Admin123!`   |
| visitor | `visitor@portfolio.dev`| `Visitor123!` |

Registration (`/register`) always creates a normal `user` account.
`npm run admin -- <email>` promotes any registered account to admin.
