# Weather Dashboard — Auth Backend

Backend for **Register** and **Login** used by the Dashboard view.

## Setup

1. Install dependencies:
   ```bash
   cd backend
   npm install
   ```

2. Start the server:
   ```bash
   npm start
   ```
   Server runs at **http://localhost:3001** by default.

3. Serve the frontend (from the project root) so the dashboard can call the API:
   ```bash
   npx serve . -p 5000
   ```
   Then open http://localhost:5000, go to the **Dashboard** tab, and register or log in.

## API

- **POST /api/register** — Create account  
  Body: `{ "name": "Your Name", "email": "you@example.com", "password": "min6chars" }`  
  Returns: `{ "user": { "id", "name", "email" }, "token": "jwt..." }`

- **POST /api/login** — Log in  
  Body: `{ "email": "you@example.com", "password": "..." }`  
  Returns: `{ "user": { "id", "name", "email" }, "token": "jwt..." }`

- **GET /api/me** — Current user (send header `Authorization: Bearer <token>`)

- **GET /api/health** — Health check

## Config

- **Port:** set `PORT` (default `3001`).
- **JWT secret:** set `JWT_SECRET` in production.

User data is stored in `users.json` in this folder (created on first register). Passwords are hashed with bcrypt; tokens are JWT with 7-day expiry.
