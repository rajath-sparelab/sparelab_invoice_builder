# Document Engine — Data Model and Backend APIs

This document describes Phase 2 of the SpareLab Configurable Document Builder: the generic document engine, its data model, and the initial REST APIs.

The engine is intentionally **generic** — it is not hardcoded for invoices. It supports tax invoices, proforma invoices, quotations, purchase orders, delivery challans, and any other configurable business document type.

## 1. Domain model

The document engine is built around five core entities:

| Entity | Purpose |
|---|---|
| `DocumentTemplate` | A reusable document template (metadata + lifecycle). |
| `DocumentTemplateVersion` | An immutable, versioned snapshot of a template's layout configuration. |
| `GeneratedDocument` | An actual document generated from a specific published template version. |
| `DocumentRenderJob` | A rendering operation (prepared for future async/Kafka rendering). |
| `DocumentAuditEvent` | An append-only record of important document/template operations. |

## 2. Entity relationships

```mermaid
erDiagram
    DocumentTemplate ||--o{ DocumentTemplateVersion : "has many versions"
    DocumentTemplate }o--|| DocumentTemplateVersion : "current version (logical reference)"
    DocumentTemplateVersion ||--|{ GeneratedDocument : "used to generate many documents"
    DocumentTemplate ||--|{ GeneratedDocument : "owns generated documents"
    GeneratedDocument ||--|{ DocumentRenderJob : "has render jobs"
    DocumentAuditEvent }o--|| DocumentTemplate : "audits template events"
    DocumentAuditEvent }o--|| DocumentTemplateVersion : "audits version events"
    DocumentAuditEvent }o--|| GeneratedDocument : "audits document events"
```

- A `DocumentTemplate` has many `DocumentTemplateVersion`s. `versionNumber` is unique per `(templateId, versionNumber)`.
- `currentVersionId` on `DocumentTemplate` is a logical reference to the latest published version (kept as a plain column to avoid a cyclic foreign key between template and version).
- A `GeneratedDocument` stores an immutable reference to the exact `DocumentTemplateVersion` used (`templateVersionId`), plus a denormalized `templateId`.
- `GeneratedDocument.templateVersionId` uses `ON DELETE RESTRICT`, so a version referenced by any generated document cannot be deleted.
- `DocumentRenderJob.documentId` uses `ON DELETE CASCADE`.
- `DocumentAuditEvent` links are logical (`entityType` + `entityId`); there are no foreign keys so one event table can audit all entity types.

## 3. Prisma model overview

The Prisma schema lives in `apps/api/prisma/schema.prisma`. Enums: `TemplateStatus` (DRAFT/PUBLISHED/ARCHIVED), `VersionStatus` (DRAFT/PUBLISHED), `DocumentStatus` (DRAFT/GENERATED/FAILED), `RenderJobStatus` (PENDING/IN_PROGRESS/COMPLETED/FAILED).

Key fields:

**DocumentTemplate**
- `id` (UUID, PK), `name`, `description?`, `documentType`, `status` (default DRAFT), `currentVersionId?`, `createdBy?`, `createdAt`, `updatedAt`
- Indexes: `documentType`, `status`, `createdAt`
- Relation: `versions` → `DocumentTemplateVersion` (via `templateId`)

**DocumentTemplateVersion**
- `id` (UUID, PK), `templateId`, `versionNumber`, `schemaVersion`, `configuration` (JSONB), `status` (default DRAFT), `createdBy?`, `createdAt`
- Indexes: `templateId`; Unique: `(templateId, versionNumber)`
- Relation: `template` → `DocumentTemplate`

**GeneratedDocument**
- `id` (UUID, PK), `templateId`, `templateVersionId`, `documentType`, `documentNumber?`, `externalReferenceId?`, `data` (JSONB), `status` (default GENERATED), `createdAt`, `updatedAt`
- Indexes: `templateId`, `templateVersionId`, `documentType`, `status`, `createdAt`
- `templateVersion` → `DocumentTemplateVersion` (`ON DELETE RESTRICT`)
- `template` → `DocumentTemplate`

**DocumentRenderJob**
- `id` (UUID, PK), `documentId`, `status` (default PENDING), `errorMessage?`, `startedAt?`, `completedAt?`, `createdAt`
- `document` → `GeneratedDocument` (`ON DELETE CASCADE`)

**DocumentAuditEvent**
- `id` (UUID, PK), `entityType`, `entityId`, `action`, `actorId?`, `metadata?` (JSONB), `createdAt`
- Indexes: `(entityType, entityId)`, `action`, `createdAt`

## 4. Template JSON schema

The template configuration is a versioned JSON document stored in `DocumentTemplateVersion.configuration` (JSONB). It is validated with Zod in the shared contracts package (`@sparelab/contracts`, `packages/contracts/src/schemas/template-config.ts`).

Design principles:
- No executable JavaScript and no arbitrary user-supplied HTML.
- Structured, validated blocks only.
- `schemaVersion` field for future migrations.
- Template configuration is kept separate from generated document data.

