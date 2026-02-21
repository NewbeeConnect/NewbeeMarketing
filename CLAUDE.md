# Newbee Marketing Hub - Complete Project Documentation

> Enterprise AI marketing platform that generates video/image ads using Google AI (Gemini, Veo, Imagen) and distributes them to Google Ads & Meta Ads.
> Owner: Caglar Biber | GitHub: `NewbeeConnect/newbeemarketing` | Language: Turkish

---

## Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Framework | Next.js (App Router, Turbopack) | 16.1.6 |
| UI | React + TypeScript | 19.2.3 / 5.x |
| Styling | Tailwind CSS 4 + shadcn/ui (radix-ui) | 4.x |
| State | TanStack React Query 5 (no Zustand/Redux) | 5.90+ |
| Database | Supabase (PostgreSQL + Auth + Storage) | 2.97+ |
| AI | Google Gemini 2.5 Pro/Flash, Veo 3.1, Imagen 4, Cloud TTS | @google/genai |
| Forms | react-hook-form + zod | 7.x / 4.x |
| Scraping | cheerio | 1.2+ |
| Icons | lucide-react | 0.575+ |
| Dates | date-fns | 4.x |
| Toasts | sonner | 2.x |
| Hosting | Vercel | - |

---

## Project Structure

```
app/
├── (app)/                    # Authenticated layout (sidebar + main)
│   ├── layout.tsx            # SidebarProvider + AppSidebar wrapper
│   ├── dashboard/page.tsx    # Stats, budget, quick actions, AI insights
│   ├── brand/page.tsx        # Brand kit manager
│   ├── campaigns/
│   │   ├── page.tsx          # Campaign list with search/filter
│   │   ├── new/page.tsx      # Campaign creation form
│   │   └── [campaignId]/
│   │       ├── page.tsx      # Campaign detail + projects + deployments
│   │       └── publish/page.tsx # Ad publish flow (targeting, budget, creative)
│   ├── projects/
│   │   ├── page.tsx          # Project list
│   │   ├── new/page.tsx      # Brief form + URL auto-fetch
│   │   └── [projectId]/
│   │       ├── page.tsx      # Project overview + workflow stepper
│   │       ├── strategy/     # AI strategy generation + A/B testing
│   │       ├── scenes/       # Scene breakdown + editing
│   │       ├── prompts/      # Veo prompt optimization
│   │       ├── generate/     # Video/image generation queue
│   │       ├── post-production/ # Voiceover, captions, stitch, export
│   │       └── history/      # Version history
│   ├── gallery/page.tsx      # All generated media
│   ├── templates/page.tsx    # Saved templates
│   ├── calendar/page.tsx     # Publishing calendar
│   ├── analytics/page.tsx    # Cost & performance analytics
│   └── settings/page.tsx     # API keys, account, deployment config
├── (auth)/
│   ├── layout.tsx            # Centered auth layout
│   └── login/page.tsx        # Email/password login
├── api/                      # 20 API routes (all server-side)
│   ├── ai/                   # AI generation endpoints
│   ├── ads/                  # Ad distribution endpoints
│   ├── campaigns/            # Campaign analytics
│   ├── context/              # URL scraping
│   ├── generate/             # Video/image/voiceover generation
│   ├── newbee/               # Newbee platform insights
│   └── process/              # Post-production (stitch, captions, export)
├── auth/callback/route.ts    # Supabase OAuth callback
├── layout.tsx                # Root: Geist font + Providers
├── page.tsx                  # Landing / redirect
└── globals.css               # Tailwind 4 + shadcn theme variables

components/
├── ui/                       # 25+ shadcn/ui components (DO NOT edit manually)
├── layout/
│   ├── AppSidebar.tsx        # Navigation sidebar (uses NAV_ITEMS constant)
│   ├── AppHeader.tsx         # Page header with sidebar trigger
│   └── NotificationBell.tsx  # Notification dropdown
├── campaigns/
│   ├── CampaignCard.tsx      # Campaign list item
│   ├── CampaignForm.tsx      # Campaign create/edit form
│   ├── CampaignStepper.tsx   # 5-step campaign workflow stepper
│   ├── BudgetIndicator.tsx   # Budget progress bar
│   └── PublishDialog.tsx     # Ad publish confirmation dialog
├── dashboard/
│   └── AiInsightBadges.tsx   # Gemini Flash AI insight badges
├── projects/
│   ├── WorkflowStepper.tsx   # 6-step project workflow stepper
│   ├── strategy/             # StrategyPanel, RefinementChat, VersionHistory
│   ├── scenes/               # SceneCard, SceneList, AudioConfig, DurationBar
│   ├── prompts/              # PromptCard, PromptList
│   ├── generate/             # BatchMatrix, GenerationProgress, GenerationQueue
│   └── post-production/      # VoiceoverPanel, CaptionEditor, StitchedVideoPreview, ExportPanel
└── providers.tsx             # QueryClient + TooltipProvider + Sonner Toaster

hooks/                        # 25+ React Query hooks
├── useAuth.ts                # Supabase auth wrapper
├── useProject.ts             # Single project query
├── useProjects.ts            # Project list + create mutation
├── useCampaigns.ts           # Campaign CRUD
├── useBrandKit.ts            # Brand kit query + upsert
├── useAiStrategy.ts          # Strategy generation mutation
├── useAiScenes.ts            # Scene generation mutation
├── useAiPromptOptimize.ts    # Prompt optimization mutation
├── useAiCaptions.ts          # Caption generation mutation
├── useAiInsights.ts          # Dashboard AI insights (1hr cache)
├── useVideoGeneration.ts     # Video gen + status polling (5s interval)
├── useImageGeneration.ts     # Image generation mutation
├── useVoiceover.ts           # TTS voiceover mutation
├── useVideoProcessing.ts     # Stitch/export mutations
├── useScenes.ts              # Scene CRUD + reorder
├── useAnalytics.ts           # Aggregated costs + stats
├── useGallery.ts             # Generated media query
├── useTemplates.ts           # Template CRUD
├── useCalendar.ts            # Calendar event CRUD
├── useNotifications.ts       # Unread notifications
├── useProjectHistory.ts      # Version snapshots
├── useAdDeployments.ts       # Ad deployment query + publish mutation
├── useCampaignPerformance.ts # Performance data (date filtered)
├── useApiKeys.ts             # API key CRUD for ad platforms
└── use-mobile.ts             # Mobile viewport detection

lib/
├── google-ai.ts              # GoogleGenAI client + MODELS + COST_ESTIMATES
├── constants.ts              # App constants (platforms, styles, workflow steps, nav)
├── validations.ts            # All Zod schemas for form validation
├── utils.ts                  # cn() utility (clsx + tailwind-merge)
├── supabase/
│   ├── client.ts             # createClient() - browser Supabase client
│   ├── server.ts             # createSupabaseServer() + createServiceClient() + createNewbeeClient()
│   └── middleware.ts         # updateSession() for auth token refresh
├── ai/
│   ├── prompts/
│   │   ├── strategy.ts       # STRATEGY_SYSTEM_PROMPT + buildStrategyUserPrompt() + buildAbStrategyUserPrompt()
│   │   ├── brand-context.ts  # buildBrandContext() + buildExternalContext() + buildPerformanceContext() + buildNewbeeInsightContext()
│   │   ├── scenes.ts         # SCENES_SYSTEM_PROMPT + buildScenesUserPrompt()
│   │   ├── veo-optimizer.ts  # VEO_OPTIMIZER_SYSTEM_PROMPT + buildVeoOptimizerPrompt()
│   │   └── caption-generator.ts # CAPTION_SYSTEM_PROMPT + buildCaptionPrompt()
│   ├── response-schemas.ts   # Zod schemas for AI responses + parseAiJson()
│   └── few-shot-examples.ts  # VEO_PROMPT_EXAMPLES + STRATEGY_EXAMPLES
├── ads/
│   ├── types.ts              # AdCampaignConfig, AdPublishResult, GoogleAdsKeys, MetaAdsKeys
│   ├── google-ads.ts         # Google Ads API (stub + real mode)
│   ├── meta-ads.ts           # Meta Ads API (stub + real mode)
│   ├── publisher.ts          # publishToAds() - unified dispatcher
│   └── key-store.ts          # getUserAdKeys() + saveUserAdKeys()
├── scraping/
│   ├── url-scraper.ts        # scrapeUrl() + scrapeGithubRepo() using cheerio
│   └── context-summarizer.ts # summarizeContext() using Gemini Flash
└── newbee/
    └── insights.ts           # fetchNewbeeInsights() - read-only Newbee data

types/
└── database.ts               # Full Supabase Database type + helper types

supabase/migrations/
├── 001_init.sql              # 12 core tables + RLS + triggers + storage
└── 002_ad_distribution_and_performance.sql # 3 new tables + column additions
```

