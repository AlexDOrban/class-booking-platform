# Auth & Discount Verification System — Design Spec

**Date:** 2026-04-07
**Status:** Approved

---

## Overview

Add student/senior accounts with identity verification to prevent discount abuse. Students and seniors must upload an ID photo and selfie before receiving discounts. Verification is simulated (auto-approves after 3 seconds) — no backend required. Teachers are unaffected; the teacher toggle remains as-is.

---

## New Files

| File | Responsibility |
|---|---|
| `auth/AuthStore.ts` | Account type, AsyncStorage CRUD, password hashing, verification logic |
| `auth/AuthModals.tsx` | All auth/profile/verification UI components |

`ClassBookingApp.tsx` imports from both files. Auth state is passed down via props/callbacks.

---

## Data Model

### `Account`

```ts
interface Account {
  id: string;                  // uuid generated at sign-up
  name: string;
  email: string;               // unique, stored lowercase
  passwordHash: string;        // SHA-256 hex of password
  avatarUri: string | null;    // local file URI from image picker
  discountType: 'none' | 'student' | 'retired';
  verification: {
    status: 'unverified' | 'pending' | 'approved' | 'rejected';
    idPhotoUri: string | null;   // local URI of ID card photo
    selfieUri: string | null;    // local URI of selfie
    submittedAt: number | null;  // Unix timestamp
  };
}
```

### AsyncStorage layout

| Key | Value |
|---|---|
| `@classe/accounts` | `JSON.stringify(Record<email, Account>)` — all accounts |
| `@classe/currentAccountId` | `string` — id of currently logged-in account, or absent |

### `AuthStore.ts` exports

```ts
loadAccounts(): Promise<Record<string, Account>>
saveAccounts(accounts: Record<string, Account>): Promise<void>
signUp(name, email, password, avatarUri): Promise<Account>  // throws if email taken
signIn(email, password): Promise<Account>                   // throws on bad credentials
signOut(setAccount): void                                   // clears currentAccountId from AsyncStorage
restoreSession(): Promise<Account | null>                   // checks currentAccountId on launch
updateAccount(account: Account): Promise<Account>           // saves updated account
hashPassword(password: string): string                      // SHA-256 hex, sync
```

---

## Feature 1: Sign-Up / Sign-In Modal

Single bottom-sheet modal with two tabs: **Sign In** (default) and **Create Account**.

### Sign-In tab
- Email + Password fields
- "Sign In" button — looks up account by lowercase email, compares `hashPassword(input)` to stored hash
- Inline errors: "No account found for this email" / "Incorrect password"
- On success: set `currentAccount` state in app, persist `currentAccountId` to AsyncStorage

### Create Account tab
- Name, Email, Password fields
- Avatar: tappable circle placeholder → `expo-image-picker` sheet (Camera / Gallery)
- Avatar is **required** — Create Account button disabled until photo chosen
- On submit: check email uniqueness → call `signUp()` → auto sign-in
- Inline error: "An account with this email already exists"

### Session restore
On app mount, `restoreSession()` is called. If `currentAccountId` exists in AsyncStorage and the account is found, the user is silently restored — no login prompt.

---

## Feature 2: Header Integration

### Not logged in
- Right side of header: `Sign In` text button (replaces profile type dropdown)
- Tapping opens the sign-in/sign-up modal

### Logged in
- Right side: user's `avatarUri` in a 32px circle + first name (truncated at 10 chars)
- Tapping opens the Profile screen (bottom-sheet modal)
- Profile type dropdown is **removed** — discount type comes from the account

---

## Feature 3: Profile Screen

Bottom-sheet modal, opened from header avatar tap.

Sections:
1. **Identity** — large avatar (60px), name, email (read-only)
2. **Discount type** — three buttons: None / Student / Senior. Currently active type highlighted. Changing type:
   - If currently `'approved'`: show Alert "Switching discount type requires re-verification. Your verified status will be reset." → on confirm: clear `idPhotoUri`, `selfieUri`, set `status: 'unverified'`, update `discountType`, save, open verification flow
   - If not approved: just update `discountType`, save, open verification flow if new type is not `'none'`
3. **Verification status** — badge:
   - `—` (grey) when `discountType === 'none'`
   - `⏳ Pending verification` (amber) when `status === 'pending'`
   - `✅ Verified` (green) when `status === 'approved'`
   - `❌ Rejected` (red) when `status === 'rejected'` + "Re-submit ID" button
   - ID photo + selfie shown as small thumbnails when status is `'pending'` or `'approved'`
