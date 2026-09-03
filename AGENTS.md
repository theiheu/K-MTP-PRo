# AGENTS.md - K-MTP-PRo

## Project Identity

K-MTP-PRo is a Vietnamese poultry-farm material management system.

The application manages:

- Products
- Product variants
- Categories
- Farm zones
- Material requisition forms
- Goods receipt notes
- Delivery notes
- Users and roles
- Inventory-related workflows
- Reports
- AI assistance through Gemini
- Supabase/PostgreSQL persistence

The repository is a production-oriented application. Do not treat it as a simple demo.

## 1. Technology Stack

Current primary stack:

- React 19
- TypeScript
- Vite
- React Router 7
- Zustand
- Supabase JS
- PostgreSQL through Supabase
- Google Gemini via `@google/genai`
- Recharts
- `react-hot-toast`
- XLSX / XLSX-JS-Style
- Bun or npm

The project is an ESM application. Do not migrate frameworks or major libraries unless explicitly requested.

## 2. Package Manager

The repository supports both Bun and npm. Bun is preferred when available.

Preferred commands:

```bash
bun install
bun run dev
bun run build
```

Fallback:

```bash
npm install
npm run dev
npm run build
```

Do not change package manager configuration unnecessarily. Do not replace `package-lock.json` or `bun.lockb` unless dependency management explicitly requires it.

## 3. Project Structure

Important directories:

- `components/` - React UI components
- `hooks/` - Custom React hooks
- `lib/` - External/library configuration
- `services/` - Application services and integrations
- `store/` - Zustand/global state
- `types/` - TypeScript domain types
- `utils/` - Shared utility functions
- `supabase/` - Database migrations and Supabase-related files
- `scripts/` - Development/import/utility scripts
- `assets/` - Static assets/icons

Important root files:

- `App.tsx`
- `index.tsx`
- `constants.ts`
- `types.ts`
- `package.json`
- `tsconfig.json`
- `vite.config.ts`

## 4. Architecture Rules

Use this conceptual dependency direction:

```text
UI
  -> Hooks / State
  -> Services
  -> Supabase
  -> PostgreSQL
```

Utilities and types should remain reusable and independent.

Avoid putting database logic directly into UI components. Avoid putting large business rules directly into `App.tsx`. Avoid creating circular dependencies between `components`, `hooks`, `services`, `store`, and `utils`.

## 5. App.tsx Rule

`App.tsx` is an application composition/root component.

Do not continue adding large business logic to `App.tsx`. When a feature becomes substantial, move it into the appropriate `components/`, `hooks/`, `services/`, `store/`, or `utils/` area.

Do not perform a massive `App.tsx` refactor unless explicitly requested.

When touching `App.tsx`:

- Make the smallest required modification.
- Preserve existing routing/navigation.
- Preserve existing application state.
- Avoid unrelated formatting changes.

## 6. Components

Reusable UI belongs in `components/`.

Before creating a new component:

1. Search for a similar existing component.
2. Reuse existing UI patterns.
3. Follow existing naming conventions.
4. Keep business logic outside the component when it becomes substantial.

Prefer `Component -> Hook -> Service` over `Component -> huge inline Supabase logic`.

Do not create generic abstractions prematurely.

## 7. Hooks

Use `hooks/` for reusable React behavior.

Good candidates:

- Data fetching
- Form behavior
- Filtering
- Pagination
- Synchronization
- Reusable UI behavior
- Domain-specific state logic

Do not create a hook merely to move a few lines of trivial code. Avoid hooks that silently perform unrelated side effects.

## 8. Services

Use `services/` for external communication and business-facing data operations.

Existing services include patterns for Supabase and Gemini. Before creating a new service, search existing services and reuse existing Supabase access patterns. Do not duplicate database-query logic across multiple components.

## 9. Supabase

Supabase is the primary persistence layer.

The main database entities include:

- `users`
- `categories`
- `zones`
- `products`
- `variants`
- `requisition_forms`
- `goods_receipt_notes`
- `delivery_notes`

The actual database schema is authoritative. Never assume a field exists.

Before database work:

1. Inspect existing migrations.
2. Inspect relevant TypeScript types.
3. Search existing Supabase queries.
4. Check relationships.
5. Check RLS policies when applicable.
6. Check existing migrations before creating another migration.

## 10. Database Changes

When a schema change is required, prefer a migration. Do not manually modify production database assumptions in application code.