---

## Database Schema (15 Tables)

All tables use `mkt_` prefix. Storage bucket: `mkt-assets`.

### Core Tables (Migration 001)

| Table | Purpose | Key Columns |
|-------|---------|-------------|
| `mkt_brand_kit` | Brand identity | colors (JSONB), fonts (JSONB), brand_voice, watermark config |
| `mkt_brand_assets` | Uploaded brand media | brand_kit_id (FK), type (image/video/screenshot), tags[] |
| `mkt_campaigns` | Campaign container | objective, budget_limit_usd, current_spend_usd, status, ad_platforms[] |
| `mkt_projects` | Video project (6-step) | strategy (JSONB), current_step (1-6), status, source_url, is_ab_variant, parent_project_id |
| `mkt_project_versions` | Version snapshots | project_id, step (strategy/scenes/prompts), version_number, snapshot (JSONB) |
| `mkt_scenes` | Video scenes | scene_number (UNIQUE per project), duration_seconds (4/6/8), optimized_prompt, audio_type |
| `mkt_generations` | AI outputs | type (video/image/voiceover/stitched), model, operation_name, status, output_url, cost |
| `mkt_captions` | SRT subtitles | generation_id, language, srt_content, is_embedded |
| `mkt_templates` | Reusable templates | category, brief_template, scene_templates, prompt_patterns (JSONB) |
| `mkt_calendar_events` | Publish calendar | scheduled_date, platform, status (planned/ready/published) |
| `mkt_usage_logs` | API cost tracking | api_service (gemini/veo/imagen/tts), model, tokens, estimated_cost_usd |
| `mkt_notifications` | User notifications | type (generation_complete/failed/budget_alert), is_read |

