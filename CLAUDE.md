# TIKNOK PORTFOLIO — CLAUDE.md

> Cockfighting portfolio & farm management web app / PWA.  
> Review this file before touching any code.

---

## Stack Decisions

| Layer | Choice | Reason |
|---|---|---|
| Framework | **Next.js 15** (App Router) | Full-stack in one repo, SSR/SSG for public pages, built-in API routes, best PWA story |
| Language | **TypeScript** | Strict mode throughout |
| Database | **MongoDB Atlas** (existing free cluster) | Already live, no cost |
| ODM | **Mongoose** | Already used in the farm app |
| Storage | **DO Spaces** (existing `tiknok-media`, sgp1) | Already paid for, S3-compatible |
| UI | **Tailwind CSS v4 + shadcn/ui** | Modern, dark-friendly, highly customizable |
| Auth | **Custom JWT** (access 15m + refresh 30d rotation) | Matches existing farm app pattern |
| PWA | **@ducanh2912/next-pwa** | Works with Next.js 15 App Router |
| Upload | **@aws-sdk/client-s3** | DO Spaces is S3-compatible |
| Video player | **Plyr.js** | Lightweight, YouTube-like controls |
| State / data fetching | **TanStack Query v5** | Server-state caching, mutation handling |
| Deployment | **Docker + Nginx** on DO Droplet **$6/mo** (1 vCPU / 1GB RAM) | Sufficient — videos/media never touch Droplet |

---

## Folder Structure

```
tiknok-portfolio/
├── src/
│   ├── app/                         # Next.js App Router
│   │   ├── (public)/                # Public route group (no auth)
│   │   │   ├── page.tsx             # Landing page
│   │   │   ├── videos/page.tsx      # Fight Videos page
│   │   │   ├── breeding/page.tsx    # Breeding Materials (mixed)
│   │   │   ├── photos/page.tsx      # Photos gallery
│   │   │   ├── pahulugan/
│   │   │   │   └── [slug]/
│   │   │   │       ├── page.tsx     # Pahulugan reservation form
│   │   │   │       └── [buyer]/page.tsx  # Public buyer order page
│   │   │   ├── months-old/
│   │   │   │   └── [slug]/
│   │   │   │       ├── page.tsx     # Months Old reservation form
│   │   │   │       └── [buyer]/page.tsx
│   │   │   └── day-old/
│   │   │       └── [slug]/
│   │   │           ├── page.tsx     # Day Old reservation form
│   │   │           └── [buyer]/page.tsx
│   │   ├── admin/                   # Protected admin area
│   │   │   ├── layout.tsx           # Auth guard wrapper
│   │   │   ├── page.tsx             # Admin dashboard (finance + breeding summary)
│   │   │   ├── upload/page.tsx      # Media upload (videos / photos)
│   │   │   ├── reservations/page.tsx  # Manage Pahulugan / Months Old / Day Old listings
│   │   │   ├── expenses/page.tsx    # Farm expense tracker
│   │   │   ├── sales/page.tsx       # Farm sales tracker
│   │   │   └── workers/page.tsx     # Workers + salary
│   │   ├── login/page.tsx           # Admin login
│   │   └── api/                     # API Routes
│   │       ├── auth/                # login, logout, refresh, me
│   │       ├── media/               # videos, photos, breeding - CRUD + upload
│   │       ├── categories/          # auto-create on upload, list for filters
│   │       ├── expenses/            # farm expenses
│   │       ├── sales/               # farm sales
│   │       ├── workers/             # workers + salary
│   │       ├── seasons/             # breeding seasons + matings
│   │       └── dashboard/           # combined finance + breeding summary
│   ├── components/
│   │   ├── ui/                      # shadcn/ui primitives
│   │   ├── layout/                  # Navbar, Footer, AdminSidebar
│   │   ├── media/                   # VideoCard, PhotoCard, VideoPlayer, ImageGrid
│   │   ├── admin/                   # UploadForm, ExpenseForm, SaleForm, WorkerCard
│   │   └── landing/                 # Hero/Jumbotron, SectionLinks
│   ├── lib/
│   │   ├── db.ts                    # Mongoose connection (singleton)
│   │   ├── auth.ts                  # JWT sign/verify helpers
│   │   ├── spaces.ts                # DO Spaces S3 client + upload helper
│   │   └── query-client.ts          # TanStack Query setup
│   ├── models/                      # Mongoose models
│   │   ├── User.ts
│   │   ├── Media.ts                 # unified model: type=video|photo, page=videos|breeding|photos
│   │   ├── Category.ts              # slug, label, mediaTypes[]
│   │   ├── Listing.ts               # Pahulugan / MonthsOld / DayOld
│   │   ├── Reservation.ts
│   │   ├── FarmExpense.ts
│   │   ├── Sale.ts
│   │   ├── Worker.ts
│   │   ├── Season.ts
│   │   └── Mating.ts
│   ├── hooks/                       # custom React hooks
│   └── types/                       # shared TS types
├── public/
│   ├── manifest.json                # PWA manifest
│   └── icons/                       # PWA icons (192, 512)
├── .env.local                       # local dev secrets (see below)
├── .env.production                  # production secrets
├── next.config.ts
├── tailwind.config.ts
├── Dockerfile
├── docker-compose.yml               # local dev
└── nginx.conf                       # production reverse proxy config
```

---

## Data Models

### Media (new unified model)

```
id
type        'video' | 'photo'
page        'videos' | 'breeding' | 'photos'   ← which public page it appears on
title       string
description string | null
url         string   ← DO Spaces CDN URL
thumbnail   string | null   ← for videos: auto-generated or uploaded still
categories  ObjectId[]   ← ref Category
duration    number | null   ← seconds, videos only
createdAt
updatedAt
```

### Category

```
id
slug        string (unique, url-safe)
label       string   ← display name e.g. "Hatch Grey"
mediaTypes  ('video' | 'photo')[]   ← what media types this has been used with
createdAt
```

**Category behaviour:**  
- On first upload with label "Hatch Grey" → create Category document  
- On next upload → dropdown shows existing categories, just select  
- Filter chips on public pages are auto-built from categories that have matching media

### FarmExpense, Sale, Worker, Season, Mating
Identical to the existing farm app spec (see "Existing Farm App" section below).

---

## Public Pages

### Landing Page `/`
- Full-screen **hero / jumbotron** — cycling slideshow of customizable chicken photos (pulled from the Photos page pool, tagged as `featured`)
- Short tagline / business name section
- Three **section cards** below hero:
  - Fight Videos → `/videos`
  - Breeding Materials → `/breeding`
  - Photos → `/photos`
- Below section cards: **active reservation listing cards**
  - Pahulugan cards (latest created first, hidden when marked done)
  - Months Old cards (latest created first, hidden when marked done)
  - Day Old cards (latest created first, hidden when marked done)

