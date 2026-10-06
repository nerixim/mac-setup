---
name: greenfield
description: Stack defaults for a new project the user starts from scratch (nerixim/* repos). Use when scaffolding a new repository, choosing runtime/framework/DB/UI/testing for a new project, or when asked "what stack". Never apply to an existing repo, where its own conventions always win and nothing is retrofitted.
---

# Greenfield stack defaults

Apply only to new projects I start. An existing repo's conventions always win; never retrofit these.

- **Runtime**: Node.js LTS in production. bun only as package manager/script runner: no Bun-only runtime APIs, and vitest over `bun test`.
- **Lint/format**: Biome. **Validation**: Zod v4 (`.safeParse()`, never `.parse()` outside tests).
- **Web app**: Next.js App Router. Server Components for rendering; no Server Actions. Everything the client calls goes through Hono routes (typed RPC client), external callers included.
- **Standalone APIs/workers**: Hono (portable across Node/Lambda/Workers).
- **DB/auth/storage**: Supabase (Postgres).
- **UI**: Tailwind CSS v4 (no `tailwind.config`; theming in `globals.css`), shadcn/ui new-york, `next-themes` for dark mode, `opengraph-image.tsx` + `ImageResponse` over static OG files.
- **Testing**: vitest + Playwright. **Errors**: Sentry.

Commit messages in nerixim/* are English (`type(scope): what changed`); see `/commit`.

最終更新日: 2026-10-05
