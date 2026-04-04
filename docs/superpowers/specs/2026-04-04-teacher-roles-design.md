# Teacher View & Roles System — Design Spec

**Date:** 2026-04-04
**Status:** Approved

---

## Overview

Three connected features:
1. **Roles system** — teachers can define custom roles with per-role capacity when creating a class (e.g. Lead/Follow for dance, Guitarist/Bassist for music)
2. **Teacher class management** — improved teacher view with pairing status, named enrolled students, and at-risk class warnings
3. **Student role booking** — two-step booking flow for role-based classes: Solo (auto-paired) or Pre-formed pair

---

## Data Model Changes

### `ClassItem` additions

```ts
interface Role {
  name: string;          // e.g. "Lead", "Follow", "Guitarist"
  capacity: number;      // per-role cap
}

interface ClassItem {
  // ... existing fields unchanged ...
  roles: Role[];          // empty array = no roles (existing behaviour preserved)
  minPairs: number;       // 0 = no minimum (used only when roles.length > 0)
}
```

### `Booking` — replaces simple `bookedIds` Map value

```ts
interface Booking {
  pricePaid: string;
  bookingType: 'solo' | 'pair';
  role: string;               // role name the student booked
  partnerName?: string;       // only for pair bookings
  partnerRole?: string;       // only for pair bookings
  pairedWithBookingId?: number; // set when auto-paired (solo bookings)
}
```

`bookedIds` type becomes `Map<number, Booking>`.

### `NewClassForm` additions

```ts
interface NewClassForm {
  // ... existing fields unchanged, including capacity ...
  roles: { name: string; capacity: string }[];  // empty = no roles
  minPairs: string;
  // capacity field still used for no-role classes
  // when roles are defined, effective capacity = sum of role capacities
}
```

### `ClassItem` additions (enrollment tracking)

```ts
interface ClassItem {
  // ... existing fields unchanged ...
  roles: Role[];
  minPairs: number;
  roleEnrollments: Record<string, number>;   // roleName → enrolled count; {} when no roles
  waitingList: { studentName: string; role: string; timestamp: number }[];  // solo unpaired
}
```

`initialClasses` seed data: all existing classes get `roles: []`, `minPairs: 0`, `roleEnrollments: {}`, `waitingList: []`.

---

## Feature 1: Multi-Step Class Creation Wizard

The existing "Create Class" modal is replaced with a 3-step wizard.

### Step 1 — Basic Details
Fields: Title, Teacher, Category, Date, Time, Duration, Address.
Same fields as current form, minus Capacity.
Progress indicator: 3 dots / step bar at top.

### Step 2 — Roles & Minimum
Two options shown:
- **"Yes, add roles"** (selected) / **"No roles"** (unselected)

When "Yes, add roles" selected:
- List of role rows: `[Role name input]  [Capacity input]  [× delete]`
- "+ Add role" dashed button below
- Minimum 2 roles required to proceed
- **"MINIMUM PAIRS TO RUN"** number input below role list
- Helper text: "Class cancels 48h before if not reached"

When "No roles":
- Single capacity field shown instead
- minPairs = 0

Navigation: Back / Next buttons.

### Step 3 — Price & Description
Fields: Base price, Student discount %, Senior discount %, Description, Color picker.
Navigation: Back / Create Class button.

---

## Feature 2: Teacher Class Management View

### Class list (collapsed state)

Each class card shows:
- Colour bar at top (existing)
- Title + date/time
- Right side: pair count badge (green "4/5 pairs ✓" or red "⚠️ 1/4 pairs") + "›" chevron
- Below title row: anonymous role chips
  - Paired: green chip `Lead + Follow` (or role names)
  - Pre-formed pair: green chip `Lead + Follow ★`
  - Waiting: yellow chip `Lead ⏳` (solo, no partner yet) or red chip `Follow ⏳` (if class is below minimum)
- For non-role classes: just shows `👥 6/8 enrolled · min 4 ✓`
- Below-minimum warning: red border on card + `⏰ Cancels in Xh if no change`

### Class detail (expanded state)

Tapping replaces chips with:

**PAIRED (N)** section header + `★ = booked as a pre-formed pair` legend on the right

Named pair boxes (green):
```
┌──────────────────┐
│ Lead + Follow ★  │
│ Maria & João     │
└──────────────────┘
```
One box per pair, showing role labels and both student names. Pre-formed pairs marked with ★.

**⏳ WAITING FOR PARTNER (N)** section:
- One row per unpaired solo student: name on left, role badge on right

**✏️ Edit Class Details** button at bottom — opens edit modal with same 3-step wizard pre-filled.

Only one class expanded at a time. Tapping again collapses.

---

## Feature 3: Student Booking Flow (Role Classes)

Only triggered when `cls.roles.length > 0`. Classes without roles use existing booking flow unchanged.

### Step 1 — Solo or Pair?

Two large option cards:
- **👤 Solo — I'll be paired automatically**: "Pick a role, get matched with the next available partner"
- **👥 Pair — I'm coming with a partner**: "Book both roles at once, guaranteed together"

### Step 2a — Solo booking

Role buttons for each role with remaining spots shown:
```
[ Lead  ·  3 left ]   [ Follow  ·  5 left ]
```
Disabled if role is full. Confirm button shows price.

On confirm:
- Student added to `waitingList` for that role
- If a matching partner is available in `waitingList`, both are auto-paired (FIFO)
- `bookedIds` updated with `bookingType: 'solo'`, `role`, `pairedWithBookingId` if matched

### Step 2b — Pair booking

Two rows:
```
[ Your name     ]  [ Role ▾ ]
[ Partner name  ]  [ Role ▾ ]
```
Role dropdowns show available roles. Both roles must be different. Validation: both names required, roles must differ.

On confirm:
- Both slots reserved atomically
- `bookedIds` updated with `bookingType: 'pair'`, `partnerName`, `partnerRole`
- Counts as one pre-formed pair (★) in teacher view

### My Bookings display (role classes)

Compact header shows role: `Lead · Mar 15 · 19:00`
Expanded detail shows:
- Role badge
- "Paired with: [name]" if paired, "Waiting for partner" if not yet paired
- Cancel and Get Directions buttons (existing)

---

## Class Cancellation Logic

When `roles.length > 0 && minPairs > 0`:
- Teacher view shows countdown: `⏰ Cancels in Xh` when fewer complete pairs than `minPairs` and class is within 48h window
- Cancellation notification is **UI only** for now (no push notifications — out of scope)
- "Cancels in Xh" computed from `class.date + class.time - 48h - now`

---

## Scope Boundaries

**In scope:**
- Multi-step create wizard
- Role + capacity definition
- Per-role enrollment tracking
- Pairing logic (FIFO auto-pair + pre-formed pair)
- Teacher expanded view with named pairs
- Student 2-step booking modal
- My Bookings role display
- Minimum pairs countdown display

**Out of scope:**
- Push/email cancellation notifications
- Teacher ability to manually reassign pairs
- Waitlist when a role is full
- Editing roles after class is created (edit shows roles as read-only)

---

## Files Changed

| File | Change |
|---|---|
| `ClassBookingApp.tsx` | All changes — data types, state, create wizard, teacher view, student booking modal |