### Ad Distribution Tables (Migration 002)

| Table | Purpose | Key Columns |
|-------|---------|-------------|
| `mkt_api_keys` | Per-user ad platform creds | platform (google_ads/meta_ads), keys_encrypted (JSONB), UNIQUE(user_id, platform) |
| `mkt_ad_deployments` | Active ad campaigns | platform (google/meta), external_campaign_id, creative_urls[], targeting (JSONB), status |
| `mkt_campaign_performance` | Analytics data | impressions, clicks, ctr, conversions, spend_usd, version_type (emotional/technical/single) |

### RLS Pattern
All tables enforce `auth.uid() = user_id`. Service role client (`createServiceClient()`) bypasses RLS for server-side operations. Performance table allows service role INSERT for automated sync.

### Triggers
All tables with `updated_at` use `update_updated_at_column()` trigger function.

---

## Two Workflow Systems

### Project Workflow (6 Steps - Content Creation)
```
1. Brief      → User fills project details (+ optional URL auto-fetch)
2. Strategy   → Gemini Pro generates marketing strategy (+ optional A/B testing)
3. Scenes     → Gemini Pro breaks strategy into scenes
4. Prompts    → Gemini Flash optimizes prompts for Veo
5. Generate   → Veo 3.1 generates videos, Imagen 4 generates images
6. Post-Prod  → TTS voiceover, SRT captions, stitch, export
```

### Campaign Workflow (5 Steps - Distribution)
```
1. Fetch Context  → URL scraping + AI summarization
2. AI Strategy    → A/B strategy generation (emotional vs technical)
3. Media Prod     → Links to project 6-step workflow
4. Ad Distribution → Platform selection, budget, targeting, publish
5. Analytics      → Performance tracking + AI insights feedback loop
```

---

## AI Models & Costs

