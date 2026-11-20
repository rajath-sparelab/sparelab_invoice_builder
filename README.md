# SpareLab Configurable Document Builder

Initial foundation of the SpareLab Configurable Document Builder — a monorepo for building configurable documents (invoices and beyond).

> This is the initial project foundation only. Authentication, RBAC, templates, GST calculations, the drag-and-drop editor, PDF generation, Kafka, S3, and the full business schema are planned for later phases.

## Architecture

| Layer | Technology |
|---|---|
| Monorepo | pnpm workspaces |
| Frontend | Next.js 15, React 19, TypeScript (App Router) |
| Styling | Tailwind CSS |
| Future editor | dnd-kit |
| Backend | NestJS 11 (REST) |
| Database | PostgreSQL 16 |
| ORM | Prisma |
| Frontend validation | Zod |
| Backend validation | class-validator |
| Future PDF | React HTML/CSS renderer + Puppeteer |
| Future jobs | Apache Kafka |
| Future storage | S3-compatible object storage |
| Testing | Jest, React Testing Library, Playwright (E2E to be added) |

## Repository structure

```text
repository-root/
├── apps/
│   ├── web/          # Next.js frontend (port 3000)
│   └── api/          # NestJS backend (port 3001)
├── packages/
│   └── contracts/    # Shared Zod schemas and types (@sparelab/contracts)
├── infrastructure/
│   └── docker/
├── docs/
├── docker-compose.yml       # PostgreSQL 16 (document-builder-postgres, 5433:5432)
├── pnpm-workspace.yaml
├── package.json
├── .gitignore
└── README.md
```

## Prerequisites

- Node.js >= 20
- pnpm >= 11
- Docker & Docker Compose (for PostgreSQL)

## Installation

```bash
# Install workspace dependencies
pnpm install

# Generate the Prisma client
pnpm --filter @sparelab/api prisma:generate
```

## Environment configuration

Create `.env` files from the examples (never commit real values — `.env*` is gitignored):

```bash
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env.local
```

### Backend (`apps/api/.env`)

```ini
DATABASE_URL="postgresql://document_builder:document_builder_dev@localhost:5433/document_builder?schema=public"
PORT=3001
NODE_ENV=development
API_PREFIX=/api
CORS_ORIGIN=http://localhost:3000
```

### Frontend (`apps/web/.env.local`)

```ini
NEXT_PUBLIC_API_URL=http://localhost:3001/api
```

## Database setup

PostgreSQL 16 is orchestrated with Docker Compose:

```bash
docker compose up -d
```

This starts `document-builder-postgres`:
- Database: `document_builder`
- User: `document_builder`
- Password: `document_builder_dev`
- Host port: `5433` (container: `5432`)
- Persistent volume: `postgres_data`

Verify connectivity:

```bash
PGPASSWORD=document_builder_dev psql -h localhost -p 5433 -U document_builder -d document_builder -c "SELECT 1"
```

No business schema is created yet — the Prisma schema is intentionally empty for this foundation phase.

## Development commands

Run from the repository root:

| Command | Description |
|---|---|
| `pnpm dev:web` | Start Next.js dev server (Next.js default port 3000) |
| `pnpm dev:api` | Start NestJS in watch mode (port 3001) |
| `pnpm build:web` | Frontend production build |
| `pnpm build:api` | Backend production build |
| `pnpm lint` | ESLint across all workspaces |
| `pnpm test` | Jest tests across all workspaces |

Per-package:

```bash
pnpm --filter @sparelab/web dev
pnpm --filter @sparelab/api dev
pnpm --filter @sparelab/contracts build
```

## API health endpoint

```http
GET /api/health
```

Response:

```json
{
  "status": "up",
  "database": {
    "status": "up"
  }
}
```

The health endpoint checks the API and the PostgreSQL connection (via Prisma `SELECT 1`). The frontend calls this endpoint through a reusable API service (`apps/web/src/services/api.ts`) and displays backend/database connection status on the dashboard. The frontend never connects to PostgreSQL directly.

## Build and lint

```bash
pnpm build:web   # next build  -> apps/web/.next
pnpm build:api   # nest build  -> apps/api/dist
pnpm lint        # eslint across workspaces
```

## Notes

- Backend default port is `3001`; CORS is restricted to the frontend development origin (`http://localhost:3000`).
- `@sparelab/contracts` holds shared Zod schemas consumed by the frontend for response validation.
