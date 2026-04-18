# K-Vocal AI — Project Notes

## Overview
AI-powered Korean pronunciation learning app. Next.js 15, Prisma 5.22, PostgreSQL, Google Gemini AI. Focused on teaching 연음 (liaison) in Korean speech.

## Stack
- **Framework**: Next.js 15 (App Router)
- **Auth**: Demo password (cookie-based, no OAuth)
- **ORM**: Prisma 5.22
- **Database**: Replit PostgreSQL (`DATABASE_URL`)
- **AI**: Google Gemini 2.5 Flash
- **Deployment**: Vercel at https://kvoice-ai.vercel.app/

## Key Architecture

### Auth Flow
- Simple cookie-based demo auth (`lib/demo-auth.ts`)
- Password stored in `DEMO_PASSWORD` env secret
- `getDemoSession()` reads `demo_auth` cookie — returns user or null
- All protected API routes call `getDemoSession()` and return 401 if null

### Database
- Uses Replit's native `DATABASE_URL` (PostgreSQL)
- Prisma schema in `prisma/schema.prisma`
- Lesson JSON files in `data/lessons/` are the source of truth — DB is seeded from them

### Lesson Loading
- `app/api/lessons/[id]/route.ts` — checks DB first, falls back to JSON file and auto-seeds

## Replit-Specific Fixes

### Webpack Watch Loop Fix
`.local/state/replit/agent/` files trigger false HMR rebuilds. Fix in `next.config.ts`:
```typescript
ignored: ['**/node_modules/**', '**/.git/**', '**/.next/**', '**/.local/**', '**/.config/**']
```

### Cross-Origin Dev Origins
```typescript
allowedDevOrigins: replitDomain ? [replitDomain, `*.${replitDomain.split('.').slice(1).join('.')}`] : []
```

### Server External Packages
```typescript
serverExternalPackages: ['@prisma/client', 'prisma']
```

## Environment Variables

| Variable | Where | Purpose |
|---|---|---|
| `DATABASE_URL` | Replit (auto) | PostgreSQL connection |
| `DEMO_PASSWORD` | Replit Secret | Demo login password |
| `GEMINI_API_KEY` | Replit Secret | Gemini AI API key |

## Setup After Clone
```bash
npx prisma db push
npm run seed
npm run dev
```

## Git Convention
- Regular commits — no squashing into a single init commit
- Author: `Huong Tran <tranthuhuong.work@gmail.com>`
- Remote: `github.com/huongtran-work/kvocal-pro`

## Key Files
- `prisma/schema.prisma` — DB schema (Lesson, UserProgress, User, Session, Account)
- `lib/db.ts` — Prisma client singleton
- `lib/demo-auth.ts` — Demo session helper
- `contexts/AuthContext.tsx` — Auth context
- `components/TopicLessons.tsx` — Main lesson UI
- `next.config.ts` — Next.js config with Replit fixes
- `scripts/prisma-seed.ts` — Seed lessons from JSON to DB
- `scripts/regen-lessons.ts` — Regenerate lessons via Gemini
