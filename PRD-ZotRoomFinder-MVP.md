# Product Requirements Document: Zot Room Finder

## Product Overview

**App Name:** Zot Room Finder
**Tagline:** Stop scavenging, start studying.
**Launch Goal:** Add a high-impact project to resume and serve a few hundred UCI students.
**Target Launch:** 4-6 weeks (Resume-ready).

## Who It's For

### Primary User: UCI Students
A UCI student who needs a quiet study space but is tired of checking Langson, Science Library, and Mesa Study Center websites one by one.

**Their Current Pain:**
- Wasting 10+ minutes clicking through different library reservation calendars.
- Missing out on rooms because someone else booked them while they were checking a different site.
- Too many tabs open just to find one hour of quiet time.

**What They Need:**
- A single "source of truth" for all available rooms.
- The ability to see what's open *right now* or at a specific time.
- A fast way to get from "searching" to "booked."

### Example User Story
"Meet Jayanth, a UCI student with a midterm in two hours. He needs a room in the Science Library, but it's full. Usually, he’d have to manually navigate to the Langson site and then Mesa. Instead, he opens **Zot Room Finder**, enters '2:00 PM to 4:00 PM,' sees a list of available rooms across campus, and clicks a link to book his spot instantly."

## The Problem We're Solving

Finding a study room at UCI is currently a manual "scavenger hunt." Data is siloed across different booking platforms (LibCal for libraries vs. housing-specific portals).

**Why Existing Solutions Fall Short:**
- **UCI Library Sites:** Only show library rooms; requires multiple clicks to change dates/times.
- **Mesa Study Center:** Uses a different system entirely.
- **Manual Checking:** Slow, frustrating, and mobile-unfriendly.

## User Journey

### Discovery → First Use → Success

1. **Discovery Phase**
   - **How they find us:** Discord study groups, Reddit (r/UCI), or Justin’s portfolio.
   - **Decision trigger:** The frustration of seeing "No slots available" on the main library site.

2. **Onboarding (First 5 Minutes)**
   - **Land on:** A clean, UCI-themed search page.
   - **First action:** Select a start time and end time.
   - **Quick win:** Immediately seeing a list of 5 available rooms they didn't know were open.

3. **Core Usage Loop**
   - **Trigger:** Needing a place to study between classes.
   - **Action:** Search → Compare locations → Click Booking Link.
   - **Reward:** A confirmed reservation in under 60 seconds.

4. **Success Moment**
   - **"Aha!" moment:** Realizing they never have to check three different websites again.

## MVP Features

### Must Have for Launch

#### 1. Universal Time-Range Search
- **What:** A simple input for Start Time and End Time.
- **User Story:** As a student, I want to filter rooms by my specific availability so I don't see rooms that are already taken.
- **Success Criteria:**
  - [ ] Users can select times in 30-minute increments.
  - [ ] Results update instantly or via a "Search" button.
- **Priority:** P0

#### 2. Aggregated Room List
- **What:** A unified view showing rooms from Mesa, Langson, and Science Library.
- **User Story:** As a student, I want to see all campus options in one list so I can choose the most convenient location.
- **Success Criteria:**
  - [ ] Displays Room Name, Location, and Availability.
- **Priority:** P0

#### 3. Direct-to-Book Links
- **What:** A button for each room that opens the official UCI reservation page.
- **User Story:** As a student, I want to jump straight to the booking form so I don't have to find the room again on the official site.
- **Success Criteria:**
  - [ ] Links lead directly to the specific room's booking calendar.
- **Priority:** P0

### NOT in MVP (Saving for Later)
- **Interactive Maps:** Showing room locations on a UCI map.
- **Push Notifications:** Reminders that your booking is about to start.
- **In-App Booking:** (Keeping it simple by linking out to official sites first).

## How We'll Know It's Working

### Launch Success Metrics (First 30 Days)
| Metric | Target | Measure |
|--------|--------|---------|
| Unique Visitors | 200+ | Plausible or Google Analytics |
| Booking Click-Through | 40% | Tracking clicks on the "Book" button |

## Look & Feel

**Design Vibe:** UCI-themed, Fast, Minimal, Clean.

**Visual Principles:**
1. **Anteater Spirit:** Use UCI Blue (#0064A4) and Gold (#FFD200).
2. **Speed First:** No heavy images; text-based results for fast loading on campus Wi-Fi.
3. **Clutter-Free:** Only show what’s available; hide the noise.

## Technical Considerations

**Platform:** Web (Responsive).
**Performance:** Search results should return in < 2 seconds.
**Security:** No user data collection needed for MVP (No login = higher privacy/trust).

## Budget & Constraints

**Development Budget:** $0 (Using free tiers like Vercel/Netlify).
**Timeline:** 4-6 weeks for a polished resume version.

## Next Steps

After this PRD is approved:
1. Create Technical Design Document (Part 3)
2. Set up development environment
3. Build MVP with AI assistance
4. Test with 5-10 beta users
5. Launch!

---
*Document created: February 12, 2026*
*Status: Draft — Ready for Technical Design*