### Fight Videos `/videos`
- Category filter chips along the top (auto-built, multi-select)
- Video grid — YouTube card style (16:9 thumbnail, title, duration badge)
- Clicking a card opens inline player (Plyr.js) in a modal or expands in-page

### Breeding Materials `/breeding`
- Same category filter chips
- Mixed grid: video cards + photo cards at identical thumbnail size
- Clicking video → Plyr player modal; clicking photo → lightbox

### Photos `/photos`
- Category filter chips along the top
- Masonry / Instagram-style grid (random sizing feels natural)
- Clicking → full-size lightbox

---

## Admin Area `/admin`

Single protected area, JWT-gated via middleware.

### Upload `/admin/upload`
- File picker (video or image, multi-file for photos)
- Fields: title, description, page target (Videos / Breeding / Photos), categories (multi-select dropdown + inline "add new" option)
- Upload progress bar → files go **directly to DO Spaces via presigned URL** (never touches Droplet)
- For videos: optional thumbnail image upload (manual still/screenshot)
- Accepted video format: **MP4 (H.264)** — no backend transcoding

#### Video Upload Flow (Presigned URL)
```
1. Admin picks .mp4 file
2. Browser → POST /api/media/presign  { filename, contentType }
3. API returns { presignedUrl, finalCdnUrl }
4. Browser → PUT file directly to DO Spaces presignedUrl  (progress bar here)
5. Browser → POST /api/media  { title, url: finalCdnUrl, categories, ... }  → saved to MongoDB
```

#### iPhone Video Guide (for admin)
- **New videos:** Settings → Camera → Formats → **Most Compatible** → records H.264 MP4 directly
- **Old HEVC .mov videos:** use a free App Store converter (e.g. "Video Converter") to convert to MP4 before uploading
- No HandBrake or laptop required — upload straight from iPhone via PWA

### Dashboard `/admin` (home)
Mirrors the existing `/dashboard` API response:
- Breeding: active season summary, hatch rate
- Finance: expenses this month, sales this month, net income, unpaid workers

### Expenses `/admin/expenses`
Exact same spec as the existing farm app. Reuse the same MongoDB collection `farmexpenses`.

### Sales `/admin/sales`
Same spec. Reuse `sales` collection.

### Workers `/admin/workers`
Same spec. Reuse `workers` collection.

### Reservations `/admin/reservations`
Three listing types managed here: **Pahulugan**, **Months Old**, **Day Old**.

Tabs per type:
- **Listings** — create / edit / mark done
- **Reservations** — view buyer orders, confirm to make public link live, reject

### Breeding `/admin/breeding`
Full breeding season management + marking generator. UI tabs:
1. **Seasons** — list, create, duplicate
2. **Matings** — per season: add stag + hens, configure marking options
3. **Generate** — 3-step preview → swap → confirm flow
4. **Lifecycle** — record eggs laid / chicks hatched per mating (pen or per-hen mode)

---

## Reservation System — Full Spec

### Overview
Three listing types: **Pahulugan** (installment pre-order), **Months Old**, **Day Old**.
- Admin can create **unlimited listings** per type — e.g. EB2026, EB2027, 2nd Batch 2026 all exist simultaneously
- Active listings appear on the landing page as cards (latest created first)
- Multiple active listings of the same type are all shown at once on the landing page
- Marking a listing **Done** in admin hides it from public immediately — past batches stay in admin for records
- Each listing has bloodlines that can be individually **closed** (full) — closed ones hidden from buyer form
- Creating a new batch (e.g. EB2027) does not affect or close existing batches

---

### Data Models

#### Listing (collection: `listings`)
```
id
type          'pahulugan' | 'months-old' | 'day-old'
name          string                          ← e.g. "EB2026"
slug          string (unique, url-safe)       ← derived from name
startDate     Date | null                     ← Pahulugan only
releaseDate   Date
bloodlines    [{ name: string, closed: boolean }]
prices        [{ category: string, amount: number }]
              ← Pahulugan: Stag/Pullet/Pair/Trio/Quadro each with own price
              ← Months Old / Day Old: single price entry { category: 'per-head', amount }
isDone        boolean  default false          ← hides from public when true
createdAt
```

#### Reservation (collection: `reservations`)
```
id
listingId     ObjectId ref Listing
listingType   'pahulugan' | 'months-old' | 'day-old'
listingSlug   string                          ← denormalized for URL building

buyerName     string
buyerFacebook string
buyerNumber   string
slug          string (unique)                 ← url-safe version of buyerName

items         [{ bloodline: string, category: string | null, quantity: number, unitPrice: number }]
              ← category used for Pahulugan (Stag/Pullet/etc), null for Months/Day Old

totalAmount   number                          ← backend-computed: sum of qty × unitPrice
downPayment   number                          ← backend-computed: 30% Pahulugan, 50% others
balance       number                          ← totalAmount - downPayment

paymentPlan   'full' | 'flexible' | 'weekly' | 'monthly'
weeklyAmount  number | null                   ← computed: balance ÷ sundays count
monthlyAmount number | null                   ← computed: balance ÷ month-starts count
paymentSchedule [{ dueDate: Date, amount: number }] | null   ← for weekly/monthly

isConfirmed   boolean  default false          ← admin confirms → public link goes live
publicUrl     string                          ← e.g. /pahulugan/EB2026/juan-dela-cruz
messengerUrl  string                          ← admin's FB Messenger link (from env)

createdAt
```

---

### Listing Admin Fields

**Pahulugan**
| Field | Type |
|---|---|
| Name | string |
| Start Date | date |
| Release Date | date |
| Bloodlines | array — add multiple, each has open/closed toggle |
| Prices | Stag, Pullet, Pair, Trio, Quadro — custom amount per category |

**Months Old**
| Field | Type |
|---|---|
| Name | string |
| Release Date | date |
| Bloodlines | array — add multiple, each has open/closed toggle |
| Price | single price per head |

**Day Old**
| Field | Type |
|---|---|
| Name | string |
| Release Date | date |
| Bloodlines | array — add multiple, each has open/closed toggle |
| Price | single price per head |

---

### Public Reservation Pages

#### Pahulugan — `/pahulugan/[slug]`
Buyer fills:
- Name, Facebook Name, Phone Number
- Order type: Stag / Pullet / Pair / Trio / Quadro (price shown next to each)
- Bloodline: dropdown — only open bloodlines shown
- Qty: number input

Live calculation shown:
```
Total:            ₱10,000
Required Down:    ₱3,000   (30%)
Balance:          ₱7,000
```

Payment plan selector (4 options):
1. **Pay Full on Release** — full amount due on release date
2. **Flexible Payment** — pay any amount before release at your own pace
3. **Pay Weekly** — counts Sundays from today → release date, divides balance
   - e.g. 10 Sundays → ₱700 every Sunday
4. **Pay Monthly** — counts 1st of each month from today → release date, divides balance
   - e.g. 4 months → ₱1,750 every 1st of the month

