# BizLink (LinkID) — Business Matching Platform

BizLink is a curated, invite-only business matching platform designed to connect startup founders, freelancers, consultants, and corporate development teams for high-value business collaborations. Access is gated via transactional credentials issued upon admin approval of cohort registrations.

This repository is structured as a **decoupled monorepo** managed using Bun workspaces.

---

## 🛠️ Tech Stack & Directory Layout

### Technology Stack:
*   **Runtime:** [Bun](https://bun.sh/) (Backend, package runner) & [Node.js](https://nodejs.org/) (Next.js engine)
*   **Frontend (`apps/web`):** Next.js 14 (App Router), Tailwind CSS, shadcn/ui. Deployed to **Netlify**.
*   **API Backend (`apps/api`):** Bun + ElysiaJS, CORS, cookies, Swagger. Deployed to **Railway**.
*   **Database:** MySQL 8 managed on **Railway** / PlanetScale.
*   **ORM:** Drizzle ORM (type-safe schema and migration tool).
*   **Auth:** Stateless custom JWTs signed via the `jose` library and set in `httpOnly` secure cookies.
*   **Type Safety:** End-to-end type safety between API and Frontend using **Elysia Eden Treaty**.

### Directory Structure:
```
bizlink/
├── apps/
│   ├── api/          # ElysiaJS Backend API (Bun)
│   └── web/          # Next.js 14 Web Application (Tailwind)
├── packages/
│   └── types/        # Shared Drizzle & Elysia App Types
├── package.json      # Monorepo Workspace Configuration
└── README.md
```

---

## 🚀 Getting Started & Local Setup

### Prerequisites
Make sure you have [Homebrew](https://brew.sh/) installed, and run:
```bash
brew install node
brew tap oven-sh/bun
brew install bun
```

### 1. Install Dependencies
Run from the root directory:
```bash
bun install
```

### 2. Configure Environment Variables
Create the required local environment files:

#### Backend (`apps/api/.env`):
```env
PORT=3001
DATABASE_URL=mysql://root:password@127.0.0.1:3306/bizlink
JWT_SECRET=your-random-64-character-jwt-signing-secret
JWT_EXPIRES_IN=7d
RESEND_API_KEY=re_your_api_key
RESEND_FROM_EMAIL=noreply@yourdomain.com
ALLOWED_ORIGIN=http://localhost:3000
```

#### Frontend (`apps/web/.env.local`):
```env
NEXT_PUBLIC_API_URL=http://localhost:3001
API_URL=http://localhost:3001
```

### 3. Setup Database (Drizzle ORM)
Drizzle Kit will compile the TypeScript schema and generate/apply local migrations to your MySQL database:
```bash
# Generate migrations SQL
bun run db:generate

# Apply migrations to your MySQL DB
bun run db:migrate

# Seed initial categories, tags, industries, and adjacency weights
bun run db:seed
```

### 4. Running the Development Servers
You can launch both the frontend and backend in watch mode simultaneously:
```bash
# Launch API (http://localhost:3001)
bun dev:api

# Launch Next.js Web App (http://localhost:3000)
bun dev:web
```

---

## 🔍 API & Webhook Specifications

### Interactive API documentation:
When the API dev server is running, visit **[http://localhost:3001/swagger](http://localhost:3001/swagger)** to view the interactive OpenAPI/Swagger page.

### Tally.so Webhook Integration:
Configure Tally webhook integration to forward form submissions to:
`POST /webhooks/registration`

---

## 📄 License
Curated B2B Networking Platform proprietary codebase.
&copy; 2026 BizLink Business Matching Platform.