For a new field, keep this layer order consistent:

```text
migration
  -> database
  -> types
  -> service/query
  -> hook/state
  -> UI
```

Do not add a database field and forget to update dependent types or queries.

## 11. Supabase Security

Never expose privileged credentials.

The frontend may use:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

Do not introduce service-role keys, database passwords, or private API keys into frontend code.

Never weaken RLS merely to make a feature work. If permissions are required, determine both UI-level behavior and database-level security. Client-side role checks are not a substitute for database security.

## 12. Gemini / AI

Gemini integration exists in the project.

Before modifying AI functionality, inspect `services/geminiService.ts` and related configuration. Do not expose secret credentials. Do not create another Gemini integration if the existing service can be reused. AI functionality must not break normal application workflows.

## 13. State Management

The project uses Zustand.

Before introducing new global state, ask whether it needs to be global. Prefer local state for UI-only state. Use Zustand for shared application/domain state.

Avoid duplicated sources of truth. Do not store derived data globally when it can be calculated safely from existing state.

## 14. Routing

The application uses React Router.

When adding a page:

1. Inspect existing routing.
2. Follow existing route patterns.
3. Preserve existing navigation.
4. Keep route-specific logic close to the feature.
5. Do not rewrite the router unnecessarily.

## 15. Forms

Follow existing form patterns.

Every important form should consider initial state, validation, loading, success, error, cancel, reset, and duplicate submission. Prevent accidental double submission. Do not introduce another form library without a strong reason.

## 16. Inventory / Material Business Logic

Material-management workflows are core business functionality.

Be careful with:

- Quantities
- Units
- Product variants
- Stock quantities
- Requisitions
- Receipts
- Deliveries
- Status transitions
- Dates
- Zones
- User roles

Never silently change business rules.

Before changing a workflow, trace:

```text
User action
  -> UI
  -> state
  -> service
  -> database
  -> result
  -> UI refresh
```

Check for side effects. For example, receiving goods may affect downstream inventory/requisition state. Do not implement a partial workflow that leaves inconsistent data.

## 17. Status Transitions

Status values should be treated as domain rules.

Before adding or changing a status, search the repository for every use of the existing status.

Check filters, UI badges, buttons, database values, conditional rendering, reports, queries, and statistics. Do not change a status string in only one location.

## 18. Data Consistency

When a transaction affects multiple records, consider atomicity and consistency.

Examples include creating receipt records, updating inventory, completing requisitions, and delivering requested materials.

Avoid sequences where the first database operation succeeds and a later operation fails, leaving inconsistent application state. If the existing architecture has no transaction/RPC mechanism, inspect the current implementation before introducing one. Do not invent transactional behavior without understanding the schema.

## 19. Tables And Lists

For large datasets, prefer filtering, pagination, server-side querying where appropriate, and selective columns. Avoid loading huge datasets unnecessarily.

When modifying existing tables, preserve sorting, filtering, pagination, loading states, empty states, and responsive behavior.

## 20. Reports And Charts

The project uses Recharts.

Before creating a new chart, search for existing report/chart patterns.

Ensure calculations use the correct date range, quantity, status, category, zone, and product. Do not mix display values with raw database values.

## 21. Excel / Import / Export

The repository contains XLSX-related functionality and import scripts.

When changing Excel import/export, preserve existing column mappings, Vietnamese headers, data types, date handling, quantity handling, and duplicate detection. Do not change import formats casually.

For imported data, validate before writing to the database.

## 22. Existing Data

The repository contains legacy/local data and migration-related files, such as `DanhSachVatTu.csv`, `QuanLyVatTu.db`, and `vattu_data.json`.

Do not delete or modify these merely because they appear unused. Determine their purpose first. Some may be required for migration, testing, or reference data.

## 23. Environment Variables