After submit → buyer sees their custom link + note that it will be active once admin confirms.
Admin FB Messenger link shown below for payment confirmation.

#### Months Old — `/months-old/[slug]`
Buyer fills:
- Name, Facebook Name, Phone Number
- Order items: bloodline (dropdown, open only) + quantity — can add multiple rows

Live calculation:
```
Bloodline A × 3 = ₱6,000
Total:             ₱6,000
Required Down:     ₱3,000   (50%)
Balance:           ₱3,000
```
Same 4 payment plan options as above.

#### Day Old — `/day-old/[slug]`
Identical mechanics to Months Old. Down payment 50%.

---

### Custom Public Buyer Links
```
/pahulugan/[listing-slug]/[buyer-slug]
/months-old/[listing-slug]/[buyer-slug]
/day-old/[listing-slug]/[buyer-slug]
```
- `[buyer-slug]` = url-safe version of buyer name (e.g. "Juan Dela Cruz" → `juan-dela-cruz`)
- Link is **private** (404 or pending page) until admin confirms reservation
- Once confirmed → full order details, payment plan schedule, amounts due shown publicly

---

### Payment Schedule Calculation (backend)
```
Weekly:
  sundays = count all Sundays between today and releaseDate (inclusive)
  weeklyAmount = ceil(balance / sundays)
  schedule = [{ dueDate: each Sunday, amount: weeklyAmount }]
  last entry adjusted for rounding difference

Monthly:
  starts = count all 1st-of-month dates between today and releaseDate (inclusive)
  monthlyAmount = ceil(balance / starts)
  schedule = [{ dueDate: each 1st, amount: monthlyAmount }]
  last entry adjusted for rounding difference
```

---

### Reservation API Routes
```
GET    /api/listings                     ?type=pahulugan|months-old|day-old&active=true
GET    /api/listings/:slug               single listing (public — open bloodlines only)
POST   /api/listings                     admin — create listing
PATCH  /api/listings/:id                 admin — edit, close bloodline, mark done
DELETE /api/listings/:id                 admin

POST   /api/reservations                 public — buyer submits form
GET    /api/reservations/:listingSlug/:buyerSlug   public — view if confirmed
GET    /api/admin/reservations           admin — all reservations, filterable
PATCH  /api/admin/reservations/:id/confirm   admin — confirm → makes public link live
PATCH  /api/admin/reservations/:id/reject    admin
```

---

### ENV additions
```env
# Admin FB Messenger link shown on reservation forms
NEXT_PUBLIC_MESSENGER_URL=https://m.me/your-facebook-page
```

---

### Mark Anatomy
A marking = optional nose mark + one or more feet marks, joined with `-`.

**Nose marks (3):** `LN` `RN` `DN`

**Feet marks (8):** `LO` `RO` `LI` `RI` `DL` `DR` `OO` `II`

**Shorthand expansions (for conflict logic only — stored as-is):**
- `DL` = `LO + LI`
- `DR` = `RO + RI`
- `OO` = `LO + RO`
- `II` = `LI + RI`

**Conflict pairs (cannot coexist in one combo):**
```
LO ↔ DL    LI ↔ DL    RO ↔ DR    RI ↔ DR
LO ↔ OO    RO ↔ OO    LI ↔ II    RI ↔ II
DL ↔ OO    DR ↔ OO    DL ↔ II    DR ↔ II
```
**Extra rule:** `LO+LI` together (without DL) is invalid — must use `DL`. Same for `RO+RI` → must be `DR`.

Valid combo pool = power-set of feet marks filtered by conflict rules × (3 nose marks + NONE).

---

### Nose Groups
Every mating belongs to exactly one nose group.

| Group | Meaning |
|---|---|
| `LN` | Combos prefixed with LN- |
| `RN` | Combos prefixed with RN- |
| `DN` | Combos prefixed with DN- |
| `NONE` | Feet-only combos (no nose mark) |
| `OVERFLOW` | All 4 primary groups claimed — gets group with most remaining combos |

**Assignment priority:** LN → RN → DN → NONE → OVERFLOW

---

### Mating Config Fields (marking-relevant)
| Field | Type | Meaning |
|---|---|---|
| `noseGroup` | `LN\|RN\|DN\|NONE\|OVERFLOW\|null` | Set by algorithm at generate time |
| `sameMarking` | `boolean\|null` | true = all hens share 1 combo; false = each hen unique; null if only 1 hen |
| `mandatoryMarking` | `string\|null` | Breeder forces a specific combo, algorithm locks it |
| `hens[].marking` | `string\|null` | Assigned combo per hen, null before generate |
| `hens[].previousMarking` | `string\|null` | Carried over from duplicate season — display hint only, never used by algorithm |

---

### Marking Generation Algorithm
Pure function in `src/lib/marking-engine.ts`. No DB calls, no HTTP. Input in → output out.

**Input:**
```ts
matings: Array<{
  id: string
  maleName: string
  henCount: number
  henNames: string[]
  sameMarking: boolean | null
  mandatoryMarking: string | null
}>
mandatoryOverrides?: Array<{ matingId: string; marking: string }>
```

**Output:** `MarkingAssignment[]` — preview only, not saved yet.

**Pass 1 — Mandatory markings first**
- Any mating with `mandatoryMarking` (or override) processed first
- Mandatory combo's nose group determined and claimed
- Combo locked + removed from pool
- Hen assignment runs (see below)
- Multiple mandatory matings CAN share a nose group — only first claims it

**Pass 2 — Remaining matings**
- Each unassigned mating gets next unclaimed group by priority: LN → RN → DN → NONE
- All 4 claimed → OVERFLOW: pick group with most remaining combos

**Hen assignment per mating:**
- 1 hen → pick 1 combo from group pool
- `sameMarking: true` → all hens get same 1 combo (1 consumed from pool)
- `sameMarking: false` → each hen gets unique combo (N consumed, one per hen)
- `mandatoryMarking` set → first hen gets it, remaining hens get next available from same group

**Combo selection preference:**
- Always prefer combination marks (contains `-`, e.g. `LN-RI`)
- Single-part marks (`LN`, `RO`, etc.) reserved — only used as last resort when all combo marks in that group exhausted
- Throws error if group pool fully exhausted

---

### 3-Step Generate API Flow

**Step 1 — Preview (no save)**
```
POST /api/seasons/:seasonId/generate
Body: { overrides?: [{ matingId, marking }] }
Response: { preview: MarkingAssignment[] }
```
Runs engine, returns proposed assignments. Nothing written to DB.

**Step 2 — Swap (optional, no save)**
```
POST /api/seasons/:seasonId/generate/swap
Body: { matingId, henName, newMarking }
Response: updated preview proposal
```
Client holds updated preview in memory. Accumulate swaps, send final state to confirm.