Supported block types (this phase): `text`, `image`, `table`. Sections and blocks support `visible` and `visibleWhen` (conditional visibility). Tables support `repeat` for array-backed rows. `style` accepts a whitelist of simple CSS-like properties with scalar values.

```json
{
  "schemaVersion": "1.0.0",
  "page": {
    "size": "A4",
    "orientation": "portrait",
    "margins": { "top": 20, "right": 20, "bottom": 20, "left": 20 }
  },
  "sections": [
    {
      "id": "s1",
      "name": "Header",
      "visible": true,
      "visibleWhen": { "field": "showHeader", "operator": "eq", "value": true },
      "blocks": [
        {
          "id": "b1",
          "type": "text",
          "content": "Tax Invoice",
          "binding": "{{title}}",
          "visible": true,
          "style": { "fontSize": 24, "textAlign": "center" }
        },
        {
          "id": "b2",
          "type": "image",
          "src": "https://cdn.example.com/logo.png",
          "alt": "Logo",
          "width": 120,
          "visibleWhen": { "field": "showLogo", "operator": "exists" }
        },
        {
          "id": "b3",
          "type": "table",
          "repeat": "{{lineItems}}",
          "columns": [
            { "id": "c1", "header": "Item", "key": "item" },
            { "id": "c2", "header": "Amount", "key": "amount" }
          ],
          "rows": [["{{item}}", "{{amount}}"]]
        }
      ]
    }
  ],
  "header": { "blocks": [ { "id": "h1", "type": "text", "content": "Company Name" } ] },
  "footer": { "blocks": [ { "id": "f1", "type": "text", "content": "Page {{page}}", "binding": "{{page}}" } ] }
}
```

- `src` on image blocks must be an `https://`/`http://` URL or a `{{binding}}` reference.
- Bindings use the `{{fieldName}}` / `{{object.field}}` format and reference generated document data. No expressions are evaluated.
- `visibleWhen` uses a structured condition (`field`, `operator`, optional `value`). Supported operators: `eq`, `ne`, `gt`, `gte`, `lt`, `lte`, `in`, `notIn`, `exists`, `notExists`.
- `repeat` binds a table to an array in the document data; each row can use bindings for the current item.
- HTML tags, `javascript:` URLs, event-handler style keys, executable expressions and arbitrary style properties are rejected by the Zod schema. The backend converts validation errors to `400 BadRequest`.

## 5. Document data versus template configuration

| | Template configuration | Generated document data |
|---|---|---|
| Stored in | `DocumentTemplateVersion.configuration` | `GeneratedDocument.data` |
| Purpose | Layout, styling, block definitions | Runtime values bound into the layout |
| Versioned | Yes (per template version) | No (snapshot per generated document) |
| Validated with | `TemplateConfigurationSchema` (Zod) | `DocumentDataSchema` (must be a JSON object) |
| Mutable after publish | No (versions are immutable) | No (snapshot) |

The two are deliberately separate: a change to a template's layout must never alter the data of already-generated documents.

Generated document data must be a plain JSON object (`DocumentDataSchema`). Nested objects, arrays and scalar JSON values are allowed; `undefined`, `NaN`, `Date`, functions and prototype-polluting keys are rejected.

```json
{
  "title": "TAX INVOICE",
  "invoiceNumber": "INV-2026-001",
  "customer": { "name": "Acme Traders", "gstin": "27AABCU9603R1ZM" },
  "showLogo": true,
  "lineItems": [
    { "item": "Widget A", "amount": 1500 },
    { "item": "Widget B", "amount": 2500 }
  ],
  "page": 1
}
```

## 6. Versioning and publishing lifecycle

1. `POST /api/templates` creates a template in `DRAFT` status with an initial version (`versionNumber: 1`, status `DRAFT`). The template's `currentVersionId` points to this version.
2. `POST /api/templates/:id/versions` creates a new draft version with an auto-incremented `versionNumber`. It does **not** change `currentVersionId` or modify earlier versions.
3. Every version is immutable after creation: there is no update endpoint, and the `DocumentTemplateVersion_immutable` PostgreSQL trigger rejects changes to `id`, `templateId`, `versionNumber`, `schemaVersion`, `configuration`, `createdBy` or `createdAt`. Only `status` may change (publishing).
4. `POST /api/templates/:id/publish` publishes the **specific** version supplied as `{ "versionId": "..." }`:
   - The version must belong to the template and still be `DRAFT` (`404` / `409` otherwise).
   - The configuration is validated before publishing.
   - The version becomes `PUBLISHED`; `template.status = PUBLISHED` and `template.currentVersionId` is set to that version.
   - Publishing an already-published version returns `409 Conflict`.
5. Editing a published template therefore means creating a new version and publishing that version. Earlier published versions remain available and unchanged.
6. `POST /api/documents` requires a `templateVersionId` that references a **published** version of a non-archived template. Draft, unknown or mismatched references are rejected (`400` / `404`). The document stores the exact version id forever.