Known configuration includes:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_GEMINI_API_KEY`

Use `.env` locally. Use `env.example` for documented configuration. Never commit real secrets. Never print secrets in logs.

## 24. Dependency Rules

Before installing a package:

1. Search the repository.
2. Check existing dependencies.
3. Check whether native functionality is sufficient.
4. Prefer existing libraries.

Do not add a dependency simply because it is convenient. Avoid introducing duplicate UI libraries, state libraries, HTTP/data libraries, or form libraries.

## 25. TypeScript Rules

Use strict and meaningful types.

Avoid `any`, and especially avoid `as any` when it merely hides a type problem. Prefer domain types from `types/` or `types.ts` when appropriate.

When database schema changes, check related TypeScript types. Do not create multiple competing definitions of the same domain object.

## 26. React Rules

Avoid unnecessary `useEffect`.

Before adding an effect, ask whether it is actually synchronization with an external system.

Prefer event handlers and derived values when possible. Watch for stale closures, incorrect dependencies, duplicate requests, race conditions, memory leaks, and missing cleanup.

## 27. Error Handling

Async operations should appropriately handle loading, success, error, and empty states.

Do not silently swallow errors.

Avoid:

```ts
catch {
}
```

Prefer logging useful developer information, showing a safe user-facing message, and preserving application state. Never expose credentials, SQL details, or internal secrets to users.

## 28. Toast / User Feedback

The project uses `react-hot-toast`.

Reuse the existing toast mechanism. Do not introduce another notification library. Important operations should provide appropriate feedback. Avoid excessive toast notifications.

## 29. Responsive UI

The application targets mobile and desktop.

When modifying UI, check both. Do not solve desktop layouts in a way that breaks mobile. Do not introduce fixed widths without checking small screens.

## 30. Performance

Do not optimize blindly.

Look for real issues such as duplicate Supabase requests, fetching too much data, unnecessary rerenders, expensive calculations during render, repeated filtering/sorting of large arrays, and loading entire datasets when pagination is appropriate.

Prefer simple optimizations.

## 31. Build Validation

After meaningful code changes run:

```bash
bun run build
```

or:

```bash
npm run build
```

The current project exposes `dev`, `build`, and `preview` scripts.

Do not claim a build passes unless it was actually executed.

If build fails:

1. Read the first meaningful error.
2. Fix the root cause.
3. Run build again.

## 32. Testing

The project currently has limited explicit test infrastructure.

Do not invent a testing framework just to satisfy a task.

When no automated test exists, use appropriate validation such as TypeScript compilation, production build, targeted scripts, manual logic inspection, or database/query verification.

If adding a test framework is requested, evaluate the existing project before choosing one.

## 33. Git Safety

Never execute destructive operations automatically.

Do not run:

```bash
git reset --hard
git clean -fd
git push --force
```

unless explicitly requested.

Never overwrite unrelated user changes. Before editing heavily modified files, inspect the current working tree and preserve existing work.

## 34. Codex Efficiency Rules

This project is intentionally developed with limited Codex allowance.

Do:

- Search narrowly.
- Inspect relevant files.
- Reuse existing patterns.
- Implement one feature at a time.
- Validate after meaningful changes.
- Keep progress reports short.

Do not:

- Scan the entire repository for every request.
- Reread unchanged files repeatedly.
- Refactor unrelated code.
- Rewrite entire components unnecessarily.
- Install packages unnecessarily.
- Generate huge explanations.
- Make speculative changes.

## 35. Large Feature Protocol

For large features, use:

1. Discover.
2. Plan.
3. Implement.
4. Validate.
5. Fix.
6. Review.

Do not implement a large feature blindly in one pass.

Example phased approach:

1. Inspect existing schema and architecture.
2. Implement database changes.
3. Implement service/data layer.
4. Implement state/hooks.
5. Implement UI.
6. Implement permissions.
7. Validate.
8. Fix and review.

## 36. Minimal Change Rule

When solving a task, prefer the smallest correct change over the largest clean rewrite.

Do not refactor unrelated code while implementing a feature. If a refactor is genuinely required, explain why before performing a large change.

## 37. Definition Of Done

A task is complete only when:

- Requested behavior exists.
- Existing functionality remains intact.
- Relevant data flow is correct.
- Database changes are consistent.
- Permissions are considered.
- Error states are handled.
- Loading states are handled.
- Mobile behavior is considered.
- No secrets were introduced.
- No unnecessary dependencies were added.
- Build passes.
- No obvious regression remains.

## 38. Final Response Format

After completing a task, report briefly:

```text
Implemented: <feature>
Changed:
- <file>
- <file>
- <file>
Validation:
- Build: passed/failed
- Other checks: ...
Notes:
- <important limitation or follow-up>
```

Do not provide a long essay unless explicitly requested.

## 39. Golden Rule

For K-MTP-PRo:

- Understand the existing system first.
- Reuse existing patterns.
- Change as little as possible.
- Keep business logic consistent.
- Protect the database.
- Protect user data.
- Validate every meaningful change.
- Do not waste context.
- Do not claim success without testing.