**Step 3 — Confirm (writes to DB)**
```
POST /api/seasons/:seasonId/generate/confirm
Body: { assignments: [{ matingId, noseGroup, hens: [{ henName, marking }] }] }
```
Backend validates:
- Every marking is a valid combo string
- No duplicate combos across different matings (same-marking within same mating allowed)
- Every matingId belongs to this season + user

If valid, writes atomically:
- `Mating.noseGroup` set per mating
- `Mating.hens[].marking` set per hen
- `MarkingPool` upserted
- `Season.markingsGenerated = true`, `Season.generatedAt = now`

**Reset**
```
DELETE /api/seasons/:seasonId/generate
```
Clears `noseGroup` + `hens[].marking` on all matings. Deletes MarkingPool. Sets `markingsGenerated: false`.

---

### Season Duplicate
```
POST /api/seasons/:seasonId/duplicate
```
- Creates new Season (same name, current year)
- Copies all matings
- Per hen: `marking` → copied to `previousMarking`, then `marking` reset to `null`
- `mandatoryMarking` reset to `null` on all matings
- New season starts with `markingsGenerated: false`

---

### Lifecycle Tracking
Controlled by `useIndividualHenCount: boolean` per mating.

**Pen mode (false, default):**
`penEggsLaid`, `penChicksHatched`, `penMaleCount`, `penFemaleCount`

**Per-hen mode (true):**
`hens[].eggsLaid`, `hens[].chicksHatched`, `hens[].maleCount`, `hens[].femaleCount`

**Server-side validations on every lifecycle PATCH:**
- Chicks hatched ≤ eggs laid
- Males + females ≤ chicks hatched (when both set)

**Auto-trigger:** first time any mating in a season records `eggsLaid > 0` AND season has no `expectedHatchDate` yet → auto-set `Season.expectedHatchDate = today + 21 days`

`serializeMating()` computes totals from whichever mode is active. Returns `null` if no data entered (so frontend can distinguish "not started" from zero).

---

### MarkingPool Model (collection: `markingpools`)
```
seasonId    ObjectId
userId      ObjectId
assignments [{ matingId, noseGroup, combos: string[] }]
usedCombos  string[]
generatedAt Date
```

---

### Validation Rules (enforced client + server)
- `mandatoryMarking` must be a valid combo string (checked on mating create, PATCH, and generate confirm)
- `henNames.length` must equal `henCount`
- `sameMarking` must be `null` when `henCount === 1`
- Duplicate combos across matings → 400 on confirm
- Single-part marks cannot be auto-assigned — algorithm only falls back to them when pool is exhausted

---

### Auth
```
POST /api/auth/login      { email, password }
POST /api/auth/logout
POST /api/auth/refresh    { refreshToken }
GET  /api/auth/me
```

### Media
```
GET    /api/media          ?page=videos|breeding|photos&category=slug&limit=20&cursor=
POST   /api/media          multipart/form-data — upload + create record
PATCH  /api/media/:id
DELETE /api/media/:id      also deletes from DO Spaces
```

### Categories
```
GET  /api/categories       ?mediaType=video|photo
POST /api/categories       { label } — idempotent (returns existing if slug matches)
```

### Expenses, Sales, Workers, Seasons, Matings, Dashboard
Identical to the existing farm app spec — same routes, same MongoDB collections, same userId-from-JWT rule.

---

## Environment Variables

### `.env.local` (development)
```env
NODE_ENV=development

# MongoDB — SAME database as the farm app (farmOSTiknok)
# Database name: test (confirmed from Atlas)
MONGODB_URI=mongodb+srv://app-user:qnwaNaE178!!@cockfighting-cluster.tlgjenu.mongodb.net/test?appName=cockfighting-cluster

# JWT
JWT_SECRET=9f3a7c2e5d8b4a1f6e0c9d2b7a5f8c3e1b6d9a0f4c2e7b8d1a3c5e6f9b2d4a7
JWT_REFRESH_SECRET=4b8e2c7a1d9f6e3b0c5a2f7d8e1c9b4a6d3f0e2b7c5a8d1f9e6c3b2a7d4f8e1
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=30d

# Digital Ocean Spaces (existing bucket)
DO_SPACES_KEY=DO00GQVAX6FD39P7JYHF
DO_SPACES_SECRET=sGUBUGvMi7KaKuxAt0l45qKb8tDkuVQf70bLHWj66wY
DO_SPACES_ENDPOINT=https://sgp1.digitaloceanspaces.com
DO_SPACES_BUCKET=tiknok-media
DO_SPACES_CDN_URL=https://tiknok-media.sgp1.cdn.digitaloceanspaces.com
DO_SPACES_REGION=sgp1

# Admin account (seeded on first run)
ADMIN_EMAIL=rdacles08@gmail.com
ADMIN_PASSWORD=<set-a-strong-password>

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
APP_URL=http://localhost:3000
```

### Additional production vars
```env
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://tiknok.app
APP_URL=https://tiknok.app
```

---

## Existing Farm App — Full Spec (preserved for compatibility)

These models + routes must be built into this new app so the admin panel has the full farm management suite, and the **same MongoDB collections** are used so existing data is not lost.

### Sub-module A — Farm Expenses

**Data Model — FarmExpense** (collection: `farmexpenses`)
```
id, userId, category, type, date, month, year,
name, unit, quantity, pricePerUnit, totalAmount,   ← type='unit'
description, amount,                                ← type='direct'
notes, locked
```
- `category` → `'feeds'|'vitamins'|'medicines'|'deworming'|'workers_extra_budget'|'miscellaneous'`
- `type` derived from category: feeds/vitamins/medicines/deworming = `unit`; workers_extra_budget/miscellaneous = `direct`
- `totalAmount` ALWAYS backend-computed: `quantity × pricePerUnit`
- `locked=true` → 403 on PATCH/DELETE

**Routes**
```
GET    /api/expenses              ?month=&year=
GET    /api/expenses/summary      all months, totals only
GET    /api/expenses/:id
POST   /api/expenses
PATCH  /api/expenses/:id
DELETE /api/expenses/:id
```

### Sub-module B — Farm Sales

**Data Model — Sale** (collection: `farmsales`)
```
id, userId, description, amount, date, month, year,
paymentStatus ('paid'|'partial'|'unpaid'), notes
```
**Important:** collection name is `farmsales` — must be forced explicitly:
`mongoose.model('Sale', schema, 'farmsales')` — do NOT let Mongoose auto-pluralize.

**Routes**
```
GET    /api/sales              ?month=&year=
GET    /api/sales/summary
POST   /api/sales
PATCH  /api/sales/:id
DELETE /api/sales/:id
```

### Sub-module C — Workers

