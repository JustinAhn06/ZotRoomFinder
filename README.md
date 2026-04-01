# Zot Room Finder

Find available study rooms across UCI libraries in one place.

**Live site:** https://zot-room-finder.vercel.app

## What it does

UCI has study rooms spread across Langson and Science libraries, each with their own booking page on LibCal. Zot Room Finder lets you pick a date and time range and see all available rooms at once — no need to check each library separately.

## Libraries covered

- Langson Library (17 rooms)
- Science Library (26 rooms)

## Tech stack

- [Next.js](https://nextjs.org) (App Router)
- TypeScript
- Tailwind CSS
- Deployed on Vercel

## Running locally

```bash
cd zot-room-finder
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## How it works

Availability is fetched directly from UCI's LibCal API (`spaces.lib.uci.edu/spaces/availability/grid`) — no scraping. Each search queries real-time slot data for the requested date and time window.