```typescript
// lib/google-ai.ts
MODELS = {
  GEMINI_PRO:   "gemini-2.5-pro",          // Strategy, scenes, refining
  GEMINI_FLASH: "gemini-2.5-flash",        // Prompts, captions, context, insights
  VEO:          "veo-3.1-generate-preview", // Standard video generation
  VEO_FAST:     "veo-3.1-fast-generate-preview", // Fast video generation
  IMAGEN:       "imagen-4.0-generate-001",  // Standard image generation
  IMAGEN_FAST:  "imagen-4.0-fast-generate-001",  // Fast image generation
}

COST_ESTIMATES = {
  gemini_pro:    $1.25/1M input,  $10.00/1M output
  gemini_flash:  $0.075/1M input, $0.60/1M output
  veo_standard:  $0.40/second
  veo_fast:      $0.15/second
  imagen:        $0.04/image (standard), $0.02/image (fast)
}
```

**Budget:** $25,000 Google Cloud startup credit (`TOTAL_CREDIT_USD` constant)

### AI Client Setup
```typescript
// lib/google-ai.ts
export const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;
// Routes check `if (!ai)` and return error or use rule-based fallback
```

### AI Prompt Architecture
Each AI feature has a dedicated prompt builder in `lib/ai/prompts/`:

| Prompt File | System Prompt | User Prompt Builder | Used By |
|------------|--------------|-------------------|---------|
| `strategy.ts` | `STRATEGY_SYSTEM_PROMPT` | `buildStrategyUserPrompt()` + `buildAbStrategyUserPrompt()` | `/api/ai/strategy` |
| `scenes.ts` | `SCENES_SYSTEM_PROMPT` | `buildScenesUserPrompt()` | `/api/ai/scenes` |
| `veo-optimizer.ts` | `VEO_OPTIMIZER_SYSTEM_PROMPT` | `buildVeoOptimizerPrompt()` | `/api/ai/optimize-prompt` |
| `caption-generator.ts` | `CAPTION_SYSTEM_PROMPT` | `buildCaptionPrompt()` | `/api/ai/captions` |
| `brand-context.ts` | - | `buildBrandContext()`, `buildExternalContext()`, `buildPerformanceContext()`, `buildNewbeeInsightContext()` | All AI routes |