**Data Model — Worker** (collection: `workers`)
```
POSITION_PRESETS = ['Farm Manager', 'Handler', 'Assistant Handler', 'Breeder', 'Assistant Breeder', 'Farm Buddy']

id, userId
name            string (required)
position        string (required) — use POSITION_PRESETS or custom
monthlySalary   number (required, min 0)
salaryDay       number (required, 1–31, default 30) — day of month salary is due
photo           string | null
address         string | null
phoneNumber     string | null
fbLink          string | null

advances []:
  amount        number (required, min 1)
  reason        string | null
  date          Date (required)
  month         number 1–12
  year          number
  createdAt     Date (auto)

payments []:
  month         number 1–12
  year          number
  grossSalary   number
  totalAdvances number
  netPay        number
  paidAt        Date
```

**Routes**
```
GET    /api/workers
POST   /api/workers
PATCH  /api/workers/:id
DELETE /api/workers/:id
POST   /api/workers/:id/advances          — add advance
DELETE /api/workers/:id/advances/:advId   — remove advance
POST   /api/workers/:id/payments          — record monthly payment
```

### Sub-module D — Breeding Seasons & Matings

**Data Model — Season** (collection: `seasons`)
```
id, userId
name               string (required)
year               number (required)
markingsGenerated  boolean default false
generatedAt        Date | null
eggsLaid           number | null
expectedHatchDate  Date | null
chicksHatched      number | null
hatchRate          number | null       — backend computed: chicksHatched / eggsLaid
maleCount          number | null
femaleCount        number | null
sexCountDone       boolean default false
sexCountUpdatedAt  Date | null
createdAt, updatedAt
```

**Data Model — Mating** (collection: `matings`)
```
id, seasonId, userId
maleName           string (required)
malePhoto          string | null
noseGroup          'LN'|'RN'|'DN'|'NONE'|'OVERFLOW'|null  — set by marking engine
sameMarking        boolean | null
mandatoryMarking   string | null

hens []:
  henName          string (required)
  marking          string | null
  previousMarking  string | null
  photo            string | null
  eggsLaid         number | null
  chicksHatched    number | null
  maleCount        number | null
  femaleCount      number | null

useIndividualHenCount  boolean default false
penEggsLaid            number | null
penChicksHatched       number | null
penMaleCount           number | null
penFemaleCount         number | null
createdAt, updatedAt
```

**Note:** `henCount` is NOT a stored field — derive it from `hens.length`.

### Dashboard
```
GET /api/dashboard
Response: { breeding: { ... }, finance: { ... } }
```
(Same shape as the existing farm app dashboard.)

---

## Deployment

