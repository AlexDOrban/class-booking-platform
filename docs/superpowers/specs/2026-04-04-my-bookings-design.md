# My Bookings Feature — Design Spec

**Date:** 2026-04-04
**Status:** Approved

---

## Overview

Add a "My Bookings" tab to the student view so users can see, manage, and navigate to their booked classes. The current app tracks class enrollment counts but never records which classes the current user has booked.

---

## Architecture

All changes are contained in `ClassBookingApp.tsx`. No new files or components are needed.

**State additions:**
- `bookedIds: Map<number, { pricePaid: string }>` — maps class ID to booking metadata (price at time of booking)
- `expandedBookingId: number | null` — which booking card is currently expanded (only one at a time)
- `studentTab: 'browse' | 'bookings'` — which sub-tab is active in the student view

**Existing state touched:**
- `handleBook` — must also add the class ID to `bookedIds`
- A new `handleCancelBooking(id)` function removes the ID from `bookedIds` and decrements `enrolled` on the class

---

## UI Structure

### Tab bar (student view only)

Rendered at the top of the student scroll area, replacing the current hero-first layout:

```
[ Browse Classes ]  [ My Bookings (N) ]
```

- Styled to match the existing Student/Teacher toggle (surfaceAlt background, accent active state)
- Badge shows `bookedIds.size` — hidden when 0
- Switching tabs resets `expandedBookingId` to null

### Browse tab

Identical to the current student view (hero, category filters, profile dropdown, class cards). No changes here.

### My Bookings tab

Renders a vertical list of booked classes, sorted by date ascending.

**Empty state:** When `bookedIds.size === 0`, show a centred message:
> "No bookings yet. Browse classes to find something you'll love."
> With a "Browse Classes →" button that switches to the browse tab.

**Booking rows (collapsed):**
- Class colour dot (emoji icon in a rounded square matching `cls.color`)
- Title + date/time/duration
- Price paid (discounted price at time of booking — stored in `bookedIds` map, see below)
- "›" chevron on the right

**Booking row (expanded — only one at a time):**
- Same compact header stays visible (now shows "∨" chevron)
- Expanded section slides open below the header, containing:
  - "✓ Booked" green badge + teacher name & category
  - Address line
  - Two buttons side by side: **Cancel Booking** (red) | **Get Directions** (purple)

**Cancel flow:**
- Tapping "Cancel Booking" shows a simple confirmation `Alert` (React Native `Alert.alert`)
- On confirm: removes ID from `bookedIds`, decrements `cls.enrolled`, collapses row, shows success banner "Booking cancelled"

**Get Directions:**
- Calls `Linking.openURL` with a Google Maps URL using `cls.address`

---

## Data: Storing Price at Booking Time

`bookedIds` is upgraded from `Set<number>` to `Map<number, { pricePaid: string }>` so the price shown in My Bookings reflects the discount that was active when the user booked (not the current profile type).

```ts
const [bookedIds, setBookedIds] = useState<Map<number, { pricePaid: string }>>(new Map());
```

---

## Animation

The expand/collapse uses `Animated.timing` on a height value or simply conditional rendering — given the RN constraints and that only one card expands at a time, **conditional rendering** (no animation) is used for the expanded section to keep implementation simple and reliable. The card border changes to the accent colour (`#7c5cbf`) when expanded.

---

## Scope Boundaries

- **In scope:** booking state tracking, tab bar, compact/expand card UI, cancel flow, get directions
- **Out of scope:** persistence across app restarts (no AsyncStorage), push notifications, booking history/past classes

---

## Files Changed

| File | Change |
|---|---|
| `ClassBookingApp.tsx` | All state + UI changes |
