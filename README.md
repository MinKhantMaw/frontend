# Laravel RBAC Admin Frontend Template

Modern React admin dashboard template for Laravel starter kits with authentication, user CRUD, and role/permission management.

## Tech Stack

- React 19 + Vite
- React Router
- Axios
- Context API
- Tailwind CSS
- shadcn-style UI components (Radix primitives)
- Sonner toast notifications

## Core Features

- Login flow with token persistence and `/auth/me` hydration
- Axios interceptor for Bearer token + automatic logout on `401`
- Protected routes with permission and role-based guards
- Super Admin bypass for authorization checks
- Responsive admin shell (sidebar, header, breadcrumb)
- User CRUD with role assignment during create/update
- Role CRUD with permission checkbox assignment
- Permission CRUD
- Permission matrix viewer (roles x permissions)
- UI-level authorization:
  - hide unauthorized actions
  - disable restricted actions with tooltip reason
  - denied-action toast feedback + local audit log
- Permission cache in local storage with TTL

## API Compatibility

Supports common Laravel response formats, including nested payloads:

```json
{
  "message": "Logged in successfully",
  "data": {
    "access_token": "...",
    "user": {
      "id": 1,
      "name": "Admin",
      "email": "admin@example.com",
      "status": "ACTIVE",
      "role": { "label": "Admin", "name": "admin" }
    }
  }
}
```

## Expected API Endpoints

- `POST /api/v1/auth/login`
- `POST /api/v1/auth/logout`
- `GET /api/v1/auth/me`
- `GET/POST/PUT/DELETE /api/v1/users`
- `GET/POST/PUT/DELETE /api/v1/roles`
- `GET/POST/PUT/DELETE /api/v1/permissions`

## Frontend Folder Architecture

```text
src/
  api/
  auth/
  components/
  contexts/
  layouts/
  pages/
  routes/
  services/
  utils/
```

## Setup

```bash
npm install
cp .env.example .env
npm run dev
```