### DO Droplet
- **$6/mo plan** — 1 vCPU / 1 GB RAM / 25 GB SSD — sufficient for this app
- Ubuntu 22.04
- Docker + Docker Compose
- Nginx as reverse proxy + SSL (Certbot / Let's Encrypt)
- Docker restart policy (no PM2 needed inside container)

### Nginx config sketch
```nginx
server {
  listen 80;
  server_name tiknok.app www.tiknok.app;
  return 301 https://$host$request_uri;
}
server {
  listen 443 ssl;
  server_name tiknok.app www.tiknok.app;
  location / {
    proxy_pass http://localhost:3000;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_cache_bypass $http_upgrade;
  }
}
```

### DO Spaces file organisation
```
tiknok-media/
  portfolio/
    videos/        ← fight videos
    thumbnails/    ← video stills
    breeding/      ← breeding material videos + photos
    photos/        ← gallery photos
    featured/      ← hero/jumbotron images
```
All files are public-read (served via CDN URL).

---

## PWA Config

`public/manifest.json`
```json
{
  "name": "RDD GameFarm",
  "short_name": "RDD",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#080B14",
  "theme_color": "#3B82F6",
  "icons": [
    { "src": "/icons/192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icons/512.png", "sizes": "512x512", "type": "image/png" }
  ]
}
```

---

## UI Design System

### Brand
- **Name:** RDD GameFarm
- **Vibe:** Dark & Modern — deep navy-black, electric blue accents, premium sports brand feel

### Color Tokens
```
--bg-base:        #080B14   deep navy-black background
--bg-surface:     #0D1117   card backgrounds
--bg-raised:      #161B27   elevated cards, modals, dropdowns
--border:         #1E2A3A   subtle borders
--accent:         #3B82F6   electric blue — primary accent
--accent-glow:    #3B82F620 blue glow for hover states
--accent-dark:    #2563EB   accent hover/pressed
--success:        #10B981   confirmed, active states
--warning:        #F59E0B   partial, pending states
--danger:         #EF4444   closed, rejected, delete
--text-primary:   #F0F4F8   main text
--text-muted:     #8896A8   secondary text, labels
--text-faint:     #4A5568   placeholder, disabled
```

### Typography
- **Headings:** Rajdhani (Google Fonts) — sharp, condensed, techy. Used for page titles, card titles, section headers
- **Body:** Inter — clean, readable, all body text, labels, forms
- **Monospace:** JetBrains Mono — prices, amounts, codes

### Spacing & Shape
- Border radius: `12px` cards, `8px` inputs/buttons, `6px` chips/badges
- Card padding: `24px` desktop, `16px` mobile
- Section spacing: `80px` desktop, `48px` mobile

### Component Style Rules

**Cards (video, photo, reservation listing):**
- Background: `--bg-surface`
- Border: `1px solid --border`
- Hover: `border-color: --accent`, `box-shadow: 0 0 20px --accent-glow`, `transform: translateY(-2px)`
- Transition: `all 200ms ease`
- Border radius: `12px`
- Overflow: hidden (thumbnail fills top)

**Buttons:**
- Primary: `bg-accent` + white text, hover `bg-accent-dark`, `border-radius: 8px`
- Ghost: transparent + `border: 1px solid --border`, hover `border-accent + text-accent`
- Danger: `bg-danger` bg or ghost danger variant
- Size: `h-10` default, `h-9` compact, `h-12` large CTA

**Inputs / Selects:**
- Background: `--bg-raised`
- Border: `1px solid --border`
- Focus: `border-accent` + `box-shadow: 0 0 0 3px --accent-glow`
- Placeholder: `--text-faint`

**Category / Filter Chips:**
- Inactive: `bg-bg-raised`, `border: 1px solid --border`, `text-muted`
- Active: `bg-accent`, white text, no border
- Hover: `border-accent`, `text-accent`
- Border radius: `999px` (pill shape)

**Badges:**
- Open: green dot + "Open" — `--success`
- Closed / Full: red dot + "Full" — `--danger`
- Done: grey — `--text-faint`
- Pending: amber — `--warning`
- Confirmed: green — `--success`

### Layout

**Desktop:**
- Max content width: `1280px`, centered
- Navbar: fixed top, `bg-bg-base/80` with `backdrop-blur`, logo left, nav links right
- Admin: fixed left sidebar `260px`, content area fills rest

**Mobile / PWA:**
- Bottom tab bar (fixed): Home, Videos, Breeding, Photos, Reservations
  - Active tab: accent color icon + label
  - Inactive: muted icon, no label
  - Background: `--bg-surface`, `border-top: 1px solid --border`
- Top bar: logo center, admin icon right (if logged in)
- Content area: full width, `16px` horizontal padding

### Landing Page Hero
- Full-screen height (`100vh`)
- Background: cycling photo slideshow (featured photos), `5s` interval, smooth crossfade
- Dark gradient overlay: `linear-gradient(to right, #080B14 40%, transparent)`
- Left side content:
  - Small label: "OFFICIAL GAMEFARM" — `text-accent`, `Rajdhani`, uppercase, letter-spaced
  - Farm name: "RDD GAMEFARM" — `Rajdhani`, `6xl`–`8xl`, white, bold
  - Animated blue underline accent bar (slides in on load)
  - Short tagline: `Inter`, `text-muted`
  - Two CTA buttons: "View Our Birds" (primary) + "Make a Reservation" (ghost)
- Scroll indicator: animated chevron bottom-center
- Mobile: gradient covers full image, text bottom-anchored

### Reservation Cards on Landing
- Horizontal scroll row per type (Pahulugan / Months Old / Day Old)
- Section header: type label left, "View All" right (if multiple)
- Card: thumbnail/color bg, listing name, release date badge, bloodline count, status chip
- New badge on recently created listings (within 7 days)

### Video Cards (YouTube style)
- 16:9 thumbnail with duration badge (bottom right, dark pill)
- Below: title (2 lines max, ellipsis), category chips, date
- Hover: thumbnail slight zoom + card glow

### Photo Grid (Instagram style)
- Masonry layout, 3 columns desktop / 2 mobile
- No gaps between photos (tight grid)
- Hover: dark overlay + expand icon

### Admin UI
- Sidebar: `--bg-surface`, icons + labels, accent highlight on active item
- Page header: title left, primary action button right
- Tables: zebra rows (`--bg-raised` on even), hover highlight
- Forms: single column on mobile, 2-col grid on desktop
- Stats cards on dashboard: icon left, number large, label below, subtle accent border-left

### PWA Manifest Colors
```json
{
  "background_color": "#080B14",
  "theme_color": "#3B82F6"
}
```

---

## Build Phases

> **How to use:** Work top-to-bottom, one task at a time. Mark each task `[x]` as soon as it is done before moving to the next. Never skip ahead — each phase depends on the one before it.

---

### PHASE 0 — Project Scaffold
> Goal: runnable blank Next.js app with correct config, fonts, and env wired up.

- [x] **0.1** Run `npx create-next-app@latest . --typescript --tailwind --app --no-src-dir --import-alias "@/*"` inside `tiknok-portfolio/`
- [x] **0.2** Move all source into `src/` folder (`app/`, `components/`, `lib/`, `models/`, `hooks/`, `types/`)
- [x] **0.3** Configure `next.config.ts` — image domains (CDN URL), strict mode
- [x] **0.4** Configure `tailwind.config.ts` — custom color tokens, Rajdhani + Inter + JetBrains Mono fonts, custom border radius
- [x] **0.5** Add Google Fonts to `app/layout.tsx` — Rajdhani (400, 600, 700), Inter (400, 500, 600), JetBrains Mono (400)
- [x] **0.6** Install all dependencies: `mongoose @aws-sdk/client-s3 jsonwebtoken @types/jsonwebtoken bcryptjs @types/bcryptjs @ducanh2912/next-pwa plyr @tanstack/react-query @tanstack/react-query-devtools`
- [x] **0.7** Install shadcn/ui — `npx shadcn@latest init` — pick dark theme, set CSS variables
- [x] **0.8** Install shadcn components needed: `button input label select textarea badge card tabs dialog sheet skeleton sonner`
- [x] **0.9** Create `.env.local` with all values from the Environment Variables section above
- [x] **0.10** Create `public/manifest.json` with PWA config from the PWA Config section above
- [x] **0.11** Verify: `npm run build` passes with no TypeScript or config errors

---

### PHASE 1 — Data Layer (Models + Lib)
> Goal: all Mongoose models defined, DB singleton ready, Spaces client ready, JWT helpers ready.

- [x] **1.1** Create `src/lib/db.ts` — Mongoose singleton connection using `MONGODB_URI` + `MONGODB_DB`
- [x] **1.2** Create `src/lib/auth.ts` — `signAccessToken()`, `signRefreshToken()`, `verifyAccessToken()`, `verifyRefreshToken()`
- [x] **1.3** Create `src/lib/spaces.ts` — S3 client (DO Spaces), `getPresignedUploadUrl()`, `deleteObject()` helpers
- [x] **1.4** Create `src/lib/query-client.ts` — TanStack Query client singleton for client components
- [x] **1.5** Create `src/models/User.ts` — `email`, `passwordHash`, `role: 'admin'`
- [x] **1.6** Create `src/models/Media.ts` — `type`, `page`, `title`, `description`, `url`, `thumbnail`, `categories[]`, `duration`
- [x] **1.7** Create `src/models/Category.ts` — `slug` (unique), `label`, `mediaTypes[]`
- [x] **1.8** Create `src/models/Listing.ts` — full schema from Data Models → Listing section
- [x] **1.9** Create `src/models/Reservation.ts` — full schema from Data Models → Reservation section
- [x] **1.10** Create `src/models/FarmExpense.ts` — reuse existing `farmexpenses` collection schema
- [x] **1.11** Create `src/models/Sale.ts` — reuse existing `sales` collection schema
- [x] **1.12** Create `src/models/Worker.ts` — reuse existing `workers` collection schema
- [x] **1.13** Create `src/models/Season.ts` — reuse existing `seasons` collection schema (+ `markingsGenerated`, `generatedAt`, `expectedHatchDate`)
- [x] **1.14** Create `src/models/Mating.ts` — reuse existing `matings` collection schema (+ all marking fields from Mating Config Fields table)
- [x] **1.15** Create `src/models/MarkingPool.ts` — `seasonId`, `userId`, `assignments[]`, `usedCombos[]`, `generatedAt`
- [x] **1.16** Create `src/types/index.ts` — export shared TypeScript interfaces for all models

---

### PHASE 2 — Auth System
> Goal: login/logout/refresh/me API working, middleware protecting `/admin/*`, login page functional.

- [x] **2.1** Create `src/proxy.ts` — check access token cookie on `/admin/*` routes, redirect to `/login` if missing/invalid. **This project runs Next.js 16.2.9 which replaced `middleware.ts` with `proxy.ts` and `export function middleware` with `export function proxy`. Using `middleware.ts` causes a build error. This is verified — do not change it back.**
- [x] **2.2** Create `src/app/api/auth/login/route.ts` — `POST`: validate email+password, issue access + refresh tokens as `httpOnly` cookies
- [x] **2.3** Create `src/app/api/auth/logout/route.ts` — `POST`: clear both token cookies
- [x] **2.4** Create `src/app/api/auth/refresh/route.ts` — `POST`: verify refresh token, rotate to new pair
- [x] **2.5** Create `src/app/api/auth/me/route.ts` — `GET`: return decoded user from access token
- [x] **2.6** Create `src/app/api/auth/seed/route.ts` — `POST`: one-time admin seed (creates user from `ADMIN_EMAIL`/`ADMIN_PASSWORD` env vars if no admin exists)
- [x] **2.7** Create `src/app/login/page.tsx` — minimal login form (email + password), calls `/api/auth/login`, redirects to `/admin` on success
- [x] **2.8** Verify: build passes, all auth routes registered, proxy guard active on `/admin/*`

---

### PHASE 3 — Media & Categories API
> Goal: full CRUD for media + categories, presigned upload URL working.

- [x] **3.1** Create `src/app/api/categories/route.ts` — `GET` (filterable by `?mediaType=`), `POST` (idempotent by slug)
- [x] **3.2** Create `src/app/api/media/route.ts` — `GET` (paginated cursor, filterable by `?page=&category=`), `POST` (create media record after upload)
- [x] **3.3** Create `src/app/api/media/presign/route.ts` — `POST`: validate admin JWT, return `{ presignedUrl, finalCdnUrl }` for DO Spaces direct upload
- [x] **3.4** Create `src/app/api/media/[id]/route.ts` — `PATCH`, `DELETE` (delete from Spaces + MongoDB)
- [x] **3.5** Verify: build passes, all 13 routes registered cleanly

---

### PHASE 4 — Farm Management APIs
> Goal: expenses, sales, workers, dashboard API routes working. All reuse existing MongoDB collections.

- [x] **4.1** Create `src/app/api/expenses/route.ts` — `GET` (`?month=&year=`), `POST`
- [x] **4.2** Create `src/app/api/expenses/summary/route.ts` — `GET`
- [x] **4.3** Create `src/app/api/expenses/[id]/route.ts` — `GET`, `PATCH` (locked=true → 403), `DELETE` (locked=true → 403)
- [x] **4.4** Create `src/app/api/sales/route.ts` — `GET` (`?month=&year=`), `POST`
- [x] **4.5** Create `src/app/api/sales/summary/route.ts` — `GET`
- [x] **4.6** Create `src/app/api/sales/[id]/route.ts` — `PATCH`, `DELETE`
- [x] **4.7** Create `src/app/api/workers/route.ts` — `GET`, `POST`
- [x] **4.8** Create `src/app/api/workers/[id]/route.ts` — `PATCH`, `DELETE` + sub-routes for advances and payments
- [x] **4.9** Create `src/app/api/dashboard/route.ts` — `GET`: combined breeding + finance summary
- [x] **4.10** Verify: build passes, 24 routes registered

---

### PHASE 5 — Breeding & Marking APIs
> Goal: full seasons + matings CRUD, marking engine pure function, 3-step generate flow working.

- [x] **5.1** Create `src/app/api/seasons/route.ts` — `GET`, `POST`
- [x] **5.2** Create `src/app/api/seasons/[id]/route.ts` — `GET`, `PATCH`, `DELETE`
- [x] **5.3** Create `src/app/api/seasons/[id]/duplicate/route.ts` — `POST`: copy season + matings, previousMarking logic
- [x] **5.4** Create `src/app/api/seasons/[id]/matings/route.ts` — `GET`, `POST`
- [x] **5.5** Create `src/app/api/seasons/[id]/matings/[matingId]/route.ts` — `PATCH` (lifecycle + config), `DELETE`
- [x] **5.6** Create `src/lib/marking-engine.ts` — pure function (no DB, no HTTP) — full algorithm from Marking Generation Algorithm section
- [x] **5.7** Write unit tests for `marking-engine.ts` — conflict validation, nose group assignment, same/unique hen marking, overflow case
- [x] **5.8** Create `src/app/api/seasons/[id]/generate/route.ts` — `POST` (preview), `DELETE` (reset)
- [x] **5.9** Create `src/app/api/seasons/[id]/generate/swap/route.ts` — `POST` (stateless swap preview)
- [x] **5.10** Create `src/app/api/seasons/[id]/generate/confirm/route.ts` — `POST` (validate + atomic DB write)
- [x] **5.11** Verify: full generate flow (preview → swap → confirm) works end-to-end. Reset clears all assignments.

---

### PHASE 6 — Reservation APIs
> Goal: listing CRUD, public buyer form submission, admin confirm/reject, payment schedule calculation.

- [x] **6.1** Create `src/lib/payment-schedule.ts` — `calcWeeklySchedule()`, `calcMonthlySchedule()` pure functions
- [x] **6.2** Create `src/app/api/listings/route.ts` — `GET` (`?type=&active=`), `POST` (admin)
- [x] **6.3** Create `src/app/api/listings/[slug]/route.ts` — `GET` (public — open bloodlines only), `PATCH` (admin), `DELETE` (admin)
- [x] **6.4** Create `src/app/api/reservations/route.ts` — `POST` (public buyer submit — compute totals, downPayment, balance, schedule)
- [x] **6.5** Create `src/app/api/reservations/[listingSlug]/[buyerSlug]/route.ts` — `GET` (public — 404 if not confirmed)
- [x] **6.6** Create `src/app/api/admin/reservations/route.ts` — `GET` (admin — filterable)
- [x] **6.7** Create `src/app/api/admin/reservations/[id]/confirm/route.ts` — `PATCH`
- [x] **6.8** Create `src/app/api/admin/reservations/[id]/reject/route.ts` — `PATCH`
- [x] **6.9** Verify: buyer submits form → pending. Admin confirms → public link returns order. Payment schedule math is correct.

---

### PHASE 7 — Admin UI
> Goal: every admin page is functional with real API data.

- [x] **7.1** Create `src/app/admin/layout.tsx` — sidebar layout + auth guard (redirect if no token)
- [x] **7.2** Create `src/components/layout/AdminSidebar.tsx` — nav links: Dashboard, Upload, Reservations, Breeding, Expenses, Sales, Workers
- [x] **7.3** Create `src/app/admin/page.tsx` — Dashboard: stats cards (finance + breeding summary from `/api/dashboard`)
- [x] **7.4** Create `src/app/admin/upload/page.tsx` — full upload form: file picker, fields, presigned upload flow, progress bar
- [x] **7.5** Create `src/app/admin/expenses/page.tsx` — expense list, add/edit/delete form, month/year filter
- [x] **7.6** Create `src/app/admin/sales/page.tsx` — sales list, add/edit/delete form
- [x] **7.7** Create `src/app/admin/workers/page.tsx` — workers list, salary management
- [x] **7.8** Create `src/app/admin/reservations/page.tsx` — tabs: Pahulugan / Months Old / Day Old. Per tab: Listings sub-tab + Reservations sub-tab
- [x] **7.9** Create `src/app/admin/reservations/` listing create/edit form — all fields per type from Listing Admin Fields table
- [x] **7.10** Create `src/app/admin/breeding/page.tsx` — tabs: Seasons, Matings, Generate, Lifecycle
- [x] **7.11** Build Seasons tab — list seasons, create, duplicate
- [x] **7.12** Build Matings tab — per-season mating list, add stag + hens, set `sameMarking` / `mandatoryMarking`
- [x] **7.13** Build Generate tab — 3-step UI: preview table → swap markings → confirm button
- [x] **7.14** Build Lifecycle tab — toggle pen/per-hen mode, input eggs laid + chicks hatched counts
- [x] **7.15** Verify: all admin pages load data, forms submit, UI matches dark design system.

---

### PHASE 8 — Public Pages
> Goal: all public-facing pages functional, correct data, mobile layout with bottom tab bar.

- [x] **8.1** Create `src/components/layout/Navbar.tsx` — desktop fixed top nav (logo + links)
- [x] **8.2** Create `src/components/layout/BottomTabBar.tsx` — mobile fixed bottom nav (Home, Videos, Breeding, Photos, Reservations)
- [x] **8.3** Create `src/app/(public)/layout.tsx` — wraps public pages with Navbar + BottomTabBar
- [x] **8.4** Create `src/components/landing/Hero.tsx` — full-screen slideshow (featured photos), gradient overlay, tagline, 2 CTA buttons, scroll indicator
- [x] **8.5** Create `src/app/(public)/page.tsx` — Landing: Hero → section cards (Videos, Breeding, Photos) → reservation listing cards (horizontal scroll rows per type)
- [x] **8.6** Create `src/components/media/VideoCard.tsx` — 16:9 thumbnail, duration badge, title, category chips, date
- [x] **8.7** Create `src/components/media/VideoPlayer.tsx` — Plyr.js wrapped in a modal/dialog
- [x] **8.8** Create `src/app/(public)/videos/page.tsx` — category filter chips + video grid + player modal on click
- [x] **8.9** Create `src/components/media/PhotoCard.tsx` — masonry-compatible image with hover overlay
- [x] **8.10** Create `src/app/(public)/breeding/page.tsx` — mixed video + photo grid with category filter
- [x] **8.11** Create `src/app/(public)/photos/page.tsx` — masonry 3-col/2-col grid + lightbox
- [x] **8.12** Create `src/app/(public)/pahulugan/[slug]/page.tsx` — reservation form: buyer fields, bloodline picker, qty, live price calculation, payment plan selector, submit → pending confirmation message
- [x] **8.13** Create `src/app/(public)/pahulugan/[slug]/[buyer]/page.tsx` — confirmed order view: order details + payment schedule
- [x] **8.14** Create `src/app/(public)/months-old/[slug]/page.tsx` — Months Old reservation form (same pattern)
- [x] **8.15** Create `src/app/(public)/months-old/[slug]/[buyer]/page.tsx` — confirmed order view
- [x] **8.16** Create `src/app/(public)/day-old/[slug]/page.tsx` — Day Old reservation form
- [x] **8.17** Create `src/app/(public)/day-old/[slug]/[buyer]/page.tsx` — confirmed order view
- [x] **8.18** Verify: all public pages render correctly on mobile (375px) and desktop. Bottom tab bar navigates correctly.

---

### PHASE 9 — PWA & Polish
> Goal: app installable as PWA, offline shell, icons, meta tags.

- [ ] **9.1** Configure `@ducanh2912/next-pwa` in `next.config.ts`
- [ ] **9.2** Create PWA icons: `public/icons/192.png` and `public/icons/512.png` (RDD GameFarm logo)
- [ ] **9.3** Add `<meta>` tags in `app/layout.tsx` — viewport, theme-color, apple-mobile-web-app-capable, OG tags
- [ ] **9.4** Add `<link rel="manifest">` in `app/layout.tsx`
- [ ] **9.5** Create offline fallback page `src/app/offline/page.tsx`
- [ ] **9.6** Verify: Chrome DevTools → Application → Manifest shows correct config. App is installable on Android/iPhone.

---

### PHASE 10 — Deployment
> Goal: app running in Docker on DO Droplet, accessible via domain with HTTPS.

- [ ] **10.1** Create `Dockerfile` — multi-stage: `node:20-alpine` builder + minimal runner
- [ ] **10.2** Create `docker-compose.yml` — local dev compose (Next.js container + .env.local)
- [ ] **10.3** Create `nginx.conf` — HTTP → HTTPS redirect + reverse proxy to port 3000 (see Nginx config sketch)
- [ ] **10.4** Create `.dockerignore` — exclude `node_modules`, `.next`, `.env*`
- [ ] **10.5** Provision DO Droplet ($6/mo, Ubuntu 22.04), install Docker + Docker Compose
- [ ] **10.6** Set up DNS — point domain to Droplet IP
- [ ] **10.7** Install Certbot on Droplet, issue SSL cert via Let's Encrypt
- [ ] **10.8** Copy `.env.production` to Droplet (via `scp` or DO console), build + run container
- [ ] **10.9** Verify: `https://tiknok.app` loads, HTTPS works, PWA installs on phone.

---

### Progress Tracker

| Phase | Name | Status |
|---|---|---|
| 0 | Project Scaffold | ✅ Complete |
| 1 | Data Layer | ✅ Complete |
| 2 | Auth System | ✅ Complete |
| 3 | Media & Categories API | ✅ Complete |
| 4 | Farm Management APIs | ✅ Complete |
| 5 | Breeding & Marking APIs | ✅ Complete |
| 6 | Reservation APIs | ✅ Complete |
| 7 | Admin UI | ✅ Complete |
| 8 | Public Pages | ✅ Complete |
| 9 | PWA & Polish | ⬜ Not started |
| 10 | Deployment | ⬜ Not started |

---

## Notes / Constraints

- `userId` on all records ALWAYS comes from the decoded JWT on the server. Never trust client body.
- Only ONE admin account (seeded via `ADMIN_EMAIL` / `ADMIN_PASSWORD` env vars on first run).
- **Media model has no `userId` field** — this is intentional. Single-admin app; all media belongs to the one admin.
- **Same database as the farm app.** Collections `farmexpenses`, `sales`, `workers`, `seasons`, `matings`, `markingpools`, `users` are the live farm app collections. New collections `media`, `categories`, `listings`, `reservations` are added to the same DB. Do NOT rename or restructure existing collections.
- Database name is `test` (confirmed from Atlas). URI: `...mongodb.net/test?appName=cockfighting-cluster`. No separate `MONGODB_DB` env var — `lib/db.ts` calls `mongoose.connect(MONGODB_URI)` matching the farm app pattern.
- Video upload uses **presigned URLs** — files go browser → DO Spaces directly, never through the Droplet.
- No ffmpeg, no transcoding. Videos must be H.264 MP4 before upload.
- iPhone users: set Camera → Formats → Most Compatible for new recordings. Convert old HEVC clips with a free App Store converter.
- Category creation is idempotent: `POST /api/categories { label: "Hatch Grey" }` returns existing doc if slug already exists.