## 7. API endpoint documentation

All endpoints are mounted under the global prefix `/api` (configurable via `API_PREFIX`, default `/api`). Responses use a consistent envelope: single items return `{ data }`, lists return `{ data, meta: { page, limit, total } }`.

### Templates

| Method | Endpoint | Description | Success |
|---|---|---|---|
| `POST` | `/api/templates` | Create a template and its initial draft version | `201` |
| `GET` | `/api/templates` | List templates with pagination (`page`, `limit`) | `200` |
| `GET` | `/api/templates/:id` | Get template metadata and current version | `200` |
| `PATCH` | `/api/templates/:id` | Update template metadata only | `200` |
| `POST` | `/api/templates/:id/versions` | Create a new draft version | `201` |
| `GET` | `/api/templates/:id/versions` | List template versions | `200` |
| `GET` | `/api/templates/:id/versions/:versionId` | Get a specific version | `200` |
| `POST` | `/api/templates/:id/publish` | Publish the specific version in `{ "versionId": "..." }` | `200` |

### Documents

| Method | Endpoint | Description | Success |
|---|---|---|---|
| `POST` | `/api/documents` | Create a document from a published template version | `201` |
| `GET` | `/api/documents` | List generated documents with pagination | `200` |
| `GET` | `/api/documents/:id` | Get document details and template version reference | `200` |

Publish body: `{ "versionId": "<document-template-version-uuid>" }`. Document creation body: `{ "templateVersionId": "...", "documentType": "INVOICE", "data": { ... }, "templateId": "...", "externalReferenceId": "...", "createdBy": "..." }` (only the first three fields are required; `templateId`, when supplied, must match the version's template).

Error handling: `400 BadRequest` for invalid payloads, invalid configuration/data, invalid references or invalid lifecycle transitions; `404 NotFound` for missing resources; `409 Conflict` for attempting to publish an already-published version. Validation errors from the shared Zod contracts are returned as `{ "message": "Validation failed", "errors": [{ "path": "...", "message": "..." }] }`.

## 8. Important architectural decisions

- **Generic, not invoice-hardcoded**: `documentType` is a free-form string (validated at the application layer) so the engine serves invoices, quotations, purchase orders, delivery challans, and future types without schema changes.
- **No `currentVersionId` foreign key**: kept as a plain logical-reference column to avoid a cyclic `template ↔ version` foreign key. Referential integrity that matters (`GeneratedDocument → templateVersionId`) is enforced with `ON DELETE RESTRICT`.
- **Immutable versions**: there is no update-version endpoint, and the `DocumentTemplateVersion_immutable` trigger prevents direct configuration mutation. Publishing only changes `status`.
- **Shared Zod contracts**: `@sparelab/contracts` exports request schemas and types (`createTemplateRequestSchema`, `updateTemplateRequestSchema`, `createTemplateVersionRequestSchema`, `publishTemplateVersionRequestSchema`, `createDocumentRequestSchema`, `paginationQuerySchema`) plus `templateConfigurationSchema`, `documentDataSchema`, `validateTemplateConfiguration` and `validateDocumentData`. Nest controllers validate every body/query through `ZodValidationPipe`; services re-validate configuration and document data before writing.
- **Database transactions**: template + initial version, version + audit, metadata update + audit, publish + template/version updates + audits, and document + audit all run in Prisma `$transaction` calls so audit records cannot be orphaned.
- **Additive migration safety**: the immutability trigger is delivered as a new migration and applied with `prisma migrate deploy`; no table or column is dropped and existing rows are preserved.
- **Prepared for later phases**: `DocumentRenderJob` models the future async rendering flow (Kafka), but no Kafka, Puppeteer, S3, or PDF generation is implemented in this phase. No authentication, RBAC, GST calculations, or invoice numbering either.
- **Shared contracts**: Zod schemas live in `@sparelab/contracts` and are consumed by the backend for server-side validation (and are available to the frontend in later phases).

## 9. Running the engine

Prisma (from the repository root):

```bash
pnpm --filter @sparelab/api prisma:generate              # generate the Prisma client
pnpm --filter @sparelab/api exec prisma migrate deploy   # apply existing migrations additively
pnpm --filter @sparelab/api exec prisma migrate status   # verify database state
```

Use `pnpm --filter @sparelab/api prisma:migrate` (`prisma migrate dev`) only when creating a new migration during development; never reset the database.

Build and test:

```bash
pnpm --filter @sparelab/contracts build      # build shared Zod contracts first
pnpm build:api                               # TypeScript build
pnpm lint                                    # ESLint
pnpm test                                    # Jest (runs serially --runInBand)
```

Environment: `apps/api/.env` provides `DATABASE_URL` (PostgreSQL 16 on port 5433 via docker-compose), `PORT` (default 3001), and `API_PREFIX` (default `/api`).
