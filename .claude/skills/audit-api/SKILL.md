---
name: audit-api
description: API route denetimi. Tum route'larin 10-adim pattern uyumunu kontrol eder. Usage: /audit-api
---

# API Route Audit

Verify all API routes in `app/api/` follow the established 10-step pattern.

## The 10-Step Pattern

Based on the reference implementations:

1. **Auth check** — `createSupabaseServer()` + `getUser()`
2. **AI null check** — `if (!ai)` returns 503 (AI routes only)
3. **Rate limit** — `checkRateLimit(serviceClient, userId, category)`
4. **Budget guard** — `checkBudget(serviceClient, userId)`
5. **Input validation** — Zod schema parsing with `safeParse()`
6. **Data fetch** — Retrieve project/resource from DB
7. **AI call** — Model invocation with `parseAiJson()` for response parsing
8. **Save results** — Write to DB via `createServiceClient()`
9. **Log usage** — Insert into `mkt_usage_logs`
10. **Return response** — JSON response with appropriate status

## Step 1: Discover All Routes

Find all `route.ts` files under `app/api/`:
- `app/api/ai/` — AI-powered routes (need all 10 steps)
- `app/api/generate/` — Media generation routes (need all 10 steps)
- `app/api/ads/` — Ad management
- `app/api/campaigns/` — Campaign routes
- `app/api/context/` — Context fetching
- `app/api/code-context/` — Code context routes
- Other route directories

## Step 2: Audit Each Route

For each route file, check which steps are present:

### Required for ALL routes:
- [ ] Auth check (createSupabaseServer + getUser)
- [ ] Input validation (zod or manual)
- [ ] Error handling (try/catch)
- [ ] Proper status codes (401, 400, 429, 500)

### Required for AI routes (ai/, generate/):
- [ ] AI null check (if (!ai))
- [ ] Rate limiting (checkRateLimit)
- [ ] Budget guard (checkBudget)
- [ ] Usage logging (mkt_usage_logs insert)
- [ ] parseAiJson() for Gemini responses

## Step 3: Output Format

```
📋 API Route Denetim Raporu

## Tam Uyumlu Rotalar (X/Y)
✅ app/api/ai/strategy/route.ts — 10/10
✅ app/api/ai/scenes/route.ts — 10/10

## Eksik Adimlar
⚠️ app/api/ai/captions/route.ts — 8/10
   - Eksik: Budget guard
   - Eksik: Usage logging

## Non-AI Rotalar (auth + validation yeterli)
ℹ️ app/api/ads/publish/route.ts — Auth ✅ Validation ✅

## Ozet
- AI rotalar: X/Y tam uyumlu
- Non-AI rotalar: X/Y guvenli
- Toplam eksik adim: Z
```

## Important Rules
- This is a READ-ONLY audit — never modify code
- AI routes are in `app/api/ai/` and `app/api/generate/`
- Non-AI routes don't need budget/AI checks but MUST have auth + validation
- All tables use mkt_ prefix
