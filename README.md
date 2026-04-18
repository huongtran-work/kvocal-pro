# K-Vocal AI

AI-powered Korean pronunciation learning app focused on **연음 (liaison)** — the most natural and challenging aspect of spoken Korean.

Live demo: **[kvoice-ai.vercel.app](https://kvoice-ai.vercel.app)**

![K-Vocal AI Screenshot](public/screenshot.jpeg)

---

## Features

- **40+ lesson topics** across 3 levels: Beginner, Intermediate, Advanced
- **연음 (Liaison) focus** — each lesson highlights real pronunciation linking examples
- **Ruby text annotations** — pronunciation displayed above each Korean word
- **AI pronunciation evaluation** — record yourself and get scored by Gemini AI
- **Text-to-speech** — hear the correct pronunciation via AI audio
- **Progress tracking** — best scores and completion status per topic

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS |
| Database | PostgreSQL + Prisma 5.22 |
| AI | Google Gemini 2.5 Flash |
| Auth | Demo password (cookie-based) |

---

## Run Locally

**Prerequisites:** Node.js 18+, PostgreSQL database, Gemini API key

1. Clone the repo and install dependencies:
   ```bash
   git clone https://github.com/huongtran-work/KoreanPronunciationPro
   cd KoreanPronunciationPro
   npm install
   ```

2. Copy and fill environment variables:
   ```bash
   cp .env.example .env.local
   ```

   Required variables:
   ```env
   DATABASE_URL=postgresql://user:password@host:5432/dbname
   DEMO_PASSWORD=your-chosen-password
   GEMINI_API_KEY=your-gemini-api-key
   ```

3. Push schema and seed lessons:
   ```bash
   npx prisma db push
   npm run seed
   ```

4. Start the dev server:
   ```bash
   npm run dev
   ```

   App runs at `http://localhost:5000`

---

## Regenerate Lessons

To regenerate lesson texts with more liaison (연음) examples:

```bash
GEMINI_API_KEY=your-key tsx scripts/regen-lessons.ts
```

The script skips lessons that already have enough examples and respects the Gemini free-tier rate limit (5 RPM).

---

## Deployment

1. Connect the GitHub repo to your hosting provider
2. Set environment variables: `DATABASE_URL`, `DEMO_PASSWORD`, `GEMINI_API_KEY`
3. Build command: `prisma generate && next build`
4. Start command: `npm start`

---

## Project Structure

```
app/
  api/
    auth/demo/        # Demo login / logout / session endpoints
    generate/         # AI lesson generation
    evaluate/         # AI pronunciation scoring
    tts/              # Text-to-speech
    lessons/          # Lesson CRUD + seed
    user/progress/    # Progress tracking
components/
  LoginPage.tsx       # Login form
  MainApp.tsx         # App shell
  TopicLessons.tsx    # Lesson layout with ruby text
contexts/
  AuthContext.tsx     # Cookie-based auth context
data/lessons/         # 40 lesson JSON files (source of truth)
lib/
  db.ts               # Prisma client singleton
  demo-auth.ts        # Demo session helper
scripts/
  prisma-seed.ts      # Seed lessons from JSON files to DB
  regen-lessons.ts    # Regenerate lessons via Gemini API
```

---

## License

MIT
