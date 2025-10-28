<h1 align="center">cloud-portfolio</h1>

Tech stack: Next.js 15 (App Router) • TypeScript • Tailwind CSS v4 • ESLint

## Scripts

- dev: Start local server at http://localhost:3000
- build: Production build
- start: Start production server
- lint: Run ESLint

## Quick start

```bash
npm install
npm run dev
```

## Project structure

- `src/app` – App Router pages, layouts, and styles (`globals.css`)
- `public` – Static assets
- `next.config.ts`, `tsconfig.json` – Configuration

## Deploy

You can deploy to platforms like Vercel or any Node hosting. Build locally with `npm run build` and serve with `npm start`.

## Blogs: search, pagination, reactions, comments, and views

The Blogs section has been redesigned to match the home page aesthetic and now includes:

- Server-backed search and tag filtering with debounced input
- Cursor-based pagination using DynamoDB LastEvaluatedKey
- Reactions (emoji) and a lightweight comments section
- Real views count that increments once per client per 24 hours
- LinkedIn-only share on article pages

Environment variable:

- `NEXT_PUBLIC_API_ENDPOINT` must point to your API Gateway base URL (set automatically by `aws/apigateway.ps1`).

Backend changes (AWS Lambda `aws/lambda/blogsCRUD.js`):

- GET `/blogs?limit=9&lastKey=...&q=...&tag=...` — list with optional search/tag filters
- POST `/blogs/{id}?action=view` — increment view count
- POST `/blogs/{id}?action=react` — body: `{ emoji: "👍" }`
- POST `/blogs/{id}?action=comment` — body: `{ name: string, content: string }` (with hidden honeypot `website`)

Deploy updated AWS resources:

```powershell
npm run aws:lambda ; npm run aws:api
```

Notes:

- Existing blog items will be backfilled at read-time with default `reactions` and `comments` if absent.
- For anti-spam, comments include a basic honeypot. Consider adding CAPTCHA or rate limiting in production.