### AI Response Parsing
```typescript
// lib/ai/response-schemas.ts
parseAiJson(text: string)  // Strips ```json blocks, parses JSON
// All schemas are Zod objects for runtime validation
```

---

## API Routes (20 Endpoints)

### AI Generation
| Method | Route | Purpose | Model |
|--------|-------|---------|-------|
| POST | `/api/ai/strategy` | Strategy generation (single + A/B) | Gemini Pro |
| POST | `/api/ai/scenes` | Scene breakdown from strategy | Gemini Pro |
| POST | `/api/ai/optimize-prompt` | Veo prompt optimization | Gemini Flash |
| POST | `/api/ai/captions` | SRT subtitle generation | Gemini Flash |
| POST | `/api/ai/refine` | Content refinement with feedback | Gemini Pro |
| GET | `/api/ai/insights` | Dashboard AI insights | Gemini Flash |

### Media Generation
| Method | Route | Purpose | Model |
|--------|-------|---------|-------|
| POST | `/api/generate/video` | Video generation (async) | Veo 3.1 |
| GET | `/api/generate/video/status` | Poll video generation status | - |
| POST | `/api/generate/image` | Image generation (sync) | Imagen 4 |
| POST | `/api/generate/voiceover` | TTS voiceover | Cloud TTS |

### Post-Production
| Method | Route | Purpose |
|--------|-------|---------|
| POST | `/api/process/stitch` | Stitch scenes into final video |
| POST | `/api/process/caption-embed` | Embed captions into video |
| POST | `/api/process/watermark` | Add watermark overlay |
| POST | `/api/process/export` | Export with format options |

### Ad Distribution
| Method | Route | Purpose |
|--------|-------|---------|
| POST | `/api/ads/publish` | Publish ad to Google/Meta |
| GET | `/api/ads/[deploymentId]/status` | Check deployment status |
| POST | `/api/ads/sync-performance` | Sync metrics from ad platforms |

### Data
| Method | Route | Purpose |
|--------|-------|---------|
| GET | `/api/campaigns/[campaignId]/performance` | Campaign performance data |
| POST | `/api/context/fetch` | URL scraping + AI summarization |
| GET | `/api/newbee/insights` | Newbee platform data (read-only) |

### Auth Pattern (all routes)
```typescript
const supabase = await createSupabaseServer();
const { data: { user }, error } = await supabase.auth.getUser();
if (error || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

const serviceClient = createServiceClient(); // For DB writes (bypasses RLS)
```

---

## Supabase Setup

### Three Separate Clients

```typescript
// lib/supabase/client.ts — Browser (client components)
createClient() → createBrowserClient<Database>(PUBLIC_URL, ANON_KEY)

// lib/supabase/server.ts — Server (API routes, RSC)
createSupabaseServer() → createServerClient<Database>(PUBLIC_URL, ANON_KEY, { cookies })
createServiceClient() → createClient<Database>(PUBLIC_URL, SERVICE_ROLE_KEY)  // Bypasses RLS
createNewbeeClient() → createClient(NEWBEE_URL, NEWBEE_ANON_KEY)  // Read-only Newbee data
```

### Environment Variables
```env
# Marketing Hub Supabase (own project)
NEXT_PUBLIC_SUPABASE_URL=https://cydcvnzcaapbgtvbbqpw.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...

# Newbee Supabase (read-only access)
NEWBEE_SUPABASE_URL=https://ccuiumdacqwsfhfxsjdm.supabase.co
NEWBEE_SUPABASE_ANON_KEY=...

# Google AI (server-side only)
GOOGLE_API_KEY=...
GOOGLE_CLOUD_PROJECT=...

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Storage
- Bucket: `mkt-assets`
- Path format: `{user_id}/{type}/{file_id}`
- 500MB limit per user folder
- Public read access for generated content

---

## React Query Hook Pattern

All data hooks follow this pattern:

```typescript
// Query hook
export function useProjects(campaignId?: string) {
  const supabase = createClient();
  return useQuery({
    queryKey: ["projects", campaignId],
    queryFn: async () => {
      let query = supabase.from("mkt_projects").select("*").order("updated_at", { ascending: false });
      if (campaignId) query = query.eq("campaign_id", campaignId);
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });
}

// Mutation hook
export function useCreateProject() {
  const supabase = createClient();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (brief: ProjectBriefFormData) => {
      const { data, error } = await supabase.from("mkt_projects").insert({ ... }).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["projects"] }),
  });
}

// AI mutation hook (calls API route)
export function useAiStrategy() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (projectId: string) => {
      const res = await fetch("/api/ai/strategy", { method: "POST", body: JSON.stringify({ projectId }) });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    onSuccess: (_, projectId) => queryClient.invalidateQueries({ queryKey: ["project", projectId] }),
  });
}
```

### QueryClient Config
```typescript
// components/providers.tsx
staleTime: 30 * 1000  // 30 seconds
retry: 1
```

---

## Key Constants

```typescript
// lib/constants.ts

PLATFORMS = ["instagram_reels", "tiktok", "youtube_shorts", "youtube", "linkedin", "twitter", "facebook_feed"]
LANGUAGES = ["en", "de", "tr"]
STYLES = ["modern", "cinematic", "minimal", "playful", "corporate", "artistic"]
TONES = ["professional", "casual", "energetic", "luxurious", "friendly", "bold"]
TEMPLATE_CATEGORIES = ["app_demo", "feature_showcase", "testimonial", "event_promo", "brand_awareness", "general"]
ASPECT_RATIOS = { "9:16": 1080x1920, "16:9": 1920x1080, "1:1": 1080x1080 }
RESOLUTIONS = ["720p", "1080p", "4k"]

WORKFLOW_STEPS = [Brief, Strategy, Scenes, Prompts, Generate, Post-Production]  // 6 steps for projects
CAMPAIGN_WORKFLOW_STEPS = [Fetch Context, AI Strategy, Media Production, Ad Distribution, Analytics]  // 5 steps for campaigns
AD_PLATFORMS = [{ value: "google", label: "Google Ads" }, { value: "meta", label: "Meta Ads" }]
BUDGET_THRESHOLDS = [0.75, 0.9, 0.95]
TOTAL_CREDIT_USD = 25000

NAV_ITEMS = [Dashboard, Brand Kit, Campaigns, Projects, Gallery, Templates, Calendar, Analytics, Settings]
```

---

## Zod Validation Schemas

```typescript
// lib/validations.ts
projectBriefSchema     // title, product_name, product_description, platforms[], languages[], style, tone, source_url?
campaignSchema         // name, description, objective, budget, dates, status
brandKitSchema         // name, colors (hex), fonts, watermark config
sceneSchema            // title, description, duration (4-8), aspect_ratio, audio_type
templateSchema         // title, category, platform, style, tone
calendarEventSchema    // title, date, platform, status
adDeploymentSchema     // platform, creative_urls, budget, targeting (age, locations, interests, languages)
apiKeysSchema          // platform + keys object

// Inferred types: ProjectBriefFormData, CampaignFormData, etc.
```

---

## A/B Testing System

Strategy generation supports A/B mode with two personas:

- **Version A (Emotional):** Story-driven, empathy, "problem → emotion → solution"
- **Version B (Technical):** Feature-driven, data-backed, "feature → proof → result"

### Flow:
1. User toggles "A/B Test Mode" on strategy page
2. `/api/ai/strategy` called with `ab_mode: true`
3. Gemini Pro generates two separate strategies
4. Two `mkt_projects` records created: parent + variant (`is_ab_variant=true`, `parent_project_id` set)
5. User compares side-by-side and selects winner
6. Selected version continues through workflow
7. Performance data tracks `version_type` (emotional/technical) for future AI feedback

### Performance Feedback Loop:
When creating a new strategy, if previous campaign performance exists:
- `buildPerformanceContext()` aggregates metrics by version_type
- Determines which approach had higher CTR/CVR
- Injects recommendation into strategy prompt
- AI learns from past campaign data

---

## Ad Distribution System

### Dual-Mode Architecture
- **Stub mode** (default): No API keys → returns simulated responses for testing
- **Real mode**: User provides their API keys in Settings → actual API calls

### Supported Platforms
| Platform | Key Fields | Status |
|----------|-----------|--------|
| Google Ads | client_id, client_secret, developer_token, refresh_token | Stub + ready for real |
| Meta Ads | app_id, app_secret, access_token | Stub + ready for real |

### Key Storage
Per-user API keys stored in `mkt_api_keys` table. Retrieved via `getUserAdKeys()` from `lib/ads/key-store.ts`. Keys stored as JSONB in `keys_encrypted` column.

---

## URL Context Fetching

### Flow:
1. User pastes URL in "New Project" page
2. `/api/context/fetch` called
3. URL type detected (GitHub vs website)
4. **Website:** cheerio parses HTML → extracts title, about, features, USPs
5. **GitHub:** GitHub API fetches README → parses as HTML
6. Gemini Flash summarizes raw data into `SummarizedContext`:
   - companyName, productDescription, targetAudience, keyFeatures[], uniqueSellingPoints[], brandTone, techStack[]
7. Form fields auto-filled from context

---

## Newbee Integration

Read-only access to Newbee's Supabase for marketing context:

```typescript
// lib/newbee/insights.ts
fetchNewbeeInsights() → {
  totalUsers, activeUsers,       // from profiles table
  topFeatures,                   // from user activity
  topCities,                     // from user locations
  upcomingEvents, totalEvents    // from events table
}
```

Used in `buildNewbeeInsightContext()` to enrich AI prompts with real platform data.

---

## Component Patterns

### UI Components
All in `components/ui/` — generated by shadcn/ui. **Never edit manually.** Use `npx shadcn@latest add <component>` to add new ones.

### Page Layout Pattern
```tsx
export default function SomePage() {
  return (
    <>
      <AppHeader title="Page Title" />
      <div className="flex-1 p-4 lg:p-6 space-y-6">
        {/* Page content */}
      </div>
    </>
  );
}
```

### Form Pattern
```tsx
const form = useForm<FormData>({ resolver: zodResolver(schema), defaultValues: { ... } });

async function onSubmit(values: FormData) {
  mutation.mutateAsync(values);
}

return (
  <Form {...form}>
    <form onSubmit={form.handleSubmit(onSubmit)}>
      <FormField control={form.control} name="fieldName" render={({ field }) => (
        <FormItem>
          <FormLabel>Label</FormLabel>
          <FormControl><Input {...field} /></FormControl>
          <FormMessage />
        </FormItem>
      )} />
    </form>
  </Form>
);
```

### Toast Pattern
```typescript
import { toast } from "sonner";
toast.success("Saved!");
toast.error("Something went wrong");
```

---

## Development

```bash
cd "/Volumes/SSD 2TB/APP/NewbeeMarketing/NewbeeMarketing App"
npm run dev     # Start dev server (Turbopack)
npm run build   # Production build
npm run lint    # ESLint
```

### Adding shadcn Components
```bash
npx shadcn@latest add button
npx shadcn@latest add dialog
```

### Image Optimization
```typescript
// next.config.ts — Supabase storage allowed
remotePatterns: [{ hostname: "cydcvnzcaapbgtvbbqpw.supabase.co" }]
```

---

## Deployment (Vercel)

### Required Environment Variables
| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Marketing Hub Supabase URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Marketing Hub anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key (server-side) |
| `GOOGLE_API_KEY` | Google AI API key (Gemini, Veo, Imagen) |
| `GOOGLE_CLOUD_PROJECT` | Google Cloud project ID (TTS) |
| `NEXT_PUBLIC_APP_URL` | Vercel domain URL |
| `NEWBEE_SUPABASE_URL` | Newbee Supabase URL (optional) |
| `NEWBEE_SUPABASE_ANON_KEY` | Newbee anon key (optional) |

### Checklist
1. Connect GitHub repo `NewbeeConnect/newbeemarketing`
2. Set all environment variables in Vercel dashboard
3. Add Vercel domain to Supabase Auth redirect URLs
4. Run migration 001 + 002 in Supabase SQL Editor
5. Deploy and verify auth callback

---

## Critical Rules

1. **Never modify `components/ui/`** — these are shadcn/ui generated components
2. **Always use `createServiceClient()`** for DB writes in API routes (bypasses RLS)
3. **Always check `if (!ai)`** before AI operations — the client is null when GOOGLE_API_KEY is not set
4. **All tables use `mkt_` prefix** — never create tables without this prefix
5. **RLS is enforced on all tables** — every table needs `auth.uid() = user_id` policy
6. **Cost tracking:** Every AI API call must log to `mkt_usage_logs` via `estimateCost()` pattern
7. **Veo is async:** Video generation returns `operation_name` for polling. Use `useActiveGenerations()` with 5s interval
8. **Imagen is sync:** Image generation completes immediately in the same request
9. **A/B variants:** When `is_ab_variant=true`, project has `parent_project_id` pointing to the main project
10. **Ad stub mode:** When user has no API keys, ad operations return simulated success responses
11. **Version snapshots:** Every strategy/scene change saves to `mkt_project_versions` for history
12. **`parseAiJson()`** must always be used to parse Gemini responses — it strips markdown code blocks

---

## File Quick Reference

| Need to... | Look at... |
|-----------|-----------|
| Add a new AI feature | `lib/ai/prompts/`, `lib/ai/response-schemas.ts`, new API route |
| Add a new database table | `supabase/migrations/`, `types/database.ts`, new hook |
| Add a new page | `app/(app)/`, use AppHeader + page layout pattern |
| Add a new API route | `app/api/`, follow auth check + serviceClient pattern |
| Add a new hook | `hooks/`, follow React Query pattern from `useCampaigns.ts` |
| Add a form | `lib/validations.ts` (Zod schema), react-hook-form pattern |
| Add a UI component | `npx shadcn@latest add <name>` |
| Modify navigation | `lib/constants.ts` → `NAV_ITEMS` |
| Add ad platform support | `lib/ads/`, `lib/ads/types.ts` |
| Track costs | `mkt_usage_logs` table, `COST_ESTIMATES` in `lib/google-ai.ts` |
