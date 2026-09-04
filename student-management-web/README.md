# Student Management Web

Frontend for the Student Management System backend in the sibling
`student-management-system` repository.

## Stack

- Next.js with App Router and TypeScript
- Tailwind CSS
- shadcn/ui

## Features

- Login and registration with the JWT stored in an `HttpOnly` cookie
- Student and course CRUD with search, sort, filters, and pagination
- Contextual enrollment management from student and course detail pages
- Dynamic role, permission, and user-role management
- Responsive sidebar, loading states, empty states, and API error feedback

## Getting Started

Install dependencies, copy the local configuration, and start the development
server:

```bash
npm install
cp .env.example .env.local
npm run dev
```

Edit `.env.local` only when the backend URL differs from the default.

Open [http://localhost:3001](http://localhost:3001). Port `3001` is used so the
NestJS API can continue running on port `3000`.

## Commands

```bash
npm run dev
npm run lint
npm run build
npm run start
```

Add shadcn/ui components as needed:

```bash
npx shadcn@latest add <component>
```

## Backend API

`API_BASE_URL` is server-only. Browser requests go through Next.js route handlers,
which attach the bearer token from a secure cookie before forwarding requests to
NestJS. The default backend address is `http://127.0.0.1:3000`.
