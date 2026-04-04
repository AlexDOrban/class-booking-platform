# Design: Web-to-React-Native Conversion of class-booking-platform_2.jsx

**Date:** 2026-04-04  
**Status:** Approved

---

## Overview

Convert `class-booking-platform_2.jsx` (web React with HTML/CSS) into a fully cross-platform React Native component that runs on iOS, Android, and web (via react-native-web). All existing functionality is preserved.

---

## File Structure

```
App.tsx                          ← modified: font loading, StatusBar, renders ClassBookingApp
ClassBookingApp.tsx              ← new: all state + views (student, teacher, modals, banner)
components/CustomDropdown.tsx    ← new: reusable picker replacing <select>
```

---

## Dependencies

- `expo-font` + `@expo-google-fonts/dm-sans` + `@expo-google-fonts/cormorant-garamond` — loaded in App.tsx via `useFonts`
- `expo-linear-gradient` — replaces CSS `linear-gradient()`
- `expo-linking` — replaces `<a href target="_blank">`
- All other primitives from `react-native` core

---

## App.tsx

- Calls `useFonts({ DMSans: …, CormorantGaramond: … })`
- Returns `null` (blank splash) until fonts are loaded
- Renders `<ClassBookingApp />` with `<StatusBar style="auto" />`

---

## ClassBookingApp.tsx

### State (identical to original)
- `dark`, `view` (student|teacher), `classes`, `selected`, `bookingModal`, `createModal`, `filterCategory`, `profileType`, `successMsg`, `newClass`

### Theme tokens (identical color values)
- `bg`, `surface`, `surfaceAlt`, `border`, `text`, `muted`, `accent`, `accentLight`, `green`, `amber`

### Layout
- Root: `<SafeAreaView>` wrapping a `<View style={{flex:1}}>`
- Header: plain `<View>` (sticky via being above the ScrollView, not `position:fixed`)
- Main content: `<ScrollView>` with `contentContainerStyle={{padding: 24}}`
- Class grid: `<View style={{flexDirection:'row', flexWrap:'wrap'}}>` — card width computed from `useWindowDimensions`: 1 column on <600px, 2 columns on ≥600px
- Teacher stats grid: same flex-wrap approach, 3 stat cards

### Element mapping
| Web | React Native |
|---|---|
| `<div>` | `<View>` |
| `<p>` / `<span>` / `<h1-3>` | `<Text>` |
| `<button>` | `<Pressable>` with pressed-state style fn |
| `<input>` / `<textarea>` | `<TextInput>` (multiline for textarea) |
| `<a href>` | `<Pressable>` + `Linking.openURL()` |
| `<select>` | `<CustomDropdown>` |
| CSS `linear-gradient` | `<LinearGradient>` |
| CSS `@keyframes` | `Animated` API |
| `position:fixed` modals | RN `<Modal>` |
| `position:fixed` header | header `<View>` above `<ScrollView>` |

### Animations
- **Dark toggle thumb:** `Animated.spring` on a shared `Animated.Value` (0→1), interpolated to `translateX(0→24)`
- **Modal slide-up:** `Animated.spring(slideAnim, {toValue:0})` starting from `translateY(40)` + opacity 0→1, triggered on mount inside each Modal
- **Success banner:** `Animated.sequence` — spring in (translateY -20→0, opacity 0→1), `Animated.delay(3000)`, timing out (opacity 1→0)

### Modals (all three use RN `<Modal animationType="fade">`)
- **Class detail modal:** `ScrollView` inside, `LinearGradient` colour bar at top, map buttons use `Linking.openURL`
- **Booking confirmation modal:** centered card, price summary, Cancel + Confirm buttons
- **Create class modal:** `ScrollView` inside, all `TextInput` fields, `CustomDropdown` for category, colour picker row, Create button

---

## CustomDropdown.tsx

```tsx
interface Props {
  value: string
  options: { label: string; value: string }[]
  onChange: (value: string) => void
  border: string
  surfaceAlt: string
  surface: string
  text: string
  muted: string
}
```

- `Pressable` trigger showing current label + `▾`
- `open` boolean state
- When open: renders a `<View style={{position:'absolute', zIndex:999}}>` list of option `Pressable` rows with subtle `Animated` fade-in
- Full-screen transparent backdrop `Pressable` to dismiss (rendered before the list in z-order)
- Used in: profile type selector (Regular/Student/Senior), category selector in create-class modal

---

## Preserved Functionality

- Student view: hero, category filter pills, profile type selector, class cards with discount pricing, "Book now" button
- Teacher view: stats cards (total classes, total students, avg fill rate), classes list with fill-rate progress bar, "View details" button
- Class detail modal: all info, map links (Google Maps + Apple Maps via Linking), book button
- Booking confirmation modal: price with discount label, confirm flow, success banner
- Create class modal: all fields, colour picker, discount preview, validation (disabled button until required fields filled)
- Dark mode toggle with animated thumb