4. **Sign Out** button at bottom — calls `signOut()`, clears `currentAccount` state in app

---

## Feature 4: Verification Flow

4-step modal, opened when `discountType !== 'none'` and `status !== 'approved'`.

### Step 1 — Choose type (if not already set)
Two large cards: `🎓 Student` / `👴 Senior / Retired`. Tapping selects and advances to Step 2. (This step is skipped if `discountType` was already set before entering the flow.)

### Step 2 — Upload ID photo
- Instruction: "Take a photo of your [student card / senior ID]"
- Two buttons: `📷 Camera` / `🖼 Gallery` (via `expo-image-picker`)
- Photo preview shown after pick. "Next →" enabled once photo chosen.

### Step 3 — Take selfie
- Instruction: "Now take a selfie so we can match your face to the ID"
- Single button: `🤳 Take Selfie` (camera, front-facing preferred via `cameraType: 'front'`)
- Selfie preview shown. "Submit for Verification →" enabled once selfie taken.
- On submit: save both URIs to account, set `status: 'pending'`, `submittedAt: Date.now()`, save.

### Step 4 — Pending / result screen
- Shows both photos side by side with labels "ID Photo" and "Selfie"
- Shows `⏳ Verifying your identity...` spinner
- After 3-second `setTimeout`: set `status: 'approved'`, save account, re-render with `✅ Verified — discount activated!` success state
- Close button dismisses the modal

### Rejection path (UI only, not triggered by the 3-second flow)
If `status === 'rejected'` when profile screen opens, a "Re-submit ID" button is shown. Tapping it opens the verification flow at Step 2 with a note: "Your previous submission was rejected. Please re-upload a clear photo of your ID."

---

## Feature 5: Booking Flow Integration

### Discount pricing logic

```ts
function getDiscountedPrice(cls: ClassItem, account: Account | null): string {
  if (!account) return cls.basePrice.toFixed(2);  // not logged in → full price
  if (account.verification.status !== 'approved') return cls.basePrice.toFixed(2);  // unverified → full price
  if (account.discountType === 'student') return (cls.basePrice * (1 - cls.discounts.student / 100)).toFixed(2);
  if (account.discountType === 'retired') return (cls.basePrice * (1 - cls.discounts.retired / 100)).toFixed(2);
  return cls.basePrice.toFixed(2);
}
```

### Book button gating

1. User taps "Book" on a class card or class detail modal
2. **Not logged in** → open sign-in/sign-up modal. After successful sign-in, re-open booking modal automatically (pass `pendingBookingClass` state).
3. **Logged in, no discount or pending** → open booking confirmation modal at full price
4. **Logged in, discount approved** → open booking confirmation with discounted price + `🛡️ Verified {Student/Senior}` badge

### Price display in class cards and modals

- When discount is `approved`: show discounted price + small `🛡️` shield icon
- When discount is `pending`: show full price + `⏳ pending` label in small text
- Booking confirmation modal shows user's avatar + name at the top (pre-filled identity)

---

## Scope Boundaries

**In scope:**
- Sign-up / sign-in modal with avatar
- Session persistence via AsyncStorage
- Profile screen with discount type switching
- 4-step verification flow with ID photo + selfie via expo-image-picker
- 3-second auto-approve simulation
- Booking gate: must be logged in to book
- Discount only applied when `status === 'approved'`
- Header avatar/name when logged in

**Out of scope:**
- Real backend verification or face-matching API
- Password reset / forgot password
- Email verification
- Teacher accounts / teacher auth
- Push notifications for verification status
- Account deletion

---

## Dependencies to Install

```bash
npx expo install expo-image-picker expo-crypto @react-native-async-storage/async-storage
```

`expo-crypto` — for SHA-256 password hashing (sync, no native module issues on Expo)
`expo-image-picker` — for camera + gallery photo selection
`@react-native-async-storage/async-storage` — for session + account persistence

---

## Files Changed

| File | Change |
|---|---|
| `auth/AuthStore.ts` | New — account types, AsyncStorage CRUD, hashing |
| `auth/AuthModals.tsx` | New — all auth/profile/verification UI |
| `ClassBookingApp.tsx` | Import auth components, remove profile dropdown, add auth state, gate booking flow |
| `package.json` | Add 3 new dependencies |
