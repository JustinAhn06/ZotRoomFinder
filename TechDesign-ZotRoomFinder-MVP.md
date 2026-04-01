# Technical Design Document: Zot Room Finder MVP

## Executive Summary
**Project:** Zot Room Finder
**Role:** Vibe-Coder (AI-Assisted)
**Core Function:** Aggregating study room availability from multiple UCI websites into a single interface.
**Architecture:** Serverless Web App (Next.js) with real-time scraping/fetching.

---

## 1. High-Level Architecture

We will build a **Single Page Application (SPA)** that talks to a lightweight backend "API" (which we will build as part of the same app).

**The Flow:**
1.  **User** visits `zotrooms.vercel.app` (example).
2.  **Frontend** (The UI) asks the Backend: *"Get me rooms for 2pm-4pm."*
3.  **Backend** (API Route) instantly visits UCI's LibCal and Mesa websites in the background.
4.  **Backend** scrapes/extracts the available times and cleans up the messy data.
5.  **Frontend** receives a clean list and displays it nicely.

---

## 2. The Tech Stack (Vibe-Coder Edition)

We are choosing tools that **AI knows very well**, making it easy for Cursor/ChatGPT to write the code for you.

| Component | Tool | Why? |
|-----------|------|------|
| **Framework** | **Next.js** (React) | The industry standard. AI is excellent at writing Next.js code. |
| **Styling** | **Tailwind CSS** | You can say "Make it UCI Blue" and AI handles the CSS classes. |
| **Language** | **TypeScript** | Catches errors before they break your app. (Don't worry, AI writes it). |
| **Scraping** | **Cheerio** or **Puppeteer** | Libraries that let code "read" other websites. |
| **Hosting** | **Vercel** | Free, zero-configuration hosting for Next.js. |
| **Editor** | **Cursor** | The AI code editor that will write 90% of this for you. |

---

## 3. Data Strategy (The Hard Part)

Since UCI doesn't have a public "Open Room API," we have to fetch the data ourselves.

### The Source Targets:
1.  **UCI Libraries (LibCal):**
    * *URL:* `https://uci.libcal.com/`
    * *Method:* These sites often use hidden internal APIs or standard HTML tables.
    * *Strategy:* We will ask AI to "Inspect the Network tab" of these sites to find the JSON data source, which is much faster than parsing HTML.

2.  **Mesa Study Center:**
    * *Strategy:* Likely requires parsing HTML (Cheerio).

### The "Unified" Data Model
We need to convert the messy data from different sites into one clean format for our app:

```typescript
interface Room {
  id: string;
  name: string;        // e.g., "Science Library 201"
  location: string;    // e.g., "Science Library"
  capacity: number;    // e.g., 4
  bookingUrl: string;  // Direct link to book
  availableSlots: [
    { start: "14:00", end: "14:30" },
    { start: "14:30", end: "15:00" }
  ];
}