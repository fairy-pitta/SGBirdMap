# SGBirdMap

A map of bird observations in Singapore, built from eBird data. You can pick a period and a species, then play the observations back over time on the map, with an optional heatmap of observation density.

Live demo: https://sgbirdsmap.fairy-pitta.net

## How it works

```
sgbirdsmap.fairy-pitta.net
  └─ Cloudflare Worker "sgbirdmap"
       ├─ static assets   out/ (Next.js static export)
       ├─ /api/*          worker/index.ts, reads from D1 "sgbirdmap-db"
       │                    /api/species        list of species
       │                    /api/observations   observations filtered by period and species
       │                    /api/health
       └─ cron 0 2 * * *  worker/ingest.ts, fetches recent eBird observations into D1
```

- The front end is a single Next.js page exported as static files (`output: 'export'`). There is no server-side rendering.
- The same Cloudflare Worker serves the static files and a small read-only API under `/api/*`. Only `/api/*` is routed to the Worker code; every other path is served directly from `out/`.
- Observations are stored in Cloudflare D1. At the time of writing the database holds roughly 497,000 observations of 553 species, from 1 January 2003 to the present.
- A cron trigger runs every day at 02:00 UTC (10:00 in Singapore). It fetches the last seven days of observations from the eBird API and upserts them, so the map stays current without manual steps. Re-running the import does not create duplicates, because each row is keyed on the eBird checklist ID and species code.

### Limitation: one record per species per day

The eBird endpoints used here (`historic` with `rank=mrec` for the backfill, and `recent` for the daily update) return only the most recent record of each species, not every checklist. The database therefore holds at most one record per species per day across Singapore, and the map shows one representative location per species per day. If a species was seen at several places on the same day, only one of them appears. This is enough to follow how sightings move over time, but it is not every eBird record. See [docs/architecture.md](docs/architecture.md) for details (in Japanese).

## Stack

- Next.js 15 (App Router, static export), React 19, TypeScript
- Tailwind CSS and shadcn/ui
- Leaflet with OpenStreetMap tiles
- Cloudflare Workers (static assets and API), Cloudflare D1, Cron Triggers
- Wrangler for deployment, Vitest for tests

## Local development

Requirements: Node.js and npm. An eBird API key (https://ebird.org/api/keygen) is needed only for importing data.

```bash
npm install
npm run dev        # Next.js development server for the front end
npm test           # Vitest tests for the Worker (query building and ingest)
npm run build      # static export into out/
npm run deploy     # build, then wrangler deploy (needs access to the Cloudflare account)
```

The development server does not serve `/api/*`. To run the front end and the API together against a local D1 database, build first and then use Wrangler:

```bash
npm run build
npx wrangler d1 execute sgbirdmap-db --local --file=schema.sql
npx wrangler dev
```

### Importing data

The full history is imported once by hand; daily updates are handled by the cron trigger.

```bash
EBIRD_API_KEY=... npm run collect   # fetch observations from eBird into data/observations.jsonl
npm run build:sql                   # turn them into SQL files under data/sql/
npm run import:d1                   # load the SQL files into remote D1 (npm run import:d1 -- --local for a local database)
```

eBird rejects concurrent requests, so collection runs one request at a time and takes a few hours for the full range. Progress is saved, so an interrupted run continues where it stopped. The D1 free plan allows 100,000 written rows per day, so the import may need to be resumed on a later day.

The Worker reads the eBird API key from a Wrangler secret:

```bash
npx wrangler secret put EBIRD_API_KEY
```

## Data and attribution

Bird observation data comes from [eBird](https://ebird.org), run by the Cornell Lab of Ornithology. Use of the data follows the [eBird API Terms of Use](https://www.birds.cornell.edu/home/ebird-api-terms-of-use/). The live site credits eBird and the Cornell Lab of Ornithology in the map attribution and in the About dialogue.

This repository does not include the raw dataset. The collected observations and generated SQL files are excluded from version control, and anyone running the import needs their own eBird API key.

Other sources:

- Map tiles: © OpenStreetMap contributors
- Singapore land boundary GeoJSON by [@cheeaun](https://gist.github.com/cheeaun/78bb5c3bd27759a14b3cf8e6b6568080)
- Taxonomy: Clements et al. (2024), The eBird/Clements Checklist of Birds of the World: v2024
