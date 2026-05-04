# Coding Standards

- TypeScript strict mode — always. No `any`.
- Next.js App Router — always. No Pages Router.
- Tailwind CSS — always. No inline styles.
- All types in src/types/
- All utilities in src/lib/utils/
- All constants in src/config/
- All API routes in src/app/api/
- UUID for all primary keys
- Zod validation on all API inputs
- Async/await — no raw .then() chains
- Error handling on every async call
- No console.log in production code — use proper logger
- tenant_id on every database query
- Auth check on every non-public API route